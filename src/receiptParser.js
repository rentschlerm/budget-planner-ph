// Pure functions that turn OCR text from a receipt into { amount, date, merchant, categoryId }.
// Kept free of React Native imports so it can be tested with plain Node.

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

// Money with exactly two decimals: 1,234.50 · 245.00 · P 99.75 · ₱1 250.00
const MONEY_RE = /(?:₱|php|p)?\s?(\d{1,3}(?:[,\s]\d{3})+|\d+)[.,](\d{2})(?!\d)/gi;

const STRONG_TOTAL = /(grand\s*total|total\s*amount|amount\s*due|total\s*due|amount\s*payable|total\s*sales|net\s*amount|total\s*paid|amount\s*paid|you\s*paid)/i;
const WEAK_TOTAL = /\btotal\b/i;
const NOT_TOTAL = /(sub\s*-?\s*total|total\s*(items?|qty|quantity|discount|savings|vat)|vat|change|cash|tender|discount|points|balance|rounding)/i;
const CASH_LINE = /(cash|tender|change|payment\s*received)/i;

function amountsIn(line) {
  const out = [];
  let m;
  MONEY_RE.lastIndex = 0;
  while ((m = MONEY_RE.exec(line))) {
    const whole = m[1].replace(/[,\s]/g, '');
    const value = parseFloat(`${whole}.${m[2]}`);
    if (value > 0 && value < 1000000) out.push(value);
  }
  return out;
}

export function findTotal(lines) {
  // 1) A line labelled as the total (or the line right after it, when OCR splits columns).
  let best = null;
  lines.forEach((line, i) => {
    const strong = STRONG_TOTAL.test(line);
    const weak = !strong && WEAK_TOTAL.test(line);
    if (!(strong || weak) || NOT_TOTAL.test(line.replace(STRONG_TOTAL, ''))) return;
    let found = amountsIn(line);
    for (let k = 1; !found.length && k <= 2 && i + k < lines.length; k++) {
      if (STRONG_TOTAL.test(lines[i + k]) || WEAK_TOTAL.test(lines[i + k])) break;
      found = amountsIn(lines[i + k]);
    }
    if (!found.length) return;
    const value = Math.max(...found);
    const score = strong ? 3 : 2;
    if (!best || score > best.score || (score === best.score && value > best.value)) best = { value, score };
  });
  if (best) return { amount: best.value, confident: true };

  // 2) No label found: the total is usually printed more than once (TOTAL, AMOUNT DUE…).
  const counts = {};
  const all = [];
  lines.forEach((line) => {
    if (CASH_LINE.test(line)) return;
    amountsIn(line).forEach((v) => {
      counts[v] = (counts[v] || 0) + 1;
      all.push(v);
    });
  });
  if (!all.length) return { amount: null, confident: false };
  const repeated = Object.keys(counts).map(Number).filter((v) => counts[v] > 1);
  if (repeated.length) return { amount: Math.max(...repeated), confident: false };
  return { amount: Math.max(...all), confident: false };
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function validDate(y, m, d) {
  if (y < 100) y += 2000;
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  const now = new Date();
  const ageDays = (now - dt) / 86400000;
  if (ageDays < -1 || ageDays > 120) return null; // receipts are recent
  return `${y}-${pad(m)}-${pad(d)}`;
}

export function findDate(lines) {
  const text = lines.join(' ');
  let m;
  const iso = /(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})/g;
  while ((m = iso.exec(text))) {
    const r = validDate(+m[1], +m[2], +m[3]);
    if (r) return r;
  }
  const num = /\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/g; // PH receipts are usually MM/DD/YYYY
  while ((m = num.exec(text))) {
    let a = +m[1];
    let b = +m[2];
    const y = +m[3];
    const r = validDate(y, a, b) || validDate(y, b, a);
    if (r) return r;
  }
  const word = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2}),?\s+(20\d{2})/gi;
  while ((m = word.exec(text))) {
    const r = validDate(+m[3], MONTHS.indexOf(m[1].toLowerCase()) + 1, +m[2]);
    if (r) return r;
  }
  return null;
}

