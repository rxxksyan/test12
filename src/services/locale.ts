type LocaleDict = Record<string, string>;

let currentLang = 'ru';
let localeData: LocaleDict = {};

export async function loadLocale(lang: string): Promise<void> {
  try {
    const res = await fetch(`/api/locale/${lang}`);
    const data = await res.json();
    currentLang = data.lang;
    localeData = data.locale;
  } catch {
    currentLang = 'ru';
    localeData = {};
  }
}

export async function fetchCurrentLocale(): Promise<string> {
  try {
    const res = await fetch('/api/locale');
    const data = await res.json();
    return data.lang;
  } catch {
    return 'ru';
  }
}

export async function setLocale(lang: string): Promise<void> {
  await fetch('/api/locale', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lang }),
  });
  await loadLocale(lang);
}

export function t(key: string, fallback?: string): string {
  return localeData[key] || fallback || key;
}

export function getCurrentLang(): string {
  return currentLang;
}

export async function initLocale(): Promise<void> {
  const lang = await fetchCurrentLocale();
  await loadLocale(lang);
}
