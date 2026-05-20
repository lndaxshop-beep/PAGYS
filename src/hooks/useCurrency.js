import { useState } from 'react';
import { getUserCountry, formatPrice, convertPrice, PRICES_GHS } from '../constants/pricing';

export const useCurrency = () => {
  const [country] = useState(getUserCountry());
  return {
    country,
    fmt: (ghsPrice, showBoth = true) => formatPrice(ghsPrice, country, showBoth),
    conv: (ghsPrice) => convertPrice(ghsPrice, country),
    prices: PRICES_GHS,
  };
};
