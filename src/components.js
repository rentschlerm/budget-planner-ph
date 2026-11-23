import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal, ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { colors, ui } from './theme';
import { todayISO, toISODate, toNumber, isValidISO, uid } from './utils';

export function ProgressBar({ value, max, color = colors.primary, height = 8 }) {
  const pct = max > 0 ? Math.min(value / max, 1) : value > 0 ? 1 : 0;
  const over = max > 0 && value > max;
  return (
    <View style={{ height, backgroundColor: '#eef0f4', borderRadius: height, overflow: 'hidden' }}>
      <View
        style={{
          width: `${pct * 100}%`,
          height: '100%',
          backgroundColor: over ? colors.danger : color,
          borderRadius: height,
        }}
      />
    </View>
  );
}

export function Stat({ label, value, tone }) {
  const color = tone === 'danger' ? colors.danger : tone === 'good' ? colors.good : colors.text;
  return (
    <View style={{ flex: 1, padding: 12, backgroundColor: '#f9fafb', borderRadius: 12, margin: 4 }}>
      <Text style={ui.muted}>{label}</Text>
      <Text style={{ fontSize: 18, fontWeight: '800', color, marginTop: 4 }} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

export function Chip({ label, active, onPress }) {
  return (
    <TouchableOpacity style={[ui.chip, active && ui.chipActive]} onPress={onPress}>
      <Text style={[ui.chipText, active && ui.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function SheetModal({ visible, onClose, title, children }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' }}
      >
        <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' }}>
          <View style={[ui.between, { padding: 16, paddingBottom: 4 }]}>
            <Text style={ui.h2}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text style={{ fontSize: 22, color: colors.muted }}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function yesterdayISO() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toISODate(d);
}

// Add or edit an expense. `initial` may contain { categoryId } or a full expense to edit.
export function ExpenseModal({ visible, onClose, categories, initial, onSave, onDelete }) {
  const editing = !!(initial && initial.id);
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(todayISO());

  useEffect(() => {
    if (visible) {
      setAmount(initial && initial.amount ? String(initial.amount) : '');
      setCategoryId((initial && initial.categoryId) || (categories[0] && categories[0].id) || null);
      setNote((initial && initial.note) || '');
      setDate((initial && initial.date) || todayISO());
    }
  }, [visible]);

  const save = () => {
    const value = toNumber(amount);
    if (value <= 0) return Alert.alert('Amount needed', 'Enter how much you spent.');
    if (!categoryId) return Alert.alert('Category needed', 'Pick a category first.');
    if (!isValidISO(date)) return Alert.alert('Check the date', 'Use the format YYYY-MM-DD, e.g. 2026-11-23.');
    onSave({ id: editing ? initial.id : uid(), amount: value, categoryId, note: note.trim(), date });
    onClose();
  };

  return (
    <SheetModal visible={visible} onClose={onClose} title={editing ? 'Edit expense' : 'Add expense'}>
      <Text style={ui.label}>Amount (₱)</Text>
      <TextInput
        style={[ui.input, { fontSize: 28, fontWeight: '800' }]}
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholder="0"
        autoFocus={!editing}
      />

      <Text style={ui.label}>Category</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {categories.map((c) => (
          <Chip key={c.id} label={`${c.icon} ${c.name}`} active={c.id === categoryId} onPress={() => setCategoryId(c.id)} />
        ))}
      </View>

      <Text style={ui.label}>Note (optional)</Text>
      <TextInput style={ui.input} value={note} onChangeText={setNote} placeholder="e.g. Meralco bill, Puregold run" />

      <Text style={ui.label}>Date</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        <Chip label="Today" active={date === todayISO()} onPress={() => setDate(todayISO())} />
        <Chip label="Yesterday" active={date === yesterdayISO()} onPress={() => setDate(yesterdayISO())} />
      </View>
      <TextInput style={ui.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />

      <TouchableOpacity style={[ui.btn, { marginTop: 20 }]} onPress={save}>
        <Text style={ui.btnText}>{editing ? 'Save changes' : 'Add expense'}</Text>
      </TouchableOpacity>
      {editing && onDelete ? (
        <TouchableOpacity
          style={[ui.btnGhost, { marginTop: 10, borderColor: colors.dangerSoft }]}
          onPress={() =>
            Alert.alert('Delete expense?', 'This cannot be undone.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => { onDelete(initial.id); onClose(); } },
            ])
          }
        >
          <Text style={[ui.btnGhostText, { color: colors.danger }]}>Delete</Text>
        </TouchableOpacity>
      ) : null}
    </SheetModal>
  );
}

export function MonthSwitcher({ label, onPrev, onNext }) {
  return (
    <View style={[ui.between, { marginBottom: 14 }]}>
      <TouchableOpacity onPress={onPrev} hitSlop={12} style={{ padding: 6 }}>
        <Text style={{ fontSize: 22, color: colors.primary }}>‹</Text>
      </TouchableOpacity>
      <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{label}</Text>
      <TouchableOpacity onPress={onNext} hitSlop={12} style={{ padding: 6 }}>
        <Text style={{ fontSize: 22, color: colors.primary }}>›</Text>
      </TouchableOpacity>
    </View>
  );
}
