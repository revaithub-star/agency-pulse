export function formatCurrency(amount, currency = 'USD') {
  const val = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  const currencyUpper = (currency || 'USD').toUpperCase();
  
  const localeMap = {
    INR: 'en-IN',
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    CAD: 'en-CA',
    AUD: 'en-AU',
  };

  const locale = localeMap[currencyUpper] || 'en-US';

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
