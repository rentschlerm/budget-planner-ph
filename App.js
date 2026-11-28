import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Linking } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { Ionicons } from '@expo/vector-icons';

import { loadData, saveData } from './src/storage';
import { DEFAULT_DATA } from './src/defaults';
import { currentMonth, todayISO, peso, uid, inMonth } from './src/utils';
import { colors, shadow } from './src/theme';
import { ExpenseModal, Toast } from './src/components';
import { KeyboardSafeView } from './src/keyboard';
import { autoCheckForUpdate } from './src/updater';
import { pickReceiptImage, readReceipt } from './src/receipt';
import HomeScreen from './src/screens/HomeScreen';
import ExpensesScreen from './src/screens/ExpensesScreen';
import BudgetScreen from './src/screens/BudgetScreen';
import MoveInScreen from './src/screens/MoveInScreen';
import SetupScreen from './src/screens/SetupScreen';

SplashScreen.preventAutoHideAsync().catch(() => {});

const TABS = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'expenses', label: 'History', icon: 'receipt' },
  { key: 'add', label: '', icon: 'add' }, // centre add button
  { key: 'budget', label: 'Plan', icon: 'wallet' },
  { key: 'movein', label: 'Move-in', icon: 'cube' },
];

const fresh = () => JSON.parse(JSON.stringify(DEFAULT_DATA));

// Bring older saved data up to date without losing anything.
function migrate(stored) {
  const d = { ...fresh(), ...stored };
  if (stored.setupDone === undefined) d.setupDone = (stored.expenses || []).length > 0;
  return d;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Main />
    </SafeAreaProvider>
  );
}

