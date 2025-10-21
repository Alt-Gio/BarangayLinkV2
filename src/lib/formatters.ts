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

/**
 * Smart currency formatter for dashboards
 * Automatically chooses best format based on number size
 * @param amount - The amount to format
 * @param compact - Use compact format for large numbers (default: true)
 * @returns Formatted string optimized for display
 */
export const formatCurrency = (amount: number, compact: boolean = true): string => {
  if (!compact) {
    return formatPeso(amount);
  }

  // For very large numbers (billions)
  if (amount >= 1000000000) {
    return `₱${(amount / 1000000000).toFixed(2)}B`;
  }
  
  // For millions
  if (amount >= 1000000) {
    return `₱${(amount / 1000000).toFixed(2)}M`;
  }
  
  // For thousands
  if (amount >= 100000) {
    return `₱${(amount / 1000).toFixed(1)}K`;
  }
  
  // For smaller amounts, show with commas
  if (amount >= 1000) {
    return `₱${formatNumber(Math.round(amount))}`;
  }
  
  return formatPeso(amount);
};

/**
 * Format percentage
 * @param value - Value to format as percentage
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, decimals: number = 0): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format large number with K/M/B suffix
 * @param num - Number to format
 * @returns Formatted string
 */
export const formatLargeNumber = (num: number): string => {
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(1)}B`;
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};
