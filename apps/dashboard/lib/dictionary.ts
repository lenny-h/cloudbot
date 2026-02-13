import { type Locale, i18n } from "@workspace/ui/lib/i18n.config";

const dictionaries = {
  en: () => import("@/dictionaries/en.json").then((module) => module.default),
  de: () => import("@/dictionaries/de.json").then((module) => module.default),
};

export const getDictionary = async (locale: Locale) => {
  const validLocale = dictionaries[locale] ? locale : i18n.defaultLocale;
  return dictionaries[validLocale]();
};