function Main() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('home');
  const [month, setMonth] = useState(currentMonth());
  const [expenseDraft, setExpenseDraft] = useState(null); // null = closed
  const [resetKey, setResetKey] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const dataRef = useRef(null);
  dataRef.current = data;

  useEffect(() => {
    loadData().then((stored) => {
      setData(stored ? migrate(stored) : fresh());
      SplashScreen.hideAsync().catch(() => {});
      autoCheckForUpdate();
    });
  }, []);

  const update = useCallback((fn) => {
    setData((prev) => {
      const next = fn(prev);
      saveData(next);
      return next;
    });
  }, []);

  const showToast = (t) => {
    clearTimeout(toastTimer.current);
    setToast(t);
    toastTimer.current = setTimeout(() => setToast(null), t.actionLabel ? 6000 : 3000);
  };

  // Friendly confirmation after every save: how much is left in that category.
  const confirmSaved = (exp, d, extra = {}) => {
    const cat = d.categories.find((c) => c.id === exp.categoryId);
    const monthOfExp = { y: Number(exp.date.slice(0, 4)), m: Number(exp.date.slice(5, 7)) - 1 };
    const spentInCat = d.expenses
      .filter((e) => e.categoryId === exp.categoryId && inMonth(e.date, monthOfExp))
      .reduce((s, e) => s + e.amount, 0);
    const left = cat ? cat.planned - spentInCat : 0;
    const tail = cat ? (left >= 0 ? ` · ${peso(left)} left` : ` · ${peso(-left)} over`) : '';
    showToast({ message: `${peso(exp.amount)} → ${cat ? cat.name : 'expense'}${tail}`, ...extra });
  };

  // Saves an expense synchronously so the confirmation can read the updated totals.
  const commitExpense = (exp, toastExtra) => {
    const d = dataRef.current;
    const exists = d.expenses.some((e) => e.id === exp.id);
    const next = { ...d, expenses: exists ? d.expenses.map((e) => (e.id === exp.id ? exp : e)) : [exp, ...d.expenses] };
    dataRef.current = next;
    setData(next);
    saveData(next);
    confirmSaved(exp, next, toastExtra);
  };

  const saveExpense = (exp) => commitExpense(exp);

  const deleteExpense = (id) => update((d) => ({ ...d, expenses: d.expenses.filter((e) => e.id !== id) }));

  // Snap a receipt → read it on-device → save automatically when we're confident, otherwise ask.
  const scanReceipt = async (source) => {
    setExpenseDraft(null);
    try {
      const uri = await pickReceiptImage(source);
      if (!uri) return;
      setScanning(true);
      const r = await readReceipt(uri, dataRef.current.categories);
      setScanning(false);
      const draft = {
        amount: r.amount || '',
        categoryId: r.categoryId,
        date: r.date || todayISO(),
        note: r.merchant,
      };
      if (r.amount && r.amountConfident && r.categoryId) {
        const exp = { ...draft, id: uid(), source: 'receipt' };
        commitExpense(exp, { icon: 'receipt', actionLabel: 'Edit', expense: exp });
      } else {
        setExpenseDraft({ ...draft, scan: { amount: r.amount } });
      }
    } catch (e) {
      setScanning(false);
      if (e && e.code === 'permission') {
        Alert.alert('Camera access needed', 'Allow camera access to scan receipts.', [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open settings', onPress: () => Linking.openSettings() },
        ]);
      } else {
        Alert.alert("Couldn't read that receipt", 'Try again with better lighting, or add it manually.', [
          { text: 'OK', style: 'cancel' },
          { text: 'Add manually', onPress: () => setExpenseDraft({}) },
        ]);
      }
    }
  };

  const resetAll = () => {
    const d = fresh();
    setData(d);
    saveData(d);
    setResetKey((k) => k + 1);
    setTab('home');
  };

  if (!data) return <View style={{ flex: 1, backgroundColor: colors.primary }} />;

  if (!data.setupDone) {
    return (
      <>
        <StatusBar style="dark" />
        <SetupScreen
          data={data}
          onFinish={(d) => {
            setData(d);
            saveData(d);
            setTab('home');
          }}
        />
      </>
    );
  }

  const shared = { data, update, month, setMonth };
  const tabBarHeight = 64 + Math.max(insets.bottom, 10);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={tab === 'home' ? 'light' : 'dark'} />
      <KeyboardSafeView key={resetKey}>
        {tab === 'home' && (
          <HomeScreen
            {...shared}
            goTo={setTab}
            onScan={scanReceipt}
            onAddExpense={(draft) => setExpenseDraft(draft || {})}
            onEditExpense={(e) => setExpenseDraft(e)}
          />
        )}
        {tab === 'expenses' && <ExpensesScreen {...shared} onEditExpense={(e) => setExpenseDraft(e)} />}
        {tab === 'budget' && <BudgetScreen {...shared} onReset={resetAll} />}
        {tab === 'movein' && <MoveInScreen {...shared} />}
      </KeyboardSafeView>

      <Toast
        toast={toast}
        bottom={tabBarHeight + 12}
        onAction={() => {
          const exp = toast && toast.expense;
          setToast(null);
          if (exp) setExpenseDraft(dataRef.current.expenses.find((e) => e.id === exp.id) || exp);
        }}
      />

      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {TABS.map((t) => {
          if (t.key === 'add') {
            return (
              <View key="add" style={styles.tab}>
                <TouchableOpacity style={styles.addBtn} onPress={() => setExpenseDraft({})} activeOpacity={0.85} accessibilityLabel="Add expense">
                  <Ionicons name="add" size={32} color="#fff" />
                </TouchableOpacity>
              </View>
            );
          }
          const active = t.key === tab;
          return (
            <TouchableOpacity key={t.key} style={styles.tab} onPress={() => setTab(t.key)} activeOpacity={0.7}>
              <View style={[styles.iconPill, active && { backgroundColor: colors.primarySoft }]}>
                <Ionicons name={active ? t.icon : `${t.icon}-outline`} size={22} color={active ? colors.primary : colors.muted} />
              </View>
              <Text style={[styles.tabLabel, active && { color: colors.primary, fontWeight: '700' }]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ExpenseModal
        visible={expenseDraft !== null}
        initial={expenseDraft}
        categories={data.categories}
        onClose={() => setExpenseDraft(null)}
        onSave={saveExpense}
        onDelete={deleteExpense}
        onScan={scanReceipt}
      />

      {scanning ? (
        <View style={styles.scanOverlay}>
          <View style={styles.scanBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 14, fontSize: 16, fontWeight: '700', color: colors.text }}>Reading your receipt…</Text>
            <Text style={{ marginTop: 4, color: colors.muted, fontSize: 13 }}>This happens on your phone</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingTop: 8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...shadow,
    elevation: 12,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconPill: { paddingHorizontal: 16, paddingVertical: 4, borderRadius: 999 },
  tabLabel: { fontSize: 11, color: colors.muted, marginTop: 2 },
  addBtn: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30,
    borderWidth: 4,
    borderColor: colors.bg,
    ...shadow,
    elevation: 8,
  },
  scanOverlay: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(15,23,42,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  scanBox: { backgroundColor: '#fff', borderRadius: 24, paddingVertical: 28, paddingHorizontal: 36, alignItems: 'center' },
});
