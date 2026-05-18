import { useState } from 'react';
import { getUserCountry, formatPrice, convertPrice, PRICES_USD } from '../constants/pricing';

export const useCurrency = () => {
  const [country] = useState(getUserCountry());
  return {
    country,
    fmt: (usdPrice, showBoth = true) => formatPrice(usdPrice, country, showBoth),
    conv: (usdPrice) => convertPrice(usdPrice, country),
    prices: PRICES_USD,
  };
};
