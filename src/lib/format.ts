const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

/**
 * Money formatting. Both locales show "$1,234.56" (Latin digits, symbol first) so prices are easy to
 * compare. In Arabic the value is wrapped in Unicode LTR isolate marks so the bidi algorithm keeps
 * "-$3.40" together instead of rendering it as "US$ 3.40-".
 */
export function formatPrice(amount: number, locale: string = "en"): string {
  const s = money.format(amount);
  return locale === "ar" ? `⁦${s}⁩` : s;
}

export function formatDate(date: string | Date, locale: string = "en"): string {
  return new Intl.DateTimeFormat(`${locale}-u-nu-latn`, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}
