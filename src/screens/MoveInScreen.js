import { useEffect, useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { colors, ui } from '../theme';
import { peso, toNumber, uid } from '../utils';
import { ProgressBar, SheetModal } from '../components';

export default function MoveInScreen({ data, update }) {
  const [editing, setEditing] = useState(null);
  const [savedText, setSavedText] = useState(String(data.moveInSaved || ''));

  const items = data.moveIn || [];
  const total = items.reduce((s, i) => s + i.amount, 0);
  const paid = items.filter((i) => i.paid).reduce((s, i) => s + i.amount, 0);
  const saved = data.moveInSaved || 0;
  const stillNeeded = Math.max(total - paid - saved, 0);

  const monthlySavings = data.categories
    .filter((c) => c.group === 'savings')
    .reduce((s, c) => s + (c.planned || 0), 0);
  const monthsToGo = monthlySavings > 0 ? Math.ceil(stillNeeded / monthlySavings) : null;

  const toggle = (id) =>
    update((d) => ({ ...d, moveIn: d.moveIn.map((i) => (i.id === id ? { ...i, paid: !i.paid } : i)) }));

  const saveItem = (item) =>
    update((d) => {
      const exists = d.moveIn.some((i) => i.id === item.id);
      return { ...d, moveIn: exists ? d.moveIn.map((i) => (i.id === item.id ? item : i)) : [...d.moveIn, item] };
    });

  const deleteItem = (id) =>
    Alert.alert('Remove item?', '', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          update((d) => ({ ...d, moveIn: d.moveIn.filter((i) => i.id !== id) }));
          setEditing(null);
        },
      },
    ]);

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.content} keyboardShouldPersistTaps="handled">
      <Text style={ui.h1}>Move-in fund</Text>
      <Text style={[ui.muted, { marginBottom: 12 }]}>One-time costs before and during the move. Tick items as you pay them.</Text>

      <View style={ui.card}>
        <View style={ui.between}>
          <Text style={ui.muted}>Total move-in cost</Text>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>{peso(total)}</Text>
        </View>
        <View style={{ marginVertical: 10 }}>
          <ProgressBar value={paid + saved} max={total} height={12} color={colors.good} />
        </View>
        <View style={ui.between}>
          <Text style={ui.muted}>Paid {peso(paid)} · Saved {peso(saved)}</Text>
          <Text style={{ fontWeight: '700', color: stillNeeded > 0 ? colors.warn : colors.good }}>
            {stillNeeded > 0 ? `${peso(stillNeeded)} to go` : 'Fully funded 🎉'}
          </Text>
        </View>

        <Text style={ui.label}>Cash already set aside for the move (₱)</Text>
        <TextInput
          style={ui.input}
          keyboardType="decimal-pad"
          value={savedText}
          onChangeText={(t) => {
            setSavedText(t);
            update((d) => ({ ...d, moveInSaved: toNumber(t) }));
          }}
          placeholder="0"
        />
        {stillNeeded > 0 && monthsToGo ? (
          <Text style={[ui.muted, { marginTop: 10 }]}>
            At your planned savings of {peso(monthlySavings)}/month, you'd cover the rest in about {monthsToGo}{' '}
            month{monthsToGo === 1 ? '' : 's'}.
          </Text>
        ) : null}
      </View>

      <View style={ui.card}>
        {items.map((i) => (
          <View key={i.id} style={[ui.row, { paddingVertical: 10 }]}>
            <TouchableOpacity onPress={() => toggle(i.id)} hitSlop={10} style={{ marginRight: 12 }}>
              <View
                style={{
                  width: 24, height: 24, borderRadius: 6, borderWidth: 2,
                  borderColor: i.paid ? colors.good : colors.border,
                  backgroundColor: i.paid ? colors.good : '#fff',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                {i.paid ? <Text style={{ color: '#fff', fontWeight: '900' }}>✓</Text> : null}
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[ui.between, { flex: 1 }]} onPress={() => setEditing(i)}>
              <Text
                style={{
                  flex: 1, fontSize: 15, paddingRight: 8,
                  color: i.paid ? colors.muted : colors.text,
                  textDecorationLine: i.paid ? 'line-through' : 'none',
                }}
              >
                {i.name}
              </Text>
              <Text style={{ fontWeight: '600', color: i.paid ? colors.muted : colors.text }}>{peso(i.amount)}</Text>
            </TouchableOpacity>
          </View>
        ))}
        {items.length === 0 ? <Text style={ui.muted}>No items yet.</Text> : null}
      </View>

      <TouchableOpacity style={ui.btn} onPress={() => setEditing({})}>
        <Text style={ui.btnText}>+ Add item</Text>
      </TouchableOpacity>

      <ItemModal
        visible={!!editing}
        item={editing}
        onClose={() => setEditing(null)}
        onSave={saveItem}
        onDelete={deleteItem}
      />
    </ScrollView>
  );
}

function ItemModal({ visible, item, onClose, onSave, onDelete }) {
  const isNew = !item || !item.id;
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (visible) {
      setName((item && item.name) || '');
      setAmount(item && item.amount ? String(item.amount) : '');
    }
  }, [visible]);

  const save = () => {
    if (!name.trim()) return Alert.alert('Name needed', 'What is this item?');
    onSave({ id: isNew ? uid() : item.id, name: name.trim(), amount: toNumber(amount), paid: isNew ? false : item.paid });
    onClose();
  };

  return (
    <SheetModal visible={visible} onClose={onClose} title={isNew ? 'New move-in item' : 'Edit item'}>
      <Text style={ui.label}>Item</Text>
      <TextInput style={ui.input} value={name} onChangeText={setName} placeholder="e.g. Curtains" />
      <Text style={ui.label}>Estimated cost (₱)</Text>
      <TextInput style={ui.input} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0" />
      <TouchableOpacity style={[ui.btn, { marginTop: 20 }]} onPress={save}>
        <Text style={ui.btnText}>Save</Text>
      </TouchableOpacity>
      {!isNew ? (
        <TouchableOpacity style={[ui.btnGhost, { marginTop: 10 }]} onPress={() => onDelete(item.id)}>
          <Text style={[ui.btnGhostText, { color: colors.danger }]}>Remove item</Text>
        </TouchableOpacity>
      ) : null}
    </SheetModal>
  );
}
