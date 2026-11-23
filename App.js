import { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { loadData, saveData } from './src/storage';
import { DEFAULT_DATA } from './src/defaults';
import { currentMonth } from './src/utils';
import { colors } from './src/theme';
import { ExpenseModal } from './src/components';
import { autoCheckForUpdate } from './src/updater';
import HomeScreen from './src/screens/HomeScreen';
import ExpensesScreen from './src/screens/ExpensesScreen';
import BudgetScreen from './src/screens/BudgetScreen';
import MoveInScreen from './src/screens/MoveInScreen';

const TABS = [
  { key: 'home', label: 'Home', icon: '📊' },
  { key: 'expenses', label: 'Expenses', icon: '🧾' },
  { key: 'budget', label: 'Budget', icon: '🗂️' },
  { key: 'movein', label: 'Move-in', icon: '📦' },
];

const fresh = () => JSON.parse(JSON.stringify(DEFAULT_DATA));

export default function App() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('home');
  const [month, setMonth] = useState(currentMonth());
  const [expenseDraft, setExpenseDraft] = useState(null); // null = closed
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    loadData().then((stored) => setData(stored ? { ...fresh(), ...stored } : fresh()));
    autoCheckForUpdate();
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

  if (!data) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const shared = { data, update, month, setMonth };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'bottom']}>
        <StatusBar style="dark" />
        <View style={{ flex: 1 }} key={resetKey}>
          {tab === 'home' && <HomeScreen {...shared} onAddExpense={(draft) => setExpenseDraft(draft || {})} />}
          {tab === 'expenses' && <ExpensesScreen {...shared} onEditExpense={(e) => setExpenseDraft(e)} />}
          {tab === 'budget' && <BudgetScreen {...shared} onReset={resetAll} />}
          {tab === 'movein' && <MoveInScreen {...shared} />}
        </View>

        {(tab === 'home' || tab === 'expenses') && (
          <TouchableOpacity style={styles.fab} onPress={() => setExpenseDraft({})} accessibilityLabel="Add expense">
            <Text style={styles.fabText}>＋</Text>
          </TouchableOpacity>
        )}

        <View style={styles.tabBar}>
          {TABS.map((t) => {
            const active = t.key === tab;
            return (
              <TouchableOpacity key={t.key} style={styles.tab} onPress={() => setTab(t.key)}>
                <Text style={{ fontSize: 20, opacity: active ? 1 : 0.5 }}>{t.icon}</Text>
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
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: '#fff',
    paddingTop: 8,
    paddingBottom: 6,
  },
  tab: { flex: 1, alignItems: 'center' },
  tabLabel: { fontSize: 12, color: colors.muted, marginTop: 2 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabText: { color: '#fff', fontSize: 30, fontWeight: '600', marginTop: -2 },
});
