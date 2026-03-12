import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyDocumentLocale,
  getLocaleOptions,
  persistLocale,
  resolvePreferredLocale,
  setActiveLocale,
  translateText,
  type AppLocale,
  type LocaleOption,
} from "../lib/i18n";

type TranslateValues = Record<string, string | number>;

interface I18nContextValue {
  locale: AppLocale;
  localeOptions: LocaleOption[];
  setLocale: (locale: AppLocale) => void;
  t: (text: string, values?: TranslateValues) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(() => resolvePreferredLocale());

  const setLocale = useCallback((nextLocale: AppLocale) => {
    setLocaleState(nextLocale);
  }, []);

  useEffect(() => {
    setActiveLocale(locale);
    applyDocumentLocale(locale);
    persistLocale(locale);
  }, [locale]);

  const t = useCallback(
    (text: string, values?: TranslateValues) => translateText(text, values, locale),
    [locale],
  );

  const value = useMemo(
    () => ({
      locale,
      localeOptions: getLocaleOptions(),
      setLocale,
      t,
    }),
    [locale, setLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
