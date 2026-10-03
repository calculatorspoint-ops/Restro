/**
 * Utility functions for currency, dates, numbers, and Excel generation
 */

export function formatCurrency(amount: number | string | undefined | null, symbol = 'Rs.'): string {
  const num = Number(amount) || 0;
  return `${symbol} ${num.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;
}

export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return dateString;
  }
}

export function formatDateTime(isoString: string | undefined | null): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  } catch {
    return isoString;
  }
}

export function formatNumber(num: number | string | undefined | null): string {
  const n = Number(num) || 0;
  return n.toLocaleString('en-PK');
}
