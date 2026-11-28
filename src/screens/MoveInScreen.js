import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { KeyboardScrollView, Input } from '../keyboard';
import { Ionicons } from '@expo/vector-icons';
import { colors, ui } from '../theme';
import { peso, toNumber, uid } from '../utils';
import { ProgressBar, SheetModal, ScreenHeader, AmountInput, EmptyState } from '../components';

export default function MoveInScreen({ data, update }) {
  const [editing, setEditing] = useState(null);
  const [savedText, setSavedText] = useState(data.moveInSaved ? String(data.moveInSaved) : '');

  const items = data.moveIn || [];
  const total = items.reduce((s, i) => s + i.amount, 0);
  const paid = items.filter((i) => i.paid).reduce((s, i) => s + i.amount, 0);
  const saved = data.moveInSaved || 0;
  const covered = Math.min(paid + saved, total);
  const stillNeeded = Math.max(total - paid - saved, 0);
  const pct = total > 0 ? Math.round((covered / total) * 100) : 0;

  const monthlySavings = data.categories.filter((c) => c.group === 'savings').reduce((s, c) => s + (c.planned || 0), 0);
  const monthsToGo = monthlySavings > 0 ? Math.ceil(stillNeeded / monthlySavings) : null;

  const toggle = (id) => update((d) => ({ ...d, moveIn: d.moveIn.map((i) => (i.id === id ? { ...i, paid: !i.paid } : i)) }));

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

  const unpaid = items.filter((i) => !i.paid);
  const done = items.filter((i) => i.paid);

  return (
    <View style={ui.screen}>
      <ScreenHeader title="Move-in fund" subtitle="One-time costs to get you moved in" />
      <KeyboardScrollView contentContainerStyle={ui.content} showsVerticalScrollIndicator={false}>
        <View style={[ui.card, { backgroundColor: colors.primaryDark }]}>
          <View style={ui.between}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#99f6e4', fontSize: 13, fontWeight: '600' }}>{stillNeeded > 0 ? 'STILL NEEDED' : 'ALL SET'}</Text>
              <Text style={{ color: '#fff', fontSize: 32, fontWeight: '800', marginTop: 2 }}>
                {stillNeeded > 0 ? peso(stillNeeded) : '🎉 Funded'}
              </Text>
              <Text style={{ color: '#ccfbf1', fontSize: 13, marginTop: 2 }}>of {peso(total)} total</Text>
            </View>
            <Ring pct={pct} />
          </View>
          <View style={{ marginTop: 14 }}>
            <ProgressBar value={covered} max={total} height={8} color="#5eead4" track="rgba(255,255,255,0.15)" />
          </View>
          <View style={[ui.between, { marginTop: 10 }]}>
            <Text style={{ color: '#ccfbf1', fontSize: 13 }}>Paid {peso(paid)}</Text>
            <Text style={{ color: '#ccfbf1', fontSize: 13 }}>Saved {peso(saved)}</Text>
          </View>
          {stillNeeded > 0 && monthsToGo ? (
            <View style={[ui.row, { marginTop: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 10 }]}>
              <Ionicons name="time-outline" size={16} color="#99f6e4" />
              <Text style={{ color: '#ccfbf1', fontSize: 13, marginLeft: 8, flex: 1 }}>
                At {peso(monthlySavings)}/month in savings, you'll be ready in about{' '}
                <Text style={{ color: '#fff', fontWeight: '800' }}>{monthsToGo} month{monthsToGo === 1 ? '' : 's'}</Text>
              </Text>
            </View>
          ) : null}
        </View>

        <View style={ui.card}>
          <Text style={ui.h2}>Cash set aside for the move</Text>
          <Text style={ui.muted}>Money you've saved but haven't spent yet</Text>
          <View style={[ui.row, ui.input, { marginTop: 12, paddingVertical: 2 }]}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.muted, marginRight: 6 }}>₱</Text>
            <Input
              style={{ flex: 1, fontSize: 18, fontWeight: '700', color: colors.text, paddingVertical: 10 }}
              keyboardType="decimal-pad"
              value={savedText}
              onChangeText={(t) => {
                setSavedText(t);
                update((d) => ({ ...d, moveInSaved: toNumber(t) }));
              }}
              placeholder="0"
              placeholderTextColor={colors.muted}
            />
          </View>
        </View>

        <ItemList title={`To pay · ${unpaid.length}`} items={unpaid} onToggle={toggle} onEdit={setEditing} />
        {done.length ? <ItemList title={`Paid · ${done.length}`} items={done} onToggle={toggle} onEdit={setEditing} /> : null}
        {items.length === 0 ? (
          <View style={ui.card}>
            <EmptyState icon="cube-outline" title="No items yet" text="Add the things you need to buy or pay for before moving." />
          </View>
        ) : null}

        <TouchableOpacity style={ui.btn} onPress={() => setEditing({})} activeOpacity={0.85}>
          <Ionicons name="add" size={20} color="#fff" style={{ marginRight: 6 }} />
          <Text style={ui.btnText}>Add item</Text>
        </TouchableOpacity>

        <ItemModal visible={!!editing} item={editing} onClose={() => setEditing(null)} onSave={saveItem} onDelete={deleteItem} />
      </KeyboardScrollView>
    </View>
  );
}

