import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, ui } from '../theme';
import { peso, inMonth, monthLabel, shiftMonth, currentMonth, prettyDate } from '../utils';
import { ProgressBar, MonthSwitcher, CatIcon, SectionHeader, EmptyState } from '../components';

export default function HomeScreen({ data, month, setMonth, onAddExpense, onEditExpense, onScan, goTo }) {
  const insets = useSafeAreaInsets();
  const { income, categories, expenses, payFrequency } = data;
  const monthExpenses = expenses.filter((e) => inMonth(e.date, month));
  const spent = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const left = income - spent;

  const now = new Date();
  const cm = currentMonth();
  const isCurrent = cm.y === month.y && cm.m === month.m;
  const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
  const daysLeft = isCurrent ? daysInMonth - now.getDate() + 1 : 0;
  const perDay = daysLeft > 0 ? Math.max(left, 0) / daysLeft : 0;

  // Current payday cut-off (1–15 or 16–end), only for the current month.
  let cutoff = null;
  if (isCurrent && payFrequency === 'semi-monthly') {
    const first = now.getDate() <= 15;
    const inCut = monthExpenses
      .filter((e) => (Number(e.date.slice(8, 10)) <= 15) === first)
      .reduce((s, e) => s + e.amount, 0);
    cutoff = { label: first ? '1st–15th' : `16th–${daysInMonth}th`, left: income / 2 - inCut };
  }

  const catById = {};
  categories.forEach((c) => (catById[c.id] = c));
  const spentByCat = {};
  monthExpenses.forEach((e) => (spentByCat[e.categoryId] = (spentByCat[e.categoryId] || 0) + e.amount));

  // Only surface categories that need attention (80%+ used), skipping savings and fixed costs.
  const watch = categories
    .filter((c) => c.group !== 'savings' && c.planned > 0)
    .map((c) => ({ c, s: spentByCat[c.id] || 0 }))
    .filter(({ c, s }) => s / c.planned >= 0.8)
    .sort((a, b) => b.s / b.c.planned - a.s / a.c.planned)
    .slice(0, 3);

  const recent = [...monthExpenses].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)).slice(0, 3);

  return (
    <ScrollView style={ui.screen} contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
      <View
        style={{
          backgroundColor: colors.primary,
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 64,
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
        }}
      >
        <View style={[ui.between, { marginBottom: 20 }]}>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '600' }}>{greeting()}</Text>
          <View style={{ width: 140 }}>
            <MonthSwitcher light label={shortMonth(month)} onPrev={() => setMonth(shiftMonth(month, -1))} onNext={() => setMonth(shiftMonth(month, 1))} />
          </View>
        </View>

        <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '700', letterSpacing: 0.6 }}>
          {left < 0 ? 'OVERSPENT BY' : 'YOU CAN STILL SPEND'}
        </Text>
        <Text style={{ color: '#fff', fontSize: 44, fontWeight: '800', letterSpacing: -1 }} numberOfLines={1} adjustsFontSizeToFit>
          {peso(Math.abs(left))}
        </Text>
        {isCurrent && left > 0 ? (
          <Text style={{ color: '#ccfbf1', fontSize: 15, marginTop: 2 }}>
            That's <Text style={{ fontWeight: '800', color: '#fff' }}>{peso(perDay)}/day</Text> for {daysLeft} more day{daysLeft === 1 ? '' : 's'}
          </Text>
        ) : null}
        <View style={{ marginTop: 16 }}>
          <ProgressBar value={spent} max={income} height={8} color="#5eead4" track="rgba(255,255,255,0.18)" />
        </View>
        <View style={[ui.between, { marginTop: 8 }]}>
          <Text style={{ color: '#ccfbf1', fontSize: 13 }}>Spent {peso(spent)}</Text>
          <Text style={{ color: '#ccfbf1', fontSize: 13 }}>of {peso(income)}</Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, marginTop: -40 }}>
        {/* Two big, obvious actions */}
        <View style={[ui.row, { marginBottom: 14 }]}>
          <ActionTile icon="camera" title="Scan receipt" sub="Snap & auto-record" onPress={() => onScan('camera')} primary />
          <View style={{ width: 12 }} />
          <ActionTile icon="create-outline" title="Add manually" sub="Type an amount" onPress={() => onAddExpense({})} />
        </View>

        {cutoff ? (
          <View style={[ui.card, ui.row]}>
            <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: cutoff.left < 0 ? colors.dangerSoft : colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="calendar" size={20} color={cutoff.left < 0 ? colors.danger : colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={ui.muted}>This cut-off ({cutoff.label})</Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: cutoff.left < 0 ? colors.danger : colors.text }}>
                {cutoff.left < 0 ? `${peso(-cutoff.left)} over` : `${peso(cutoff.left)} left`}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={ui.card}>
          <SectionHeader title={watch.length ? 'Heads up' : 'Your plan'} action="View plan" onAction={() => goTo('budget')} />
          {watch.length === 0 ? (
            <View style={ui.row}>
              <Ionicons name="checkmark-circle" size={22} color={colors.good} />
              <Text style={[ui.sub, { marginLeft: 8, flex: 1 }]}>
                {monthExpenses.length ? 'Every category is on track. Nice!' : 'Nothing spent yet this month.'}
              </Text>
            </View>
          ) : (
            watch.map(({ c, s }) => {
              const over = s > c.planned;
              return (
                <View key={c.id} style={[ui.row, { paddingVertical: 8 }]}>
                  <CatIcon category={c} size={38} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={ui.between}>
                      <Text style={{ fontWeight: '600', color: colors.text, flex: 1 }} numberOfLines={1}>{c.name}</Text>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: over ? colors.danger : colors.warn }}>
                        {over ? `${peso(s - c.planned)} over` : `${peso(c.planned - s)} left`}
                      </Text>
                    </View>
                    <View style={{ marginTop: 6 }}>
                      <ProgressBar value={s} max={c.planned} color={over ? colors.danger : colors.accent} height={6} />
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={ui.card}>
          <SectionHeader title="Recent" action={monthExpenses.length > 3 ? 'See all' : null} onAction={() => goTo('expenses')} />
          {recent.length === 0 ? (
            <EmptyState icon="receipt-outline" title="No expenses yet" text="Scan a receipt or tap + to add one." />
          ) : (
            recent.map((e, i) => {
              const c = catById[e.categoryId];
              return (
                <TouchableOpacity key={e.id} onPress={() => onEditExpense(e)} style={[ui.row, { paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderTopColor: colors.track }]}>
                  <CatIcon category={c} size={40} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }} numberOfLines={1}>{e.note || (c ? c.name : 'Deleted category')}</Text>
                    <Text style={ui.muted}>
                      {prettyDate(e.date)}
                      {e.source === 'receipt' ? '  ·  📷 receipt' : ''}
                    </Text>
                  </View>
                  <Text style={{ fontWeight: '700', color: colors.text }}>-{peso(e.amount)}</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function ActionTile({ icon, title, sub, onPress, primary }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[ui.card, { flex: 1, marginBottom: 0, backgroundColor: primary ? colors.primaryDark : colors.card }]}
    >
      <View style={{ width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: primary ? 'rgba(255,255,255,0.14)' : colors.primarySoft }}>
        <Ionicons name={icon} size={22} color={primary ? '#fff' : colors.primary} />
      </View>
      <Text style={{ marginTop: 12, fontSize: 16, fontWeight: '800', color: primary ? '#fff' : colors.text }}>{title}</Text>
      <Text style={{ fontSize: 12, marginTop: 2, color: primary ? '#99f6e4' : colors.muted }}>{sub}</Text>
    </TouchableOpacity>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Magandang umaga 👋';
  if (h < 18) return 'Magandang hapon 👋';
  return 'Magandang gabi 👋';
}

function shortMonth({ y, m }) {
  return monthLabel({ y, m }).replace(/^(\w{3})\w*/, '$1');
}
