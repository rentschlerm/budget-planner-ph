import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, ui } from '../theme';
import { GROUPS } from '../defaults';
import { peso, inMonth, monthLabel, shiftMonth, currentMonth, prettyDate } from '../utils';
import { ProgressBar, MonthSwitcher, CatIcon, SectionHeader, EmptyState } from '../components';

export default function HomeScreen({ data, update, month, setMonth, onAddExpense, onEditExpense, goTo }) {
  const insets = useSafeAreaInsets();
  const { income, categories, expenses, payFrequency } = data;
  const monthExpenses = expenses.filter((e) => inMonth(e.date, month));

  const planned = categories.reduce((s, c) => s + (c.planned || 0), 0);
  const spent = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const left = income - spent;

  const now = new Date();
  const cm = currentMonth();
  const isCurrent = cm.y === month.y && cm.m === month.m;
  const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
  const daysLeft = isCurrent ? daysInMonth - now.getDate() + 1 : 0;
  const perDay = daysLeft > 0 ? Math.max(left, 0) / daysLeft : 0;

  const catById = {};
  categories.forEach((c) => (catById[c.id] = c));
  const spentByCat = {};
  monthExpenses.forEach((e) => (spentByCat[e.categoryId] = (spentByCat[e.categoryId] || 0) + e.amount));

  const plannedByGroup = { needs: 0, wants: 0, savings: 0 };
  categories.forEach((c) => (plannedByGroup[c.group] = (plannedByGroup[c.group] || 0) + (c.planned || 0)));

  const firstHalf = monthExpenses.filter((e) => Number(e.date.slice(8, 10)) <= 15).reduce((s, e) => s + e.amount, 0);
  const secondHalf = spent - firstHalf;

  const recent = [...monthExpenses]
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, 4);

  const sortedCats = [...categories].sort((a, b) => {
    const ra = a.planned > 0 ? (spentByCat[a.id] || 0) / a.planned : 0;
    const rb = b.planned > 0 ? (spentByCat[b.id] || 0) / b.planned : 0;
    return rb - ra;
  });

  const unplanned = income - planned;

  return (
    <ScrollView style={ui.screen} contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View
        style={{
          backgroundColor: colors.primary,
          paddingTop: insets.top + 12,
          paddingHorizontal: 16,
          paddingBottom: 72,
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
        }}
      >
        <View style={[ui.between, { marginBottom: 16 }]}>
          <View>
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14 }}>{greeting()}</Text>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>Your budget</Text>
          </View>
          <View style={{ width: 150 }}>
            <MonthSwitcher light label={shortMonth(month)} onPrev={() => setMonth(shiftMonth(month, -1))} onNext={() => setMonth(shiftMonth(month, 1))} />
          </View>
        </View>

        <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600', letterSpacing: 0.5 }}>
          {left < 0 ? 'OVERSPENT BY' : 'LEFT TO SPEND'}
        </Text>
        <Text style={{ color: '#fff', fontSize: 42, fontWeight: '800', letterSpacing: -1, marginTop: 2 }} numberOfLines={1} adjustsFontSizeToFit>
          {peso(Math.abs(left))}
        </Text>
        {isCurrent && left > 0 ? (
          <View style={[ui.row, { marginTop: 6 }]}>
            <Ionicons name="sunny-outline" size={15} color="#99f6e4" />
            <Text style={{ color: '#ccfbf1', marginLeft: 6, fontSize: 14 }}>
              About <Text style={{ fontWeight: '800', color: '#fff' }}>{peso(perDay)}</Text> a day for {daysLeft} day{daysLeft === 1 ? '' : 's'}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Summary card overlapping hero */}
      <View style={{ paddingHorizontal: 16, marginTop: -52 }}>
        <View style={ui.card}>
          <View style={[ui.row, { marginBottom: 14 }]}>
            <Stat icon="arrow-down-circle" color={colors.good} label="Income" value={peso(income)} />
            <View style={{ width: 1, alignSelf: 'stretch', backgroundColor: colors.border, marginHorizontal: 8 }} />
            <Stat icon="arrow-up-circle" color={colors.danger} label="Spent" value={peso(spent)} />
            <View style={{ width: 1, alignSelf: 'stretch', backgroundColor: colors.border, marginHorizontal: 8 }} />
            <Stat icon="pie-chart" color={colors.primary} label="Planned" value={peso(planned)} />
          </View>
          <ProgressBar value={spent} max={income} height={10} />
          <View style={[ui.between, { marginTop: 8 }]}>
            <Text style={ui.muted}>{income > 0 ? Math.round((spent / income) * 100) : 0}% of income used</Text>
            {unplanned < 0 ? (
              <Text style={{ color: colors.danger, fontSize: 13, fontWeight: '600' }}>Plan over by {peso(-unplanned)}</Text>
            ) : unplanned > 0 ? (
              <Text style={{ color: colors.warn, fontSize: 13, fontWeight: '600' }}>{peso(unplanned)} unassigned</Text>
            ) : (
              <Text style={{ color: colors.good, fontSize: 13, fontWeight: '600' }}>Fully planned ✓</Text>
            )}
          </View>
        </View>

        {!data.setupDone ? (
          <View style={[ui.card, { backgroundColor: colors.primaryDark }]}>
            <View style={ui.row}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="rocket-outline" size={22} color="#fff" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>Let's set you up</Text>
                <Text style={{ color: '#ccfbf1', fontSize: 13, marginTop: 2 }}>
                  The amounts here are just examples. Enter your real pay, rent and bills.
                </Text>
              </View>
            </View>
            <View style={[ui.row, { marginTop: 14 }]}>
              <TouchableOpacity style={[ui.btn, { flex: 1, backgroundColor: '#fff', paddingVertical: 12 }]} onPress={() => goTo('budget')}>
                <Text style={[ui.btnText, { color: colors.primaryDark }]}>Set up my budget</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ paddingHorizontal: 16, paddingVertical: 12 }} onPress={() => update((d) => ({ ...d, setupDone: true }))}>
                <Text style={{ color: '#ccfbf1', fontWeight: '600' }}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {payFrequency === 'semi-monthly' ? (
          <View style={ui.card}>
            <SectionHeader title="Per payday" />
            <View style={ui.row}>
              <PaydayTile label="1st – 15th" spent={firstHalf} budget={income / 2} />
              <View style={{ width: 12 }} />
              <PaydayTile label="16th – end" spent={secondHalf} budget={income / 2} />
            </View>
          </View>
        ) : null}

        <View style={ui.card}>
          <SectionHeader title="Recent" action={monthExpenses.length ? 'See all' : null} onAction={() => goTo('expenses')} />
          {recent.length === 0 ? (
            <EmptyState icon="receipt-outline" title="No expenses yet" text={'Tap + to log your first one.'} />
          ) : (
            recent.map((e, i) => {
              const c = catById[e.categoryId];
              return (
                <TouchableOpacity key={e.id} onPress={() => onEditExpense(e)} style={[ui.row, { paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderTopColor: colors.track }]}>
                  <CatIcon category={c} size={40} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }} numberOfLines={1}>{e.note || (c ? c.name : 'Deleted category')}</Text>
                    <Text style={ui.muted}>{c && e.note ? `${c.name} · ` : ''}{prettyDate(e.date)}</Text>
                  </View>
                  <Text style={{ fontWeight: '700', color: colors.text }}>-{peso(e.amount)}</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={ui.card}>
          <SectionHeader title="Spending plan" action="Edit" onAction={() => goTo('budget')} />
          <SplitBar plannedByGroup={plannedByGroup} income={income} />
          <View style={{ height: 8 }} />
          {sortedCats.map((c) => {
            const s = spentByCat[c.id] || 0;
            const remaining = (c.planned || 0) - s;
            const g = GROUPS[c.group];
            return (
              <TouchableOpacity key={c.id} onPress={() => onAddExpense({ categoryId: c.id })} style={[ui.row, { paddingVertical: 10 }]} activeOpacity={0.6}>
                <CatIcon category={c} size={40} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={ui.between}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text, flex: 1 }} numberOfLines={1}>{c.name}</Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: remaining < 0 ? colors.danger : colors.sub }}>
                      {remaining < 0 ? `${peso(-remaining)} over` : `${peso(remaining)} left`}
                    </Text>
                  </View>
                  <View style={{ marginTop: 6 }}>
                    <ProgressBar value={s} max={c.planned} color={g ? g.color : colors.primary} height={6} />
                  </View>
                  <Text style={[ui.muted, { marginTop: 4, fontSize: 12 }]}>{peso(s)} of {peso(c.planned)}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </ScrollView>
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

function Stat({ icon, color, label, value }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={ui.row}>
        <Ionicons name={icon} size={14} color={color} />
        <Text style={[ui.muted, { marginLeft: 4, fontSize: 12 }]}>{label}</Text>
      </View>
      <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 4 }} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

function PaydayTile({ label, spent, budget }) {
  const over = spent > budget;
  return (
    <View style={{ flex: 1, backgroundColor: over ? colors.dangerSoft : '#f8fafc', borderRadius: 16, padding: 12 }}>
      <Text style={[ui.muted, { fontSize: 12 }]}>{label}</Text>
      <Text style={{ fontSize: 17, fontWeight: '800', color: over ? colors.danger : colors.text, marginTop: 4 }} numberOfLines={1} adjustsFontSizeToFit>
        {peso(spent)}
      </Text>
      <Text style={[ui.muted, { fontSize: 12, marginBottom: 8 }]}>of {peso(budget)}</Text>
      <ProgressBar value={spent} max={budget} height={6} />
    </View>
  );
}

// One stacked bar showing how the plan splits into needs / wants / savings vs the 50/30/20 guideline.
function SplitBar({ plannedByGroup, income }) {
  const keys = Object.keys(GROUPS);
  const total = Math.max(income, keys.reduce((s, k) => s + plannedByGroup[k], 0), 1);
  return (
    <View>
      <View style={{ flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', backgroundColor: colors.track }}>
        {keys.map((k) => (
          <View key={k} style={{ width: `${(plannedByGroup[k] / total) * 100}%`, backgroundColor: GROUPS[k].color }} />
        ))}
      </View>
      <View style={[ui.row, { marginTop: 10, flexWrap: 'wrap' }]}>
        {keys.map((k) => {
          const pct = income > 0 ? Math.round((plannedByGroup[k] / income) * 100) : 0;
          return (
            <View key={k} style={[ui.row, { marginRight: 14, marginBottom: 4 }]}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: GROUPS[k].color, marginRight: 6 }} />
              <Text style={{ fontSize: 12, color: colors.sub }}>
                {GROUPS[k].label} <Text style={{ fontWeight: '800', color: colors.text }}>{pct}%</Text>
                <Text style={{ color: colors.muted }}> / {Math.round(GROUPS[k].target * 100)}</Text>
              </Text>
            </View>
          );
        })}
      </View>
      <Text style={[ui.muted, { fontSize: 11, marginTop: 2 }]}>Guideline: 50% needs · 30% wants · 20% savings</Text>
    </View>
  );
}
