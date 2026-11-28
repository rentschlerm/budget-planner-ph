import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { KeyboardSafeView, KeyboardScrollView, Input } from '../keyboard';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, ui } from '../theme';
import { buildPlan, buildMoveIn } from '../defaults';
import { peso, toNumber } from '../utils';
import { CatIcon } from '../components';

// Three quick questions → a complete plan. Everything can be changed later in Plan.
export default function SetupScreen({ data, onFinish }) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [pay, setPay] = useState('');
  const [freq, setFreq] = useState(data.payFrequency || 'semi-monthly');
  const [rent, setRent] = useState('');
  const [bills, setBills] = useState('');

  const payN = toNumber(pay);
  const rentN = toNumber(rent);
  const billsN = toNumber(bills);
  const plan = buildPlan(payN, rentN, billsN);
  const tight = payN > 0 && rentN + billsN > payN * 0.7;

  const finish = () =>
    onFinish({
      ...data,
      setupDone: true,
      income: payN,
      payFrequency: freq,
      categories: plan,
      moveIn: buildMoveIn(rentN),
    });

  const skip = () => onFinish({ ...data, setupDone: true });

  const canNext = step === 0 || (step === 1 && payN > 0) || (step === 2 && rentN + billsN < payN) || step === 3;

  return (
    <KeyboardSafeView style={{ backgroundColor: colors.bg }}>
      <KeyboardScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 16, paddingHorizontal: 24, paddingBottom: Math.max(insets.bottom, 12) + 12 }}>
        {/* Progress dots */}
        <View style={[ui.between, { marginBottom: 32 }]}>
          <View style={ui.row}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={{ width: i === step ? 22 : 8, height: 8, borderRadius: 4, marginRight: 6, backgroundColor: i <= step ? colors.primary : colors.border }} />
            ))}
          </View>
          {step < 3 ? (
            <TouchableOpacity onPress={skip} hitSlop={10}>
              <Text style={{ color: colors.sub, fontWeight: '600' }}>Skip</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {step === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: 96, height: 96, borderRadius: 30, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <Ionicons name="wallet" size={48} color="#fff" />
            </View>
            <Text style={[ui.title, { textAlign: 'center' }]}>Plan your money{'\n'}in 1 minute</Text>
            <Text style={[ui.sub, { textAlign: 'center', marginTop: 12, lineHeight: 21 }]}>
              Answer 3 quick questions and we'll build your monthly budget. After that, just snap your receipts.
            </Text>
          </View>
        ) : null}

        {step === 1 ? (
          <Question
            icon="cash-outline"
            title="How much do you take home each month?"
            hint="Your salary after SSS, PhilHealth, Pag-IBIG and tax."
          >
            <BigMoney value={pay} onChange={setPay} placeholder="25,000" />
            <View style={{ flexDirection: 'row', backgroundColor: colors.track, borderRadius: 14, padding: 4, marginTop: 20 }}>
              {[
                { key: 'semi-monthly', label: 'Paid 15th & 30th' },
                { key: 'monthly', label: 'Paid once a month' },
              ].map((o) => (
                <TouchableOpacity
                  key={o.key}
                  onPress={() => setFreq(o.key)}
                  style={{ flex: 1, paddingVertical: 11, borderRadius: 11, alignItems: 'center', backgroundColor: freq === o.key ? colors.card : 'transparent' }}
                >
                  <Text style={{ fontWeight: '700', color: freq === o.key ? colors.primary : colors.sub, fontSize: 13 }}>{o.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Question>
        ) : null}

        {step === 2 ? (
          <Question icon="home-outline" title="What are your fixed costs?" hint="Rough numbers are fine. You can change them anytime.">
            <Text style={ui.label}>Monthly rent</Text>
            <MoneyField value={rent} onChange={setRent} placeholder="7,000" />
            <Text style={ui.label}>Bills — electricity, water, internet, load</Text>
            <MoneyField value={bills} onChange={setBills} placeholder="3,500" />
            {rentN + billsN >= payN && payN > 0 ? (
              <Text style={{ color: colors.danger, marginTop: 12, fontWeight: '600' }}>That's more than your take-home pay of {peso(payN)}.</Text>
            ) : tight ? (
              <Text style={{ color: colors.warn, marginTop: 12 }}>Heads up: rent and bills take over 70% of your pay. Budget will be tight.</Text>
            ) : null}
          </Question>
        ) : null}

        {step === 3 ? (
          <Question icon="sparkles-outline" title="Here's your plan" hint={`About ${peso(Math.max(payN - rentN - billsN, 0) / 30)} a day for everything after rent and bills.`}>
            <View style={[ui.card, { marginTop: 8, paddingVertical: 6 }]}>
              {plan.map((c, i) => (
                <View key={c.id} style={[ui.row, { paddingVertical: 9, borderTopWidth: i ? 1 : 0, borderTopColor: colors.track }]}>
                  <CatIcon category={c} size={34} />
                  <Text style={{ flex: 1, marginLeft: 12, color: colors.text, fontSize: 15 }} numberOfLines={1}>{c.name}</Text>
                  <Text style={{ fontWeight: '700', color: colors.text }}>{peso(c.planned)}</Text>
                </View>
              ))}
            </View>
            <Text style={[ui.muted, { textAlign: 'center' }]}>You can fine-tune any of these in the Plan tab.</Text>
          </Question>
        ) : null}

        <View style={[ui.row, { marginTop: 24 }]}>
          {step > 0 ? (
            <TouchableOpacity onPress={() => setStep(step - 1)} style={[ui.btnGhost, { width: 56, marginRight: 10 }]}>
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            disabled={!canNext}
            onPress={() => (step === 3 ? finish() : setStep(step + 1))}
            style={[ui.btn, { flex: 1, opacity: canNext ? 1 : 0.4 }]}
            activeOpacity={0.85}
          >
            <Text style={ui.btnText}>{step === 0 ? "Let's go" : step === 3 ? 'Looks good — start!' : 'Next'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardScrollView>
    </KeyboardSafeView>
  );
}

function Question({ icon, title, hint, children }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Ionicons name={icon} size={26} color={colors.primary} />
      </View>
      <Text style={[ui.title, { fontSize: 26 }]}>{title}</Text>
      <Text style={[ui.sub, { marginTop: 6, marginBottom: 16 }]}>{hint}</Text>
      {children}
    </View>
  );
}

function BigMoney({ value, onChange, placeholder }) {
  return (
    <View style={[ui.row, { borderBottomWidth: 2, borderBottomColor: colors.primary, paddingBottom: 6, marginTop: 12 }]}>
      <Text style={{ fontSize: 36, fontWeight: '700', color: colors.muted, marginRight: 8 }}>₱</Text>
      <Input
        style={{ flex: 1, fontSize: 40, fontWeight: '800', color: colors.text, padding: 0 }}
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        placeholder={placeholder}
        placeholderTextColor={colors.border}
        autoFocus
      />
    </View>
  );
}

function MoneyField({ value, onChange, placeholder }) {
  return (
    <View style={[ui.row, ui.input, { paddingVertical: 2 }]}>
      <Text style={{ fontSize: 20, fontWeight: '700', color: colors.muted, marginRight: 6 }}>₱</Text>
      <Input
        style={{ flex: 1, fontSize: 20, fontWeight: '700', color: colors.text, paddingVertical: 10 }}
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
      />
    </View>
  );
}
