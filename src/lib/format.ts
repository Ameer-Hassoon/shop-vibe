/** Locale-aware money formatting. Latin digits in both locales keep prices easy to compare. */
export function formatPrice(amount: number, locale: string = "en"): string {
  return new Intl.NumberFormat(`${locale}-u-nu-latn`, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date, locale: string = "en"): string {
  return new Intl.DateTimeFormat(`${locale}-u-nu-latn`, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}
