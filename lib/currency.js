export function getGlobalCurrency() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('agency_pulse_currency') || localStorage.getItem('agency_currency');
    if (saved) return saved;
  }
  return 'INR';
}

export function formatCurrency(amount, currency) {
  const val = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  const targetCurrency = currency || getGlobalCurrency();
  const currencyUpper = (targetCurrency || 'INR').toUpperCase();
  
  const localeMap = {
    INR: 'en-IN',
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    CAD: 'en-CA',
    AUD: 'en-AU',
  };

  const locale = localeMap[currencyUpper] || 'en-IN';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyUpper,
      maximumFractionDigits: 0,
    }).format(val);
  } catch {
    return `${currencyUpper} ${val.toLocaleString()}`;
  }
}

