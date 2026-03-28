// frontend/src/lib/i18n.tsx
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type Locale = "en" | "ru";

type Dictionary = Record<string, string>;

type I18nContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: string) => string;
};

const dictionaries: Record<Locale, Dictionary> = {
  en: {
    "header.title": "Light PDF Text Editor",
    "header.subtitle": "Fast text replacement for digital PDFs: invoices, forms, and receipts.",
    "header.lang": "Language",
    "upload.title": "Upload PDF",
    "upload.subtitle": "Only digital text PDFs are supported. No OCR in MVP.",
    "upload.select": "Select PDF",
    "upload.loading": "Uploading...",
    "editor.title": "Block Properties",
    "editor.subtitle": "Select highlighted text block on the page to edit.",
    "editor.addText": "Add text",
    "editor.addTextMode": "Click page to place text",
    "editor.download": "Download PDF",
    "editor.original": "Original text",
    "editor.new": "New text",
    "editor.boldHint": "Use `**text**` to make part of the text bold.",
    "editor.fontFamily": "Font family",
    "editor.fontSize": "Font size",
    "editor.boldAll": "Bold all text",
    "editor.scale": "Block scale",
    "editor.scaleHint": "Drag box in preview or use corner handles for resize.",
    "editor.apply": "Apply change",
    "editor.applying": "Applying...",
    "editor.delete": "Delete block",
    "editor.reset": "Reset block",
    "editor.noBlock": "No block selected. Click any highlighted text area in the PDF viewer.",
    "editor.warnings": "Warnings",
    "viewer.loading": "Loading PDF...",
    "viewer.hitArea": "page-hit-area",
    "home.uploadPrompt": "Upload PDF to start editing text blocks.",
    "error.upload": "Upload failed",
    "error.apply": "Unable to apply changes",
    "error.delete": "Unable to delete block",
  },
  ru: {
    "header.title": "Light PDF Text Editor",
    "header.subtitle": "Быстрая замена текста в цифровых PDF: счета, формы и квитанции.",
    "header.lang": "Язык",
    "upload.title": "Загрузка PDF",
    "upload.subtitle": "Поддерживаются только цифровые текстовые PDF. OCR в MVP нет.",
    "upload.select": "Выбрать PDF",
    "upload.loading": "Загрузка...",
    "editor.title": "Свойства блока",
    "editor.subtitle": "Выберите подсвеченный текстовый блок на странице для редактирования.",
    "editor.addText": "Добавить текст",
    "editor.addTextMode": "Кликните по странице для вставки",
    "editor.download": "Скачать PDF",
    "editor.original": "Исходный текст",
    "editor.new": "Новый текст",
    "editor.boldHint": "Используйте `**текст**`, чтобы сделать часть текста жирной.",
    "editor.fontFamily": "Шрифт",
    "editor.fontSize": "Размер шрифта",
    "editor.boldAll": "Жирный для всего текста",
    "editor.scale": "Масштаб блока",
    "editor.scaleHint": "Перетаскивайте блок в превью или тяните за угловые ручки.",
    "editor.apply": "Применить",
    "editor.applying": "Применение...",
    "editor.delete": "Удалить блок",
    "editor.reset": "Сбросить блок",
    "editor.noBlock": "Блок не выбран. Кликните по подсвеченной области текста в PDF viewer.",
    "editor.warnings": "Предупреждения",
    "viewer.loading": "Загрузка PDF...",
    "viewer.hitArea": "область страницы",
    "home.uploadPrompt": "Загрузите PDF, чтобы начать редактирование текстовых блоков.",
    "error.upload": "Не удалось загрузить PDF",
    "error.apply": "Не удалось применить изменения",
    "error.delete": "Не удалось удалить блок",
  },
};

const I18nContext = createContext<I18nContextValue | null>(null);

function resolveInitialLocale(): Locale {
  const saved = localStorage.getItem("light-pdf-locale");
  if (saved === "ru" || saved === "en") {
    return saved;
  }
  return "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => resolveInitialLocale());

  const value = useMemo<I18nContextValue>(() => {
    return {
      locale,
      setLocale: (next) => {
        localStorage.setItem("light-pdf-locale", next);
        setLocaleState(next);
      },
      t: (key) => dictionaries[locale][key] ?? dictionaries.en[key] ?? key,
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
