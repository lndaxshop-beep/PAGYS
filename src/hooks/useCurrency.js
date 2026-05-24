import { getUserCountry, formatPrice, convertPrice, PRICES_GHS } from '../constants/pricing';
import { useAuth } from '../contexts/AuthContext';

export const useCurrency = () => {
  const { user } = useAuth();
  const country = getUserCountry(user);
  return {
    country,
    fmt: (ghsPrice, showBoth = true) => formatPrice(ghsPrice, country, showBoth),
    conv: (ghsPrice) => convertPrice(ghsPrice, country),
    prices: PRICES_GHS,
  };
};
