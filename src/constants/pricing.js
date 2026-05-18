const COUNTRY_CURRENCIES = {
  GH: { symbol: '₵', code: 'GHS', rate: 12.5, name: 'Ghana Cedi' },
  NG: { symbol: '₦', code: 'NGN', rate: 1500, name: 'Nigerian Naira' },
  US: { symbol: '$', code: 'USD', rate: 1, name: 'US Dollar' },
  GB: { symbol: '£', code: 'GBP', rate: 0.79, name: 'British Pound' },
  ZA: { symbol: 'R', code: 'ZAR', rate: 18.2, name: 'South African Rand' },
  KE: { symbol: 'KSh', code: 'KES', rate: 130, name: 'Kenyan Shilling' },
  TZ: { symbol: 'TSh', code: 'TZS', rate: 2500, name: 'Tanzanian Shilling' },
  UG: { symbol: 'USh', code: 'UGX', rate: 3700, name: 'Ugandan Shilling' },
  CM: { symbol: 'FCFA', code: 'XAF', rate: 600, name: 'CFA Franc' },
  SN: { symbol: 'FCFA', code: 'XOF', rate: 600, name: 'CFA Franc' },
  CI: { symbol: 'FCFA', code: 'XOF', rate: 600, name: 'CFA Franc' },
  ET: { symbol: 'Br', code: 'ETB', rate: 55, name: 'Ethiopian Birr' },
  ZM: { symbol: 'ZK', code: 'ZMW', rate: 20, name: 'Zambian Kwacha' },
};

export const PRICES_USD = {
  regular: 2.40,
  premium: 3.20,
  upgrade: 0.80,
  abstractRegen: 0.16,
  matrixRegen: 0.16,
  humaniseReset: 0.16,
  feedbackReset: 0.16,
  defenceRegen: 0.08,
};

export const getUserCountry = () => {
  try {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return user?.country || 'GH';
  } catch { return 'GH'; }
};

export const getCurrency = (countryCode) => {
  return COUNTRY_CURRENCIES[countryCode] || COUNTRY_CURRENCIES.GH;
};

export const convertPrice = (usdPrice, countryCode) => {
  const currency = getCurrency(countryCode);
  return Math.round(usdPrice * currency.rate);
};

export const formatPrice = (usdPrice, countryCode, showBoth = true) => {
  const currency = getCurrency(countryCode);
  const local = Math.round(usdPrice * currency.rate);
  const localFormatted = `${currency.symbol}${local}`;
  if (countryCode === 'US' || !showBoth) return localFormatted;
  const usdFormatted = `$${usdPrice.toFixed(2)}`;
  return `${localFormatted} (~${usdFormatted})`;
};
