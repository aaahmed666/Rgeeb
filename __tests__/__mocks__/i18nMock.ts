const i18nMock = {
  t: (key: string, opts?: Record<string, unknown>) => {
    if (opts?.name) return `Hello, ${opts.name}!`;
    return key;
  },
  i18n: { resolvedLanguage: "en", language: "en" },
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts?.name) return `Hello, ${opts.name}!`;
      return key;
    },
    i18n: { resolvedLanguage: "en", language: "en" },
  }),
};
export default i18nMock;
