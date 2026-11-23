import { useEffect, useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { colors, ui } from '../theme';
import { GROUPS, ICON_CHOICES } from '../defaults';
import { peso, toNumber, uid } from '../utils';
import { Chip, SheetModal } from '../components';
import { currentVersion, manualCheckForUpdate } from '../updater';

export default function BudgetScreen({ data, update, onReset }) {
  const [incomeText, setIncomeText] = useState(String(data.income || ''));
  const [editing, setEditing] = useState(null); // category object or {} for new

  const planned = data.categories.reduce((s, c) => s + (c.planned || 0), 0);
  const unassigned = data.income - planned;

  const saveCategory = (cat) => {
    update((d) => {
      const exists = d.categories.some((c) => c.id === cat.id);
      return {
        ...d,
        categories: exists ? d.categories.map((c) => (c.id === cat.id ? cat : c)) : [...d.categories, cat],
      };
    });
  };

  const deleteCategory = (id) => {
    const used = data.expenses.some((e) => e.categoryId === id);
    Alert.alert(
      'Delete category?',
      used ? 'Expenses already logged here will stay in history but show as "Deleted category".' : 'This cannot be undone.',
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

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.content} keyboardShouldPersistTaps="handled">
      <Text style={ui.h1}>Monthly plan</Text>
      <Text style={[ui.muted, { marginBottom: 12 }]}>Set your take-home pay, then give every peso a job.</Text>

      <View style={ui.card}>
        <Text style={ui.h2}>Take-home pay per month</Text>
        <Text style={[ui.muted, { marginBottom: 8 }]}>After SSS, PhilHealth, Pag-IBIG and tax deductions.</Text>
        <TextInput
          style={[ui.input, { fontSize: 22, fontWeight: '800' }]}
          keyboardType="decimal-pad"
          value={incomeText}
          onChangeText={(t) => {
            setIncomeText(t);
            update((d) => ({ ...d, income: toNumber(t) }));
          }}
          placeholder="e.g. 25000"
        />
        <Text style={ui.label}>How often are you paid?</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <Chip
            label="15th & 30th"
            active={data.payFrequency === 'semi-monthly'}
            onPress={() => update((d) => ({ ...d, payFrequency: 'semi-monthly' }))}
          />
          <Chip
            label="Once a month"
            active={data.payFrequency === 'monthly'}
            onPress={() => update((d) => ({ ...d, payFrequency: 'monthly' }))}
          />
        </View>
        {data.payFrequency === 'semi-monthly' ? (
          <Text style={ui.muted}>About {peso(data.income / 2)} per payday.</Text>
        ) : null}
      </View>

      <View
        style={[
          ui.card,
          { backgroundColor: unassigned < 0 ? colors.dangerSoft : colors.primarySoft, borderColor: 'transparent' },
        ]}
      >
        <View style={ui.between}>
          <Text style={{ fontWeight: '700', color: colors.text }}>
            {unassigned < 0 ? 'Over-planned by' : 'Not yet assigned'}
          </Text>
          <Text style={{ fontWeight: '800', fontSize: 18, color: unassigned < 0 ? colors.danger : colors.primary }}>
            {peso(Math.abs(unassigned))}
          </Text>
        </View>
        <Text style={[ui.muted, { marginTop: 4 }]}>
          Planned {peso(planned)} of {peso(data.income)}
        </Text>
      </View>

      {Object.keys(GROUPS).map((g) => {
        const cats = data.categories.filter((c) => c.group === g);
        const sum = cats.reduce((s, c) => s + (c.planned || 0), 0);
        return (
          <View key={g} style={ui.card}>
            <View style={[ui.between, { marginBottom: 4 }]}>
              <Text style={[ui.h2, { marginBottom: 0, color: GROUPS[g].color }]}>{GROUPS[g].label}</Text>
              <Text style={{ fontWeight: '700', color: colors.text }}>{peso(sum)}</Text>
            </View>
            {cats.length === 0 ? <Text style={ui.muted}>No categories yet.</Text> : null}
            {cats.map((c) => (
              <TouchableOpacity key={c.id} onPress={() => setEditing(c)} style={[ui.between, { paddingVertical: 10 }]}>
                <Text style={{ fontSize: 15, color: colors.text, flex: 1 }} numberOfLines={1}>
                  {c.icon} {c.name}
                </Text>
                <Text style={{ fontWeight: '600', color: colors.text }}>{peso(c.planned)}  ›</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      })}

      <TouchableOpacity style={ui.btn} onPress={() => setEditing({})}>
        <Text style={ui.btnText}>+ Add category</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[ui.btnGhost, { marginTop: 24 }]}
        onPress={() =>
          Alert.alert('Reset everything?', 'This deletes your plan, expenses and move-in list and restores the starter template.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Reset', style: 'destructive', onPress: onReset },
          ])
        }
      >
        <Text style={[ui.btnGhostText, { color: colors.danger }]}>Reset all data</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[ui.btnGhost, { marginTop: 10 }]} onPress={manualCheckForUpdate}>
        <Text style={ui.btnGhostText}>Check for updates</Text>
      </TouchableOpacity>
      <Text style={[ui.muted, { textAlign: 'center', marginTop: 8 }]}>Version {currentVersion()}</Text>

      <CategoryModal
        visible={!!editing}
        category={editing}
        onClose={() => setEditing(null)}
        onSave={saveCategory}
        onDelete={deleteCategory}
      />
    </ScrollView>
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
      <Text style={ui.label}>Name</Text>
      <TextInput style={ui.input} value={name} onChangeText={setName} placeholder="e.g. Laundry" />

      <Text style={ui.label}>Monthly budget (₱)</Text>
      <TextInput style={ui.input} value={planned} onChangeText={setPlanned} keyboardType="decimal-pad" placeholder="0" />

      <Text style={ui.label}>Type</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {Object.keys(GROUPS).map((g) => (
          <Chip key={g} label={GROUPS[g].label} active={group === g} onPress={() => setGroup(g)} />
        ))}
      </View>

      <Text style={ui.label}>Icon</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {ICON_CHOICES.map((i) => (
          <TouchableOpacity
            key={i}
            onPress={() => setIcon(i)}
            style={{
              width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
              marginRight: 6, marginBottom: 6,
              backgroundColor: icon === i ? colors.primarySoft : '#f3f4f6',
              borderWidth: icon === i ? 2 : 0, borderColor: colors.primary,
            }}
          >
            <Text style={{ fontSize: 22 }}>{i}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[ui.btn, { marginTop: 20 }]} onPress={save}>
        <Text style={ui.btnText}>Save</Text>
      </TouchableOpacity>
      {!isNew ? (
        <TouchableOpacity style={[ui.btnGhost, { marginTop: 10 }]} onPress={() => onDelete(category.id)}>
          <Text style={[ui.btnGhostText, { color: colors.danger }]}>Delete category</Text>
        </TouchableOpacity>
      ) : null}
    </SheetModal>
  );
}
