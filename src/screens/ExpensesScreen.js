import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { colors, ui } from '../theme';
import { peso, inMonth, monthLabel, shiftMonth, prettyDate } from '../utils';
import { MonthSwitcher } from '../components';

export default function ExpensesScreen({ data, month, setMonth, onEditExpense }) {
  const catById = {};
  data.categories.forEach((c) => (catById[c.id] = c));

  const list = data.expenses
    .filter((e) => inMonth(e.date, month))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const byDate = [];
  list.forEach((e) => {
    const last = byDate[byDate.length - 1];
    if (last && last.date === e.date) last.items.push(e);
    else byDate.push({ date: e.date, items: [e] });
  });

  const total = list.reduce((s, e) => s + e.amount, 0);

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.content}>
      <Text style={ui.h1}>Expenses</Text>
      <Text style={[ui.muted, { marginBottom: 12 }]}>Tap an entry to edit or delete it.</Text>
      <MonthSwitcher
        label={monthLabel(month)}
        onPrev={() => setMonth(shiftMonth(month, -1))}
        onNext={() => setMonth(shiftMonth(month, 1))}
      />

      <View style={[ui.card, ui.between]}>
        <Text style={{ color: colors.muted }}>{list.length} expenses</Text>
        <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>{peso(total, true)}</Text>
      </View>

      {byDate.length === 0 ? (
        <View style={[ui.card, { alignItems: 'center', paddingVertical: 32 }]}>
          <Text style={{ fontSize: 36 }}>🧾</Text>
          <Text style={[ui.muted, { marginTop: 8, textAlign: 'center' }]}>
            No expenses yet this month.{'\n'}Tap the + button to log one.
          </Text>
        </View>
      ) : (
        byDate.map((group) => {
          const dayTotal = group.items.reduce((s, e) => s + e.amount, 0);
          return (
            <View key={group.date} style={ui.card}>
              <View style={[ui.between, { marginBottom: 6 }]}>
                <Text style={{ fontWeight: '700', color: colors.text }}>{prettyDate(group.date)}</Text>
                <Text style={ui.muted}>{peso(dayTotal, true)}</Text>
              </View>
              {group.items.map((e) => {
                const c = catById[e.categoryId];
                return (
                  <TouchableOpacity key={e.id} onPress={() => onEditExpense(e)} style={[ui.between, { paddingVertical: 10 }]}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={{ color: colors.text, fontSize: 15 }} numberOfLines={1}>
                        {c ? `${c.icon} ${c.name}` : '❔ Deleted category'}
                      </Text>
                      {e.note ? <Text style={ui.muted} numberOfLines={1}>{e.note}</Text> : null}
                    </View>
                    <Text style={{ fontWeight: '700', color: colors.text }}>{peso(e.amount, true)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}
