const COUNTRY_CURRENCIES = {
  GH: { symbol: '₵', code: 'GHS', rate: 1, name: 'Ghana Cedi' },
  NG: { symbol: '₦', code: 'NGN', rate: 150, name: 'Nigerian Naira' },
  US: { symbol: '$', code: 'USD', rate: 0.08, name: 'US Dollar' },
  GB: { symbol: '£', code: 'GBP', rate: 0.063, name: 'British Pound' },
  ZA: { symbol: 'R', code: 'ZAR', rate: 1.46, name: 'South African Rand' },
  KE: { symbol: 'KSh', code: 'KES', rate: 10.4, name: 'Kenyan Shilling' },
  TZ: { symbol: 'TSh', code: 'TZS', rate: 200, name: 'Tanzanian Shilling' },
  UG: { symbol: 'USh', code: 'UGX', rate: 296, name: 'Ugandan Shilling' },
  CM: { symbol: 'FCFA', code: 'XAF', rate: 48, name: 'CFA Franc' },
  SN: { symbol: 'FCFA', code: 'XOF', rate: 48, name: 'CFA Franc' },
  CI: { symbol: 'FCFA', code: 'XOF', rate: 48, name: 'CFA Franc' },
  ET: { symbol: 'Br', code: 'ETB', rate: 4.4, name: 'Ethiopian Birr' },
  ZM: { symbol: 'ZK', code: 'ZMW', rate: 1.6, name: 'Zambian Kwacha' },
};

const COUNTRY_NAME_TO_ISO = {
  'United States': 'US', 'USA': 'US', 'United Kingdom': 'GB', 'UK': 'GB',
  'Canada': 'CA', 'Australia': 'AU', 'Germany': 'DE', 'France': 'FR',
  'China': 'CN', 'India': 'IN', 'Brazil': 'BR', 'Nigeria': 'NG',
  'South Africa': 'ZA', 'Kenya': 'KE', 'Ghana': 'GH', 'Egypt': 'EG',
  'Morocco': 'MA', 'Tanzania': 'TZ', 'Uganda': 'UG', 'Rwanda': 'RW',
  'Zimbabwe': 'ZW', 'Zambia': 'ZM', 'Botswana': 'BW', 'Namibia': 'NA',
  'Mozambique': 'MZ', 'Angola': 'AO', 'Ethiopia': 'ET', 'Sudan': 'SD',
  'Tunisia': 'TN', 'Algeria': 'DZ', 'Libya': 'LY', 'Mauritius': 'MU',
  'Seychelles': 'SC', 'Malawi': 'MW', 'Lesotho': 'LS', 'Eswatini': 'SZ',
};

export const PRICES_GHS = {
  regular: 30,
  premium: 40,
  upgrade: 10,
  abstractRegen: 2,
  matrixRegen: 2,
  humaniseReset: 2,
  feedbackReset: 2,
  defenceRegen: 1,
};

export const getUserCountry = (user) => {
  const raw = user?.country || '';
  if (raw) return COUNTRY_NAME_TO_ISO[raw] || raw;
  try {
    const stored = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const storedCountry = stored?.country || '';
    return COUNTRY_NAME_TO_ISO[storedCountry] || storedCountry || 'GH';
  } catch { return 'GH'; }
};

export const getCurrency = (countryCode) => {
  return COUNTRY_CURRENCIES[countryCode] || COUNTRY_CURRENCIES.GH;
};

export const convertPrice = (ghsPrice, countryCode) => {
  const currency = getCurrency(countryCode);
  return Math.round(ghsPrice * currency.rate);
};

export const formatPrice = (ghsPrice, countryCode, showBoth = true) => {
  const currency = getCurrency(countryCode);
  const local = Math.round(ghsPrice * currency.rate);
  const localFormatted = `${currency.symbol}${local.toLocaleString()}`;
  if (countryCode === 'GH' || !showBoth) return localFormatted;
  const ghsFormatted = `₵${ghsPrice.toFixed(2)}`;
  return `${localFormatted} (~${ghsFormatted})`;
};


