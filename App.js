import { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { Ionicons } from '@expo/vector-icons';

import { loadData, saveData } from './src/storage';
import { DEFAULT_DATA } from './src/defaults';
import { currentMonth } from './src/utils';
import { colors, shadow } from './src/theme';
import { ExpenseModal } from './src/components';
import { autoCheckForUpdate } from './src/updater';
import HomeScreen from './src/screens/HomeScreen';
import ExpensesScreen from './src/screens/ExpensesScreen';
import BudgetScreen from './src/screens/BudgetScreen';
import MoveInScreen from './src/screens/MoveInScreen';

SplashScreen.preventAutoHideAsync().catch(() => {});

const TABS = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'expenses', label: 'Expenses', icon: 'receipt' },
  { key: 'add', label: '', icon: 'add' }, // centre add button
  { key: 'budget', label: 'Budget', icon: 'wallet' },
  { key: 'movein', label: 'Move-in', icon: 'cube' },
];

const fresh = () => JSON.parse(JSON.stringify(DEFAULT_DATA));

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

  useEffect(() => {
    loadData().then((stored) => {
      setData(stored ? { ...fresh(), ...stored } : fresh());
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

  const saveExpense = (exp) =>
    update((d) => {
      const exists = d.expenses.some((e) => e.id === exp.id);
      return { ...d, expenses: exists ? d.expenses.map((e) => (e.id === exp.id ? exp : e)) : [exp, ...d.expenses] };
    });

  const deleteExpense = (id) => update((d) => ({ ...d, expenses: d.expenses.filter((e) => e.id !== id) }));

  const resetAll = () => {
    const d = fresh();
    setData(d);
    saveData(d);
    setResetKey((k) => k + 1);
    setTab('home');
  };

  if (!data) return <View style={{ flex: 1, backgroundColor: colors.primary }} />;

  const shared = { data, update, month, setMonth };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={tab === 'home' ? 'light' : 'dark'} />
      <View style={{ flex: 1 }} key={resetKey}>
        {tab === 'home' && (
          <HomeScreen
            {...shared}
            goTo={setTab}
            onAddExpense={(draft) => setExpenseDraft(draft || {})}
            onEditExpense={(e) => setExpenseDraft(e)}
          />
        )}
        {tab === 'expenses' && <ExpensesScreen {...shared} onEditExpense={(e) => setExpenseDraft(e)} />}
        {tab === 'budget' && <BudgetScreen {...shared} onReset={resetAll} />}
        {tab === 'movein' && <MoveInScreen {...shared} />}
      </View>

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
      />
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
});
