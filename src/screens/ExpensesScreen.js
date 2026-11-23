import { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { colors, ui } from '../theme';
import { peso, inMonth, monthLabel, shiftMonth, prettyDate, todayISO, toISODate } from '../utils';
import { MonthSwitcher, ScreenHeader, CatIcon, EmptyState, Chip } from '../components';

export default function ExpensesScreen({ data, month, setMonth, onEditExpense }) {
  const [filter, setFilter] = useState(null);
  const catById = {};
  data.categories.forEach((c) => (catById[c.id] = c));

  const monthList = data.expenses.filter((e) => inMonth(e.date, month));
  const usedCats = data.categories.filter((c) => monthList.some((e) => e.categoryId === c.id));
  const list = monthList
    .filter((e) => !filter || e.categoryId === filter)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const byDate = [];
  list.forEach((e) => {
    const last = byDate[byDate.length - 1];
    if (last && last.date === e.date) last.items.push(e);
    else byDate.push({ date: e.date, items: [e] });
  });

  const total = list.reduce((s, e) => s + e.amount, 0);
  const today = todayISO();
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const yesterday = toISODate(y);
  const dayLabel = (d) => (d === today ? 'Today' : d === yesterday ? 'Yesterday' : prettyDate(d));

  return (
    <View style={ui.screen}>
      <ScreenHeader title="History" subtitle="Tap an entry to edit or delete it" />
      <ScrollView contentContainerStyle={ui.content} showsVerticalScrollIndicator={false}>
        <MonthSwitcher label={monthLabel(month)} onPrev={() => setMonth(shiftMonth(month, -1))} onNext={() => setMonth(shiftMonth(month, 1))} />

        <View style={[ui.card, { marginTop: 14, backgroundColor: colors.primary }]}>
          <Text style={{ color: '#ccfbf1', fontSize: 13, fontWeight: '600' }}>
            {filter && catById[filter] ? `Spent on ${catById[filter].name}` : 'Total spent'}
          </Text>
          <Text style={{ color: '#fff', fontSize: 30, fontWeight: '800', marginTop: 2 }}>{peso(total, true)}</Text>
          <Text style={{ color: '#ccfbf1', fontSize: 13, marginTop: 2 }}>
            {list.length} expense{list.length === 1 ? '' : 's'}
          </Text>
        </View>

        {usedCats.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 6 }} contentContainerStyle={{ paddingRight: 16 }}>
            <Chip label="All" active={!filter} onPress={() => setFilter(null)} />
            {usedCats.map((c) => (
              <Chip key={c.id} label={`${c.icon} ${c.name}`} active={filter === c.id} onPress={() => setFilter(filter === c.id ? null : c.id)} />
            ))}
          </ScrollView>
        ) : null}

        {byDate.length === 0 ? (
          <View style={ui.card}>
            <EmptyState icon="receipt-outline" title="Nothing here yet" text="Tap the + button to log what you spend." />
          </View>
        ) : (
          byDate.map((group) => {
            const dayTotal = group.items.reduce((s, e) => s + e.amount, 0);
            return (
              <View key={group.date} style={{ marginBottom: 6 }}>
                <View style={[ui.between, { paddingHorizontal: 4, marginBottom: 8, marginTop: 6 }]}>
                  <Text style={{ fontWeight: '700', color: colors.sub, fontSize: 13 }}>{dayLabel(group.date).toUpperCase()}</Text>
                  <Text style={[ui.muted, { fontWeight: '600' }]}>{peso(dayTotal, true)}</Text>
                </View>
                <View style={[ui.card, { paddingVertical: 4 }]}>
                  {group.items.map((e, i) => {
                    const c = catById[e.categoryId];
                    return (
                      <TouchableOpacity
                        key={e.id}
                        onPress={() => onEditExpense(e)}
                        style={[ui.row, { paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: colors.track }]}
                        activeOpacity={0.6}
                      >
                        <CatIcon category={c} size={40} />
                        <View style={{ flex: 1, marginLeft: 12, paddingRight: 8 }}>
                          <Text style={{ color: colors.text, fontSize: 15, fontWeight: '600' }} numberOfLines={1}>
                            {e.note || (c ? c.name : 'Deleted category')}
                          </Text>
                          <Text style={ui.muted} numberOfLines={1}>{c ? c.name : 'Deleted category'}{e.source === 'receipt' ? '  ·  📷 receipt' : ''}</Text>
                        </View>
                        <Text style={{ fontWeight: '700', color: colors.text, fontSize: 15 }}>-{peso(e.amount, true)}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
