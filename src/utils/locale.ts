import i18nEn from './i18n.en';
import i18nEs from './i18n.es';

export type Translations = typeof i18nEn;

const locales = {
  en: i18nEn,
  es: i18nEs,
};

export function getComponentClosestLanguage(element: HTMLElement): string {
  let closestElement = element.closest('[lang]') as HTMLElement;
  return closestElement ? closestElement.lang : 'en';
}

export function getLocaleComponentStrings(element: HTMLElement) {
  let componentLanguage = getComponentClosestLanguage(element);

  return locales[componentLanguage];
}

export function replaceSubstringsWithObject(str, obj) {
  const regex = new RegExp(Object.keys(obj).map(key => `\\{${key}\\}`).join("|"), "gi");
  return str.replace(regex, (match) => obj[match.substring(1, match.length-1)]);
}
