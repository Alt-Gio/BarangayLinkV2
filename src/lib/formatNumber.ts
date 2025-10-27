/**
 * SMART NUMBER FORMATTING UTILITY
 * Formats numbers intelligently based on magnitude
 * 
 * Examples:
 * - 824 → "824"
 * - 1,500 → "1.5K"
 * - 25,000 → "25K"
 * - 100,000 → "100K"
 * - 1,000,000 → "1M"
 * - 2,500,000 → "2.5M"
 */

export function formatNumber(value: number): string {
  if (value < 1000) {
    // Below 1K: show exact number
    return value.toString();
  } else if (value < 100000) {
    // 1K to 99.9K
    const thousands = value / 1000;
    if (thousands % 1 === 0) {
      // Whole number (e.g., 5000 → "5K")
      return `${thousands}K`;
    } else {
      // Decimal (e.g., 1500 → "1.5K")
      return `${thousands.toFixed(1)}K`;
    }
  } else if (value < 1000000) {
    // 100K to 999K
    const thousands = Math.floor(value / 1000);
    return `${thousands}K`;
  } else if (value < 100000000) {
    // 1M to 99.9M
    const millions = value / 1000000;
    if (millions % 1 === 0) {
      // Whole number (e.g., 5000000 → "5M")
      return `${millions}M`;
    } else {
      // Decimal (e.g., 1500000 → "1.5M")
      return `${millions.toFixed(1)}M`;
    }
  } else {
    // 100M+
    const millions = Math.floor(value / 1000000);
    return `${millions}M`;
  }
}

/**
 * Format currency with smart number formatting
 * Example: formatCurrency(100000) → "₱100K"
 */
export function formatCurrency(value: number, currency: string = "₱"): string {
  return `${currency}${formatNumber(value)}`;
}

/**
 * Format currency with full precision (for detailed views)
 * Example: formatCurrencyFull(100000) → "₱100,000.00"
 */
export function formatCurrencyFull(value: number, currency: string = "₱"): string {
  return `${currency}${value.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
}
