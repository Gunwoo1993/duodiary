import { AuthProvider } from './components/AuthProvider';
import { CoupleProvider } from './components/CoupleProvider';
import Layout from './components/Layout';
import { Toaster } from '@/components/ui/sonner';
import { I18nProvider } from './lib/i18n';

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <CoupleProvider>
          <Layout />
          <Toaster position="top-center" />
        </CoupleProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
