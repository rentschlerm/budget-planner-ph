export const GROUPS = {
  needs: { label: 'Needs', color: '#0ea5e9', soft: '#e0f2fe', target: 0.5 },
  wants: { label: 'Wants', color: '#f59e0b', soft: '#fef3c7', target: 0.3 },
  savings: { label: 'Savings', color: '#10b981', soft: '#d1fae5', target: 0.2 },
};

// A short, simple starter list. Users can add more in the Plan tab.
export const SIMPLE_CATEGORIES = [
  { id: 'rent', name: 'Rent', icon: '🏠', group: 'needs' },
  { id: 'bills', name: 'Bills (power, water, internet)', icon: '💡', group: 'needs' },
  { id: 'groceries', name: 'Groceries', icon: '🛒', group: 'needs' },
  { id: 'transport', name: 'Transport', icon: '🚌', group: 'needs' },
  { id: 'food', name: 'Food & eating out', icon: '🍜', group: 'wants' },
  { id: 'personal', name: 'Personal & household', icon: '🧴', group: 'needs' },
  { id: 'fun', name: 'Fun & extras', icon: '🎉', group: 'wants' },
  { id: 'savings', name: 'Savings', icon: '🐷', group: 'savings' },
];

function round50(n) {
  return Math.max(0, Math.round(n / 50) * 50);
}

// Builds a full plan from just three numbers. What's left after rent and bills is split
// across the flexible categories; savings absorbs rounding so the plan matches the pay exactly.
export function buildPlan(pay, rent, bills) {
  const rest = Math.max(pay - rent - bills, 0);
  const shares = { groceries: 0.3, transport: 0.15, food: 0.12, personal: 0.08, fun: 0.15 };
  const amounts = { rent, bills };
  let used = rent + bills;
  Object.keys(shares).forEach((k) => {
    amounts[k] = round50(rest * shares[k]);
    used += amounts[k];
  });
  amounts.savings = Math.max(pay - used, 0);
  return SIMPLE_CATEGORIES.map((c) => ({ ...c, planned: amounts[c.id] || 0 }));
}

export function buildMoveIn(rent) {
  const r = rent || 7000;
  return [
    { id: 'advance', name: '1 month advance rent', amount: r, paid: false },
    { id: 'deposit', name: 'Security deposit (2 months)', amount: r * 2, paid: false },
    { id: 'bed', name: 'Bed foam / mattress & pillows', amount: 3500, paid: false },
    { id: 'fan', name: 'Electric fan', amount: 1500, paid: false },
    { id: 'ricecooker', name: 'Rice cooker', amount: 1200, paid: false },
    { id: 'kitchen', name: 'Kitchen basics', amount: 2500, paid: false },
    { id: 'cleaning', name: 'Cleaning supplies, timba & tabo', amount: 800, paid: false },
    { id: 'moving', name: 'Moving (Lalamove / truck)', amount: 1500, paid: false },
    { id: 'firstgrocery', name: 'First grocery stock-up', amount: 3000, paid: false },
  ];
}

export const DEFAULT_DATA = {
  version: 2,
  setupDone: false,
  income: 25000,
  payFrequency: 'semi-monthly', // 'semi-monthly' (15th & 30th) or 'monthly'
  categories: buildPlan(25000, 7000, 3500),
  expenses: [], // { id, categoryId, amount, note, date: 'YYYY-MM-DD', source?: 'receipt' }
  moveInSaved: 0,
  moveIn: buildMoveIn(7000),
};

export const ICON_CHOICES = ['🏠', '💡', '🚰', '📶', '📱', '🛒', '🚌', '🧴', '🍜', '🎉', '🎬', '👨‍👩‍👧', '🛟', '🐷', '💊', '📚', '🐶', '👕', '💳', '🎁', '⛽', '🏍️', '💼', '☕', '🧺', '✂️', '🎮', '✨'];
