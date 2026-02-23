export function normalizeKuwaitPhone(raw?: string | null): string | null {
  if (!raw) return null;

  const map: Record<string, string> = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  };

  const normalizedDigits = raw
    .trim()
    .replace(/[٠-٩۰-۹]/g, (char) => map[char] ?? char)
    .replace(/\D+/g, '');

  if (!normalizedDigits) return null;

  let digits = normalizedDigits;

  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  if (digits.length === 9 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  if (digits.length === 8) {
    digits = `965${digits}`;
  }

  if (!digits.startsWith('965') || digits.length !== 11) {
    return null;
  }

  return `+${digits}`;
}

