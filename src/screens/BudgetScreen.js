import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { KeyboardScrollView, Input } from '../keyboard';
import { Ionicons } from '@expo/vector-icons';
import { colors, ui } from '../theme';
import { GROUPS, ICON_CHOICES } from '../defaults';
import { peso, toNumber, uid } from '../utils';
import { Chip, SheetModal, ScreenHeader, CatIcon, AmountInput } from '../components';
import { currentVersion, manualCheckForUpdate } from '../updater';

export default function BudgetScreen({ data, update, onReset }) {
  const [incomeText, setIncomeText] = useState(String(data.income || ''));
  const [editing, setEditing] = useState(null); // category object, or {group} for new

  const planned = data.categories.reduce((s, c) => s + (c.planned || 0), 0);
  const unassigned = data.income - planned;

  const saveCategory = (cat) =>
    update((d) => {
      const exists = d.categories.some((c) => c.id === cat.id);
      return {
        ...d,
        setupDone: true,
        categories: exists ? d.categories.map((c) => (c.id === cat.id ? cat : c)) : [...d.categories, cat],
      };
    });

  const deleteCategory = (id) => {
    const used = data.expenses.some((e) => e.categoryId === id);
    Alert.alert(
      'Delete category?',
      used ? 'Expenses already logged here stay in your history as "Deleted category".' : 'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            update((d) => ({ ...d, categories: d.categories.filter((c) => c.id !== id) }));
            setEditing(null);
          },
        },
      ]
    );
  };

  const statusColor = unassigned < 0 ? colors.danger : unassigned > 0 ? colors.warn : colors.good;
  const statusBg = unassigned < 0 ? colors.dangerSoft : unassigned > 0 ? colors.warnSoft : colors.goodSoft;

  return (
    <View style={ui.screen}>
      <ScreenHeader title="Your plan" subtitle="Tap any amount to change it" />
      <KeyboardScrollView contentContainerStyle={ui.content} showsVerticalScrollIndicator={false}>
        <View style={ui.card}>
          <View style={ui.row}>
            <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: colors.goodSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="cash-outline" size={22} color={colors.good} />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={ui.h2}>Monthly take-home pay</Text>
              <Text style={ui.muted}>After SSS, PhilHealth, Pag-IBIG & tax</Text>
            </View>
          </View>
          <View style={[ui.row, ui.input, { marginTop: 14, paddingVertical: 4 }]}>
            <Text style={{ fontSize: 22, fontWeight: '700', color: colors.muted, marginRight: 6 }}>₱</Text>
            <Input
              style={{ flex: 1, fontSize: 24, fontWeight: '800', color: colors.text, paddingVertical: 8 }}
              keyboardType="decimal-pad"
              value={incomeText}
              onChangeText={(t) => {
                setIncomeText(t);
                update((d) => ({ ...d, income: toNumber(t), setupDone: true }));
              }}
              placeholder="25000"
              placeholderTextColor={colors.muted}
            />
          </View>

          <Text style={ui.label}>Pay schedule</Text>
          <View style={{ flexDirection: 'row', backgroundColor: colors.track, borderRadius: 14, padding: 4 }}>
            {[
              { key: 'semi-monthly', label: '15th & 30th' },
              { key: 'monthly', label: 'Once a month' },
            ].map((o) => {
              const active = data.payFrequency === o.key;
              return (
                <TouchableOpacity
                  key={o.key}
                  onPress={() => update((d) => ({ ...d, payFrequency: o.key }))}
                  style={{ flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center', backgroundColor: active ? colors.card : 'transparent' }}
                >
                  <Text style={{ fontWeight: '700', color: active ? colors.primary : colors.sub }}>{o.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {data.payFrequency === 'semi-monthly' ? (
            <Text style={[ui.muted, { marginTop: 8 }]}>About {peso(data.income / 2)} per payday</Text>
          ) : null}
        </View>

        <View style={[ui.card, { backgroundColor: statusBg, elevation: 0, shadowOpacity: 0 }]}>
          <View style={ui.row}>
            <Ionicons
              name={unassigned < 0 ? 'alert-circle' : unassigned > 0 ? 'ellipse-outline' : 'checkmark-circle'}
              size={22}
              color={statusColor}
            />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={{ fontWeight: '800', color: statusColor, fontSize: 16 }}>
                {unassigned < 0 ? `${peso(-unassigned)} over your income` : unassigned > 0 ? `${peso(unassigned)} left to assign` : 'Every peso has a job'}
              </Text>
              <Text style={{ color: colors.sub, fontSize: 13, marginTop: 2 }}>
                Planned {peso(planned)} of {peso(data.income)}
              </Text>
            </View>
          </View>
        </View>

        {Object.keys(GROUPS).map((g) => {
          const cats = data.categories.filter((c) => c.group === g);
          const sum = cats.reduce((s, c) => s + (c.planned || 0), 0);
          const pct = data.income > 0 ? Math.round((sum / data.income) * 100) : 0;
          return (
            <View key={g} style={ui.card}>
              <View style={[ui.between, { marginBottom: 6 }]}>
                <View style={ui.row}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: GROUPS[g].color, marginRight: 8 }} />
                  <Text style={ui.h2}>{GROUPS[g].label}</Text>
                  <Text style={[ui.muted, { marginLeft: 8 }]}>{pct}%</Text>
                </View>
                <Text style={{ fontWeight: '800', color: colors.text }}>{peso(sum)}</Text>
              </View>
              {cats.map((c) => (
                <TouchableOpacity key={c.id} onPress={() => setEditing(c)} style={[ui.row, { paddingVertical: 9 }]} activeOpacity={0.6}>
                  <CatIcon category={c} size={38} />
                  <Text style={{ fontSize: 15, color: colors.text, flex: 1, marginLeft: 12 }} numberOfLines={1}>{c.name}</Text>
                  <Text style={{ fontWeight: '700', color: colors.text, marginRight: 6 }}>{peso(c.planned)}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => setEditing({ group: g })} style={[ui.row, { paddingVertical: 10 }]}>
                <View style={{ width: 38, height: 38, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: GROUPS[g].color, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="add" size={20} color={GROUPS[g].color} />
                </View>
                <Text style={{ marginLeft: 12, color: GROUPS[g].color, fontWeight: '700' }}>Add to {GROUPS[g].label.toLowerCase()}</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <Text style={[ui.label, { marginLeft: 4 }]}>App</Text>
        <View style={[ui.card, { paddingVertical: 4 }]}>
          <SettingRow
            icon="sparkles-outline"
            label="Redo quick setup"
            onPress={() =>
              Alert.alert('Redo quick setup?', 'Your categories will be rebuilt from 3 questions. Your expense history stays.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Continue', onPress: () => update((d) => ({ ...d, setupDone: false })) },
              ])
            }
          />
          <View style={{ height: 1, backgroundColor: colors.track }} />
          <SettingRow icon="cloud-download-outline" label="Check for updates" detail={`v${currentVersion()}`} onPress={manualCheckForUpdate} />
          <View style={{ height: 1, backgroundColor: colors.track }} />
          <SettingRow
            icon="refresh-outline"
            label="Reset all data"
            danger
            onPress={() =>
              Alert.alert('Reset everything?', 'This deletes your plan, expenses and move-in list and restores the starter template.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reset', style: 'destructive', onPress: onReset },
              ])
            }
          />
        </View>

        <CategoryModal visible={!!editing} category={editing} onClose={() => setEditing(null)} onSave={saveCategory} onDelete={deleteCategory} />
      </KeyboardScrollView>
    </View>
  );
}

function SettingRow({ icon, label, detail, onPress, danger }) {
  return (
    <TouchableOpacity onPress={onPress} style={[ui.row, { paddingVertical: 14 }]} activeOpacity={0.6}>
      <Ionicons name={icon} size={20} color={danger ? colors.danger : colors.sub} />
      <Text style={{ flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '600', color: danger ? colors.danger : colors.text }}>{label}</Text>
      {detail ? <Text style={[ui.muted, { marginRight: 6 }]}>{detail}</Text> : null}
      <Ionicons name="chevron-forward" size={16} color={colors.muted} />
    </TouchableOpacity>
  );
}

function CategoryModal({ visible, category, onClose, onSave, onDelete }) {
  const isNew = !category || !category.id;
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('✨');
  const [planned, setPlanned] = useState('');
  const [group, setGroup] = useState('needs');

  useEffect(() => {
    if (visible) {
      setName((category && category.name) || '');
      setIcon((category && category.icon) || '✨');
      setPlanned(category && category.planned ? String(category.planned) : '');
      setGroup((category && category.group) || 'needs');
    }
  }, [visible]);

  const save = () => {
    if (!name.trim()) return Alert.alert('Name needed', 'Give this category a name.');
    onSave({ id: isNew ? uid() : category.id, name: name.trim(), icon, planned: toNumber(planned), group });
    onClose();
  };

  return (
    <SheetModal visible={visible} onClose={onClose} title={isNew ? 'New category' : 'Edit category'}>
      <View style={{ alignItems: 'center', marginTop: 8 }}>
        <CatIcon category={{ icon, group }} size={64} />
      </View>
      <AmountInput value={planned} onChangeText={setPlanned} />
      <Text style={[ui.muted, { textAlign: 'center', marginTop: -4 }]}>per month</Text>

      <Text style={ui.label}>Name</Text>
      <Input style={ui.input} value={name} onChangeText={setName} placeholder="e.g. Laundry" placeholderTextColor={colors.muted} />

      <Text style={ui.label}>Type</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {Object.keys(GROUPS).map((g) => (
          <Chip key={g} label={GROUPS[g].label} active={group === g} color={GROUPS[g].color} onPress={() => setGroup(g)} />
        ))}
      </View>

      <Text style={ui.label}>Icon</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -3 }}>
        {ICON_CHOICES.map((i) => (
          <TouchableOpacity key={i} onPress={() => setIcon(i)} style={{ width: '14.28%', padding: 3 }}>
            <View
              style={{
                aspectRatio: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
                backgroundColor: icon === i ? colors.primarySoft : colors.track,
                borderWidth: 2, borderColor: icon === i ? colors.primary : 'transparent',
              }}
            >
              <Text style={{ fontSize: 20 }}>{i}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[ui.btn, { marginTop: 24 }]} onPress={save} activeOpacity={0.85}>
        <Text style={ui.btnText}>Save</Text>
      </TouchableOpacity>
      {!isNew ? (
        <TouchableOpacity style={[ui.btnGhost, { marginTop: 10, backgroundColor: colors.dangerSoft, elevation: 0, shadowOpacity: 0 }]} onPress={() => onDelete(category.id)}>
          <Ionicons name="trash-outline" size={18} color={colors.danger} style={{ marginRight: 6 }} />
          <Text style={[ui.btnGhostText, { color: colors.danger }]}>Delete category</Text>
        </TouchableOpacity>
      ) : null}
    </SheetModal>
  );
}
