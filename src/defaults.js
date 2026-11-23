// Starter numbers are placeholders only — edit them in the Budget tab to match your actual rent, bills and salary.
export const GROUPS = {
  needs: { label: 'Needs', color: '#0ea5e9', soft: '#e0f2fe', target: 0.5 },
  wants: { label: 'Wants', color: '#f59e0b', soft: '#fef3c7', target: 0.3 },
  savings: { label: 'Savings', color: '#10b981', soft: '#d1fae5', target: 0.2 },
};

export const DEFAULT_DATA = {
  version: 1,
  setupDone: false,
  income: 25000,
  payFrequency: 'semi-monthly', // 'semi-monthly' (15th & 30th) or 'monthly'
  categories: [
    { id: 'rent', name: 'Rent', icon: '🏠', planned: 7000, group: 'needs' },
    { id: 'electric', name: 'Electricity', icon: '💡', planned: 1500, group: 'needs' },
    { id: 'water', name: 'Water', icon: '🚰', planned: 300, group: 'needs' },
    { id: 'internet', name: 'Internet / WiFi', icon: '📶', planned: 1500, group: 'needs' },
    { id: 'load', name: 'Mobile load / data', icon: '📱', planned: 300, group: 'needs' },
    { id: 'groceries', name: 'Groceries & rice', icon: '🛒', planned: 4000, group: 'needs' },
    { id: 'commute', name: 'Commute', icon: '🚌', planned: 2000, group: 'needs' },
    { id: 'household', name: 'Toiletries & household', icon: '🧴', planned: 600, group: 'needs' },
    { id: 'eatout', name: 'Eating out / delivery', icon: '🍜', planned: 1500, group: 'wants' },
    { id: 'fun', name: 'Fun & gimmicks', icon: '🎉', planned: 1000, group: 'wants' },
    { id: 'subs', name: 'Subscriptions', icon: '🎬', planned: 300, group: 'wants' },
    { id: 'family', name: 'Padala / family', icon: '👨‍👩‍👧', planned: 1000, group: 'wants' },
    { id: 'emergency', name: 'Emergency fund', icon: '🛟', planned: 2000, group: 'savings' },
    { id: 'savings', name: 'Savings / goals', icon: '🐷', planned: 2000, group: 'savings' },
  ],
  expenses: [], // { id, categoryId, amount, note, date: 'YYYY-MM-DD' }
  moveInSaved: 0,
  moveIn: [
    { id: 'advance', name: '1 month advance rent', amount: 7000, paid: false },
    { id: 'deposit', name: 'Security deposit (2 months)', amount: 14000, paid: false },
    { id: 'bed', name: 'Bed foam / mattress & pillows', amount: 3500, paid: false },
    { id: 'fan', name: 'Electric fan', amount: 1500, paid: false },
    { id: 'ricecooker', name: 'Rice cooker', amount: 1200, paid: false },
    { id: 'kitchen', name: 'Kitchen basics', amount: 2500, paid: false },
    { id: 'cleaning', name: 'Cleaning supplies, timba & tabo', amount: 800, paid: false },
    { id: 'moving', name: 'Moving (Lalamove / truck)', amount: 1500, paid: false },
    { id: 'firstgrocery', name: 'First grocery stock-up', amount: 3000, paid: false },
  ],
};

export const ICON_CHOICES = ['🏠', '💡', '🚰', '📶', '📱', '🛒', '🚌', '🧴', '🍜', '🎉', '🎬', '👨‍👩‍👧', '🛟', '🐷', '💊', '📚', '🐶', '👕', '💳', '🎁', '⛽', '🏍️', '💼', '☕', '🧺', '✂️', '🎮', '✨'];