const NOT_MERCHANT = /(official\s*receipt|sales\s*invoice|invoice|receipt|vat\s*reg|non-?vat|\btin\b|tel\b|telephone|address|welcome|cashier|\bpos\b|\bdate\b|\btime\b|min\s*#|serial|permit|branch|\bst\.?\b|street|brgy|barangay|city|^\d+\s)/i;

function titleCase(s) {
  if (s !== s.toUpperCase()) return s;
  return s.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase());
}

export function findMerchant(lines) {
  for (const raw of lines.slice(0, 8)) {
    const line = raw.trim();
    const letters = (line.match(/[a-z]/gi) || []).length;
    if (letters < 3 || letters / line.length < 0.6 || line.length > 40) continue;
    if (NOT_MERCHANT.test(line)) continue;
    return titleCase(line.replace(/\s+/g, ' '));
  }
  return '';
}

// Each rule lists category ids to try (new simple template first, then older detailed ids),
// and words to look for in the user's own category names.
const RULES = [
  { re: /(meralco|veco|davao\s*light|electric|power\s*co)/i, ids: ['bills', 'electric'], words: ['bill', 'electric'] },
  { re: /(maynilad|manila\s*water|water\s*district|waterworks)/i, ids: ['bills', 'water'], words: ['bill', 'water'] },
  { re: /(pldt|globe|smart\s*comm|converge|sky\s*cable|skycable|dito|fiber|broadband)/i, ids: ['bills', 'internet', 'load'], words: ['bill', 'internet', 'load'] },
  { re: /(jollibee|mcdo|mcdonald|chowking|greenwich|mang\s*inasal|kfc|starbucks|coffee|caf[eé]|restaurant|resto|pizza|burger|bakery|bakeshop|red\s*ribbon|goldilocks|shakey|max'?s|potato\s*corner|milk\s*tea|bbq|grill|eatery|carinderia|foodpanda|grabfood|food\s*court|dine)/i, ids: ['food', 'eatout'], words: ['food', 'eat'] },
  { re: /(supermarket|puregold|savemore|save\s*more|sm\s*market|hypermarket|robinsons\s*(super|easymart)|waltermart|walter\s*mart|alfamart|7-?\s*eleven|ministop|family\s*mart|lawson|grocery|landers|s\s*&\s*r|metro\s*(super|retail)|gaisano|prince\s*hyper|palengke|market)/i, ids: ['groceries'], words: ['grocer'] },
  { re: /(petron|shell|caltex|seaoil|phoenix|cleanfuel|unioil|grab|angkas|joyride|lrt|mrt|toll|autosweep|easytrip|parking|gasoline|diesel)/i, ids: ['transport', 'commute'], words: ['transport', 'commute'] },
  { re: /(mercury\s*drug|watsons|southstar|rose\s*pharmacy|pharmacy|drugstore|botica|generika|generics|salon|barber|laundry|ace\s*hardware|wilcon|handyman|daiso|miniso|japan\s*home)/i, ids: ['personal', 'household'], words: ['personal', 'household', 'toiletr'] },
  { re: /(cinema|netflix|spotify|steam|playstation|timezone|ktv|videoke|lazada|shopee)/i, ids: ['fun', 'subs'], words: ['fun', 'subscri'] },
  { re: /(\brent\b|lease|dormitory|\bdorm\b|association\s*dues)/i, ids: ['rent'], words: ['rent'] },
];

export function guessCategory(text, categories) {
  for (const rule of RULES) {
    if (!rule.re.test(text)) continue;
    const byId = rule.ids.map((id) => categories.find((c) => c.id === id)).find(Boolean);
    if (byId) return byId.id;
    const byName = categories.find((c) => rule.words.some((w) => c.name.toLowerCase().includes(w)));
    if (byName) return byName.id;
  }
  return null;
}

export function parseReceipt(blocks, categories) {
  const lines = blocks
    .flatMap((b) => String(b).split('\n'))
    .map((s) => s.trim())
    .filter(Boolean);
  const { amount, confident } = findTotal(lines);
  const merchant = findMerchant(lines);
  return {
    amount,
    amountConfident: confident,
    date: findDate(lines),
    merchant,
    // The store name (top of the receipt) is the best hint; item lines are a fallback.
    categoryId:
      guessCategory([merchant, ...lines.slice(0, 5)].join(' '), categories) ||
      guessCategory(lines.join(' '), categories),
    lineCount: lines.length,
  };
}