function ItemList({ title, items, onToggle, onEdit }) {
  if (!items.length) return null;
  return (
    <>
      <Text style={[ui.label, { marginLeft: 4, marginTop: 4 }]}>{title}</Text>
      <View style={[ui.card, { paddingVertical: 4 }]}>
        {items.map((i, idx) => (
          <View key={i.id} style={[ui.row, { paddingVertical: 12, borderTopWidth: idx ? 1 : 0, borderTopColor: colors.track }]}>
            <TouchableOpacity onPress={() => onToggle(i.id)} hitSlop={10} style={{ marginRight: 12 }}>
              <View
                style={{
                  width: 26, height: 26, borderRadius: 9, borderWidth: 2,
                  borderColor: i.paid ? colors.good : colors.border,
                  backgroundColor: i.paid ? colors.good : '#fff',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                {i.paid ? <Ionicons name="checkmark" size={18} color="#fff" /> : null}
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[ui.between, { flex: 1 }]} onPress={() => onEdit(i)} activeOpacity={0.6}>
              <Text
                style={{
                  flex: 1, fontSize: 15, paddingRight: 8, fontWeight: '500',
                  color: i.paid ? colors.muted : colors.text,
                  textDecorationLine: i.paid ? 'line-through' : 'none',
                }}
              >
                {i.name}
              </Text>
              <Text style={{ fontWeight: '700', color: i.paid ? colors.muted : colors.text }}>{peso(i.amount)}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </>
  );
}

// Simple percentage badge (no SVG dependency).
function Ring({ pct }) {
  return (
    <View
      style={{
        width: 72, height: 72, borderRadius: 36, borderWidth: 6,
        borderColor: pct >= 100 ? '#5eead4' : 'rgba(255,255,255,0.18)',
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>{pct}%</Text>
    </View>
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
    <SheetModal visible={visible} onClose={onClose} title={isNew ? 'New item' : 'Edit item'}>
      <AmountInput value={amount} onChangeText={setAmount} autoFocus={isNew} />
      <Text style={[ui.muted, { textAlign: 'center', marginTop: -4 }]}>estimated cost</Text>
      <Text style={ui.label}>Item</Text>
      <Input style={ui.input} value={name} onChangeText={setName} placeholder="e.g. Curtains" placeholderTextColor={colors.muted} />
      <TouchableOpacity style={[ui.btn, { marginTop: 24 }]} onPress={save} activeOpacity={0.85}>
        <Text style={ui.btnText}>Save</Text>
      </TouchableOpacity>
      {!isNew ? (
        <TouchableOpacity style={[ui.btnGhost, { marginTop: 10, backgroundColor: colors.dangerSoft, elevation: 0, shadowOpacity: 0 }]} onPress={() => onDelete(item.id)}>
          <Ionicons name="trash-outline" size={18} color={colors.danger} style={{ marginRight: 6 }} />
          <Text style={[ui.btnGhostText, { color: colors.danger }]}>Remove item</Text>
        </TouchableOpacity>
      ) : null}
    </SheetModal>
  );
}
