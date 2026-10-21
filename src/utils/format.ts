export function formatCompactNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { notation: 'compact' }).format(value);
}

export function formatPercentChange(
  current: number,
  previous: number,
): number | null {
  if (previous === 0) {
    return null;
  }
  return ((current - previous) / previous) * 100;
}

export function formatSignedPercent(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: 1,
    signDisplay: 'always',
  }).format(value / 100);
}

export function getCountryName(code: string, locale: string): string {
  try {
    const displayNames = new Intl.DisplayNames([locale], { type: 'region' });
    return displayNames.of(code) ?? code;
  } catch {
    return code;
  }
}

export function formatShortDate(isoDate: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
  }).format(new Date(isoDate));
}

export function truncateLabel(value: string, maxLength = 28): string {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 1)}…`;
}
