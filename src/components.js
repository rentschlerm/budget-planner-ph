import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Pressable, Modal, ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, ui } from './theme';
import { GROUPS } from './defaults';
import { todayISO, toISODate, toNumber, isValidISO, uid, prettyDate } from './utils';

export function ProgressBar({ value, max, color = colors.primary, height = 8, track = colors.track }) {
  const pct = max > 0 ? Math.min(value / max, 1) : value > 0 ? 1 : 0;
  const over = max > 0 && value > max;
  return (
    <View style={{ height, backgroundColor: track, borderRadius: height, overflow: 'hidden' }}>
      <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: over ? colors.danger : color, borderRadius: height }} />
    </View>
  );
}

// Round tinted badge holding a category emoji.
export function CatIcon({ category, size = 42 }) {
  const g = (category && GROUPS[category.group]) || null;
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size / 2.6,
        backgroundColor: g ? g.soft : colors.track,
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: size * 0.48 }}>{category ? category.icon : '❔'}</Text>
    </View>
  );
}

export function Chip({ label, active, onPress, color }) {
  return (
    <TouchableOpacity
      style={[ui.chip, active && ui.chipActive, active && color ? { backgroundColor: color } : null]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[ui.chipText, active && ui.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function ScreenHeader({ title, subtitle, right }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[ui.between, { paddingTop: insets.top + 14, paddingHorizontal: 16, paddingBottom: 14 }]}>
      <View style={{ flex: 1 }}>
        <Text style={ui.title}>{title}</Text>
        {subtitle ? <Text style={ui.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function SectionHeader({ title, action, onAction }) {
  return (
    <View style={ui.sectionHeader}>
      <Text style={ui.h2}>{title}</Text>
      {action ? (
        <TouchableOpacity onPress={onAction} hitSlop={10}>
          <Text style={{ color: colors.primary, fontWeight: '700' }}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function EmptyState({ icon, title, text }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20 }}>
      <View style={{ width: 64, height: 64, borderRadius: 24, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={30} color={colors.primary} />
      </View>
      <Text style={[ui.h2, { marginTop: 14 }]}>{title}</Text>
      {text ? <Text style={[ui.sub, { textAlign: 'center', marginTop: 6 }]}>{text}</Text> : null}
    </View>
  );
}

export function SheetModal({ visible, onClose, title, children }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(15,23,42,0.45)' }} onPress={onClose} />
        <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%' }}>
          <View style={{ alignItems: 'center', paddingTop: 10 }}>
            <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border }} />
          </View>
          <View style={[ui.between, { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 }]}>
            <Text style={[ui.h2, { fontSize: 20 }]}>{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={12}
              style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.track, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="close" size={20} color={colors.sub} />
            </TouchableOpacity>
          </View>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Big centred ₱ amount field used in forms.
export function AmountInput({ value, onChangeText, autoFocus }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10 }}>
      <Text style={{ fontSize: 34, fontWeight: '700', color: colors.muted, marginRight: 4 }}>₱</Text>
      <TextInput
        style={{ fontSize: 44, fontWeight: '800', color: colors.text, minWidth: 80, textAlign: 'center', padding: 0 }}
        value={value}
        onChangeText={onChangeText}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={colors.border}
        autoFocus={autoFocus}
      />
    </View>
  );
}

function shiftISO(iso, days) {
  const [y, m, d] = iso.split('-').map(Number);
  return toISODate(new Date(y, m - 1, d + days));
}

export function DateStepper({ value, onChange }) {
  const today = todayISO();
  const label = value === today ? 'Today' : value === shiftISO(today, -1) ? 'Yesterday' : prettyDate(value);
  return (
    <View style={[ui.between, { backgroundColor: '#f8fafc', borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, padding: 6 }]}>
      <TouchableOpacity onPress={() => onChange(shiftISO(value, -1))} style={{ padding: 8 }} hitSlop={6}>
        <Ionicons name="chevron-back" size={20} color={colors.primary} />
      </TouchableOpacity>
      <View style={[ui.row]}>
        <Ionicons name="calendar-outline" size={16} color={colors.sub} />
        <Text style={{ marginLeft: 8, fontWeight: '700', color: colors.text, fontSize: 15 }}>{label}</Text>
      </View>
      <TouchableOpacity
        onPress={() => value < today && onChange(shiftISO(value, 1))}
        style={{ padding: 8, opacity: value < today ? 1 : 0.3 }}
        hitSlop={6}
      >
        <Ionicons name="chevron-forward" size={20} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
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
      setCategoryId((initial && initial.categoryId) || null);
      setNote((initial && initial.note) || '');
      setDate((initial && initial.date) || todayISO());
    }
  }, [visible]);

  const save = () => {
    const value = toNumber(amount);
    if (value <= 0) return Alert.alert('Amount needed', 'Enter how much you spent.');
    if (!categoryId) return Alert.alert('Pick a category', 'Tap the category this expense belongs to.');
    if (!isValidISO(date)) return Alert.alert('Check the date', 'That date is not valid.');
    onSave({ id: editing ? initial.id : uid(), amount: value, categoryId, note: note.trim(), date });
    onClose();
  };

  return (
    <SheetModal visible={visible} onClose={onClose} title={editing ? 'Edit expense' : 'New expense'}>
      <AmountInput value={amount} onChangeText={setAmount} autoFocus={!editing} />

      <Text style={ui.label}>Category</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
        {categories.map((c) => {
          const active = c.id === categoryId;
          return (
            <TouchableOpacity
              key={c.id}
              onPress={() => setCategoryId(c.id)}
              activeOpacity={0.7}
              style={{
                width: '25%', padding: 4,
              }}
            >
              <View
                style={{
                  alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, borderRadius: 16,
                  backgroundColor: active ? colors.primarySoft : 'transparent',
                  borderWidth: 2, borderColor: active ? colors.primary : 'transparent',
                }}
              >
                <CatIcon category={c} size={40} />
                <Text numberOfLines={2} style={{ fontSize: 11, textAlign: 'center', marginTop: 6, color: active ? colors.primaryDark : colors.sub, fontWeight: active ? '700' : '500' }}>
                  {c.name}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={ui.label}>Date</Text>
      <DateStepper value={date} onChange={setDate} />

      <Text style={ui.label}>Note</Text>
      <TextInput style={ui.input} value={note} onChangeText={setNote} placeholder="Optional — e.g. Meralco bill, Puregold run" placeholderTextColor={colors.muted} />

      <TouchableOpacity style={[ui.btn, { marginTop: 24 }]} onPress={save} activeOpacity={0.85}>
        <Ionicons name="checkmark" size={20} color="#fff" style={{ marginRight: 6 }} />
        <Text style={ui.btnText}>{editing ? 'Save changes' : 'Add expense'}</Text>
      </TouchableOpacity>
      {editing && onDelete ? (
        <TouchableOpacity
          style={[ui.btnGhost, { marginTop: 10, backgroundColor: colors.dangerSoft, elevation: 0, shadowOpacity: 0 }]}
          onPress={() =>
            Alert.alert('Delete expense?', 'This cannot be undone.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => { onDelete(initial.id); onClose(); } },
            ])
          }
        >
          <Ionicons name="trash-outline" size={18} color={colors.danger} style={{ marginRight: 6 }} />
          <Text style={[ui.btnGhostText, { color: colors.danger }]}>Delete</Text>
        </TouchableOpacity>
      ) : null}
    </SheetModal>
  );
}

export function MonthSwitcher({ label, onPrev, onNext, light }) {
  const fg = light ? '#fff' : colors.text;
  const bg = light ? 'rgba(255,255,255,0.16)' : colors.card;
  return (
    <View style={[ui.between, { backgroundColor: bg, borderRadius: 14, padding: 4 }]}>
      <TouchableOpacity onPress={onPrev} hitSlop={8} style={{ padding: 8 }}>
        <Ionicons name="chevron-back" size={18} color={fg} />
      </TouchableOpacity>
      <Text style={{ fontSize: 15, fontWeight: '700', color: fg }}>{label}</Text>
      <TouchableOpacity onPress={onNext} hitSlop={8} style={{ padding: 8 }}>
        <Ionicons name="chevron-forward" size={18} color={fg} />
      </TouchableOpacity>
    </View>
  );
}
