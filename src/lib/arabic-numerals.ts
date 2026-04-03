/**
 * Arabic Numerals Utility
 * 
 * This utility provides functions to convert between Western numerals (0-9)
 * and Arabic numerals (٠-٩) for use in the طمنّي (Tamenny) app.
 */

// Western to Arabic numeral mapping
const WESTERN_TO_ARABIC: Record<string, string> = {
  '0': '٠',
  '1': '١',
  '2': '٢',
  '3': '٣',
  '4': '٤',
  '5': '٥',
  '6': '٦',
  '7': '٧',
  '8': '٨',
  '9': '٩',
};

// Arabic to Western numeral mapping
const ARABIC_TO_WESTERN: Record<string, string> = {
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
};

/**
 * Convert a Western numeral string to Arabic numerals
 * @param value - String or number containing Western numerals
 * @returns String with Arabic numerals
 */
export function toArabicNumerals(value: string | number): string {
  const str = String(value);
  return str.replace(/[0-9]/g, (digit) => WESTERN_TO_ARABIC[digit] || digit);
}

/**
 * Convert an Arabic numeral string to Western numerals
 * @param value - String containing Arabic numerals
 * @returns String with Western numerals
 */
export function toWesternNumerals(value: string): string {
  return value.replace(/[٠-٩]/g, (digit) => ARABIC_TO_WESTERN[digit] || digit);
}

/**
 * Format a number with Arabic numerals
 * @param value - Number to format
 * @param options - Intl.NumberFormat options
 * @returns Formatted string with Arabic numerals
 */
export function formatArabicNumber(
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  const formatted = new Intl.NumberFormat('ar-EG', options).format(value);
  // The ar-EG locale already produces Arabic numerals in most cases
  // But we ensure consistency by converting any remaining Western numerals
  return toArabicNumerals(formatted);
}

/**
 * Format distance with Arabic numerals
 * @param distance - Distance value
 * @param unit - Distance unit ('km' or 'm')
 * @returns Formatted distance string with Arabic numerals
 */
export function formatArabicDistance(
  distance: number,
  unit: 'km' | 'm' = 'km'
): string {
  const arabicDistance = toArabicNumerals(distance.toFixed(unit === 'km' ? 1 : 0));
  const unitText = unit === 'km' ? 'كم' : 'م';
  return `${arabicDistance} ${unitText}`;
}

/**
 * Format duration with Arabic numerals
 * @param duration - Duration in the specified unit
 * @param unit - Duration unit ('hours', 'minutes', or 'seconds')
 * @returns Formatted duration string with Arabic numerals
 */
export function formatArabicDuration(
  duration: number,
  unit: 'hours' | 'minutes' | 'seconds' = 'minutes'
): string {
  const arabicDuration = toArabicNumerals(duration.toString());
  const unitText = {
    hours: 'ساعة',
    minutes: 'دقيقة',
    seconds: 'ثانية',
  }[unit];
  
  return `${arabicDuration} ${unitText}`;
}

/**
 * Format time duration from seconds to readable Arabic string
 * @param seconds - Total duration in seconds
 * @returns Formatted time string like "١ ساعة ٣٠ دقيقة"
 */
export function formatArabicTimeFromSeconds(seconds: number): string {
  if (seconds < 60) {
    return `${toArabicNumerals(seconds)} ثانية`;
  }
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  const parts: string[] = [];
  
  if (hours > 0) {
    parts.push(`${toArabicNumerals(hours)} ساعة`);
  }
  
  if (minutes > 0) {
    parts.push(`${toArabicNumerals(minutes)} دقيقة`);
  }
  
  if (remainingSeconds > 0 && hours === 0) {
    parts.push(`${toArabicNumerals(remainingSeconds)} ثانية`);
  }
  
  return parts.join(' ');
}

/**
 * Format time duration from minutes to readable Arabic string
 * @param minutes - Total duration in minutes
 * @returns Formatted time string
 */
export function formatArabicTimeFromMinutes(minutes: number): string {
  return formatArabicTimeFromSeconds(minutes * 60);
}

/**
 * Format a date with Arabic numerals
 * @param date - Date to format
 * @param options - DateTimeFormat options
 * @returns Formatted date string with Arabic numerals
 */
export function formatArabicDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
): string {
  const dateObj = new Date(date);
  const formatted = new Intl.DateTimeFormat('ar-EG', options).format(dateObj);
  return toArabicNumerals(formatted);
}

/**
 * Format a time with Arabic numerals
 * @param date - Date/time to format
 * @returns Formatted time string like "٠٣:٣٠ م"
 */
export function formatArabicTime(
  date: Date | string | number
): string {
  const dateObj = new Date(date);
  const hours = dateObj.getHours();
  const minutes = dateObj.getMinutes();
  const period = hours >= 12 ? 'م' : 'ص';
  const displayHours = hours % 12 || 12;
  
  const formattedHours = toArabicNumerals(displayHours.toString().padStart(2, '0'));
  const formattedMinutes = toArabicNumerals(minutes.toString().padStart(2, '0'));
  
  return `${formattedHours}:${formattedMinutes} ${period}`;
}

/**
 * Format currency with Arabic numerals
 * @param amount - Amount to format
 * @param currency - Currency code (default: 'EGP')
 * @returns Formatted currency string
 */
export function formatArabicCurrency(
  amount: number,
  currency: string = 'EGP'
): string {
  const formatted = new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency,
  }).format(amount);
  return toArabicNumerals(formatted);
}

/**
 * Format percentage with Arabic numerals
 * @param value - Percentage value (0-100)
 * @returns Formatted percentage string
 */
export function formatArabicPercentage(value: number): string {
  return `${toArabicNumerals(value.toFixed(0))}٪`;
}

/**
 * Format phone number with Arabic numerals (display only)
 * @param phone - Phone number string
 * @returns Phone number with Arabic numerals for display
 */
export function formatArabicPhone(phone: string): string {
  return toArabicNumerals(phone);
}

/**
 * Parse Arabic numeral string to number
 * @param value - String containing Arabic numerals
 * @returns Parsed number
 */
export function parseArabicNumber(value: string): number {
  const westernString = toWesternNumerals(value);
  // Remove any non-numeric characters except decimal point and minus
  const cleaned = westernString.replace(/[^\d.-]/g, '');
  return parseFloat(cleaned) || 0;
}

/**
 * Check if a string contains Arabic numerals
 * @param value - String to check
 * @returns Boolean indicating presence of Arabic numerals
 */
export function hasArabicNumerals(value: string): boolean {
  return /[٠-٩]/.test(value);
}

/**
 * Check if a string contains Western numerals
 * @param value - String to check
 * @returns Boolean indicating presence of Western numerals
 */
export function hasWesternNumerals(value: string): boolean {
  return /[0-9]/.test(value);
}

// Export the mapping objects for advanced use cases
export { WESTERN_TO_ARABIC, ARABIC_TO_WESTERN };
