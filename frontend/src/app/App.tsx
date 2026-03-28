// frontend/src/app/App.tsx
import { HomePage } from "@/pages/HomePage";
import { I18nProvider } from "@/lib/i18n";

export default function App() {
  return (
    <I18nProvider>
      <HomePage />
    </I18nProvider>
  );
}
