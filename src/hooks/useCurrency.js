import { useState, useEffect } from 'react';
import { getUserCountry, formatPrice, convertPrice, PRICES_USD } from '../constants/pricing';

export const useCurrency = () => {
  const [country, setCountry] = useState('GH');

  useEffect(() => {
    setCountry(getUserCountry());
    const interval = setInterval(() => setCountry(getUserCountry()), 3000);
    return () => clearInterval(interval);
  }, []);

  return {
    country,
    fmt: (usdPrice, showBoth = true) => formatPrice(usdPrice, country, showBoth),
    conv: (usdPrice) => convertPrice(usdPrice, country),
    prices: PRICES_USD,
  };
};
