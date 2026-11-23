export function peso(n, withCents = false) {
  const value = Number(n) || 0;
  const neg = value < 0;
  const abs = Math.abs(value);
  const fixed = withCents ? abs.toFixed(2) : Math.round(abs).toString();
  const [int, dec] = fixed.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${neg ? '-' : ''}₱${grouped}${dec ? '.' + dec : ''}`;
}

export function toNumber(text) {
  const n = parseFloat(String(text).replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 0 : n;
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function todayISO() {
  const d = new Date();
  return toISODate(d);
}

export function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// month is { y, m } with m = 0..11
export function currentMonth() {
  const d = new Date();
  return { y: d.getFullYear(), m: d.getMonth() };
}

export function shiftMonth({ y, m }, delta) {
  const d = new Date(y, m + delta, 1);
  return { y: d.getFullYear(), m: d.getMonth() };
}

export function inMonth(isoDate, { y, m }) {
  const [yy, mm] = isoDate.split('-').map(Number);
  return yy === y && mm - 1 === m;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function monthLabel({ y, m }) {
  return `${MONTHS[m]} ${y}`;
}

export function prettyDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1].slice(0, 3)} ${d}, ${y}`;
}

export function isValidISO(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}
