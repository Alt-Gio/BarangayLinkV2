/**
 * Global formatting utilities for BarangayLink
 */

/**
 * Format number as Philippine Peso currency
 * @param amount - The amount to format
 * @returns Formatted string with ₱ symbol (e.g., "₱12,500.00")
 */
export const formatPeso = (amount: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format number as short Peso (for large amounts)
 * @param amount - The amount to format
 * @returns Formatted string (e.g., "₱12.5K", "₱1.2M")
 */
export const formatPesoShort = (amount: number): string => {
  if (amount >= 1000000) {
    return `₱${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `₱${(amount / 1000).toFixed(1)}K`;
  }
  return formatPeso(amount);
};

/**
 * Format date to Philippine format
 * @param date - Date to format
 * @returns Formatted date string
 */
export const formatDate = (date: Date | number): string => {
  const d = typeof date === 'number' ? new Date(date) : date;
  return d.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format date and time to Philippine format
 * @param date - Date to format
 * @returns Formatted date-time string
 */
export const formatDateTime = (date: Date | number): string => {
  const d = typeof date === 'number' ? new Date(date) : date;
  return d.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format number with thousand separators
 * @param num - Number to format
 * @returns Formatted string (e.g., "12,500")
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-PH').format(num);
};
