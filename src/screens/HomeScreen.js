import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { colors, ui } from '../theme';
import { GROUPS } from '../defaults';
import { peso, inMonth, monthLabel, shiftMonth } from '../utils';
import { ProgressBar, Stat, MonthSwitcher } from '../components';

export default function HomeScreen({ data, month, setMonth, onAddExpense }) {
  const { income, categories, expenses, payFrequency } = data;
  const monthExpenses = expenses.filter((e) => inMonth(e.date, month));

  const planned = categories.reduce((s, c) => s + (c.planned || 0), 0);
  const spent = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const left = income - spent;
  const unplanned = income - planned;

  const spentByCat = {};
  monthExpenses.forEach((e) => {
    spentByCat[e.categoryId] = (spentByCat[e.categoryId] || 0) + e.amount;
  });

  const plannedByGroup = { needs: 0, wants: 0, savings: 0 };
  categories.forEach((c) => {
    plannedByGroup[c.group] = (plannedByGroup[c.group] || 0) + (c.planned || 0);
  });

  const firstHalf = monthExpenses.filter((e) => Number(e.date.slice(8, 10)) <= 15).reduce((s, e) => s + e.amount, 0);
  const secondHalf = spent - firstHalf;
  const halfPay = income / 2;

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.content}>
      <Text style={ui.h1}>Budget</Text>
      <Text style={[ui.muted, { marginBottom: 12 }]}>Your first month of living independently</Text>

      <MonthSwitcher
        label={monthLabel(month)}
        onPrev={() => setMonth(shiftMonth(month, -1))}
        onNext={() => setMonth(shiftMonth(month, 1))}
      />

      <View style={ui.card}>
        <View style={{ flexDirection: 'row', margin: -4 }}>
          <Stat label="Income" value={peso(income)} />
          <Stat label="Spent" value={peso(spent)} />
        </View>
        <View style={{ flexDirection: 'row', margin: -4, marginTop: 4 }}>
          <Stat label="Left this month" value={peso(left)} tone={left < 0 ? 'danger' : 'good'} />
          <Stat label="Planned" value={peso(planned)} />
        </View>
        <View style={{ marginTop: 12 }}>
          <ProgressBar value={spent} max={income} height={10} />
        </View>
        {unplanned < 0 ? (
          <View style={{ marginTop: 12, padding: 10, borderRadius: 10, backgroundColor: colors.dangerSoft }}>
            <Text style={{ color: colors.danger, fontWeight: '600' }}>
              Your plan is {peso(-unplanned)} more than your income. Trim a category in the Budget tab.
            </Text>
          </View>
        ) : unplanned > 0 ? (
          <Text style={[ui.muted, { marginTop: 10 }]}>
            {peso(unplanned)} of your income isn't assigned yet. Consider adding it to savings.
          </Text>
        ) : (
          <Text style={[ui.muted, { marginTop: 10, color: colors.good }]}>Every peso has a job. 👌</Text>
        )}
      </View>

      {payFrequency === 'semi-monthly' ? (
        <View style={ui.card}>
          <Text style={ui.h2}>Per payday (15th & 30th)</Text>
          <HalfRow label="1st–15th" spent={firstHalf} budget={halfPay} />
          <View style={{ height: 12 }} />
          <HalfRow label="16th–end" spent={secondHalf} budget={halfPay} />
        </View>
      ) : null}

      <View style={ui.card}>
        <Text style={ui.h2}>50 / 30 / 20 check</Text>
        <Text style={[ui.muted, { marginBottom: 10 }]}>
          A common guideline: about 50% needs, 30% wants, 20% savings.
        </Text>
        {Object.keys(GROUPS).map((g) => {
          const pct = income > 0 ? Math.round((plannedByGroup[g] / income) * 100) : 0;
          const target = Math.round(GROUPS[g].target * 100);
          return (
            <View key={g} style={{ marginBottom: 10 }}>
              <View style={ui.between}>
                <Text style={{ fontWeight: '600', color: colors.text }}>{GROUPS[g].label}</Text>
                <Text style={ui.muted}>
                  {pct}% of income · aim ~{target}%
                </Text>
              </View>
              <View style={{ marginTop: 6 }}>
                <ProgressBar value={pct} max={100} color={GROUPS[g].color} />
              </View>
            </View>
          );
        })}
      </View>

      <View style={ui.card}>
        <Text style={ui.h2}>Categories</Text>
        <Text style={[ui.muted, { marginBottom: 8 }]}>Tap a category to log spending in it.</Text>
        {categories.map((c) => {
          const s = spentByCat[c.id] || 0;
          const remaining = (c.planned || 0) - s;
          return (
            <TouchableOpacity key={c.id} onPress={() => onAddExpense({ categoryId: c.id })} style={{ paddingVertical: 10 }}>
              <View style={ui.between}>
                <Text style={{ fontSize: 15, color: colors.text, flex: 1 }} numberOfLines={1}>
                  {c.icon} {c.name}
                </Text>
                <Text style={{ fontWeight: '700', color: remaining < 0 ? colors.danger : colors.text }}>
                  {peso(s)} <Text style={ui.muted}>/ {peso(c.planned)}</Text>
                </Text>
              </View>
              <View style={{ marginTop: 6 }}>
                <ProgressBar value={s} max={c.planned} color={GROUPS[c.group] ? GROUPS[c.group].color : colors.primary} />
              </View>
              {remaining < 0 ? (
                <Text style={{ color: colors.danger, fontSize: 12, marginTop: 4 }}>Over by {peso(-remaining)}</Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

function HalfRow({ label, spent, budget }) {
  return (
    <View>
      <View style={ui.between}>
        <Text style={{ fontWeight: '600', color: colors.text }}>{label}</Text>
        <Text style={{ color: spent > budget ? colors.danger : colors.text, fontWeight: '600' }}>
          {peso(spent)} <Text style={ui.muted}>/ {peso(budget)}</Text>
        </Text>
      </View>
      <View style={{ marginTop: 6 }}>
        <ProgressBar value={spent} max={budget} />
      </View>
    </View>
  );
}
