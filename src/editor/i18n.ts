import { createInstance } from "i18next";
import resourcesToBackend from "i18next-resources-to-backend";
import { supportedLanguages } from "../config/languages";

// No browser detector, storage cache, or mutation of the host's i18next instance.
export const editorI18n = createInstance();
void editorI18n.use(resourcesToBackend((lang: string, ns: string) => {
  if (lang === "en") return {};
  return import(`../locales/${lang}/${ns}.json`);
})).init({
  lng: "en",
  resources: { en: { translation: {} } },
  partialBundledLanguages: true,
  react: { useSuspense: false },
  fallbackLng: "en",
  supportedLngs: Object.keys(supportedLanguages),
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false },
});
