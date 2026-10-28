import type { Locale } from "./i18n";

export const formatPrice = (amount: number, lang: Locale, currency: string) =>
  lang === "ar" ? `${amount.toFixed(3)} ${currency}` : `${currency} ${amount.toFixed(3)}`;
