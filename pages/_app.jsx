import '@/styles/globals.css';
import '@/components/ui/BlogEditor/styles.css';
import '@/lib/patchFetchCsrf';
import { AppearanceProvider } from '@/contexts/AppearanceContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { Analytics } from '@vercel/analytics/next';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <AppearanceProvider>
        <ToastProvider>
          <Component {...pageProps} />
          <Analytics />
        </ToastProvider>
      </AppearanceProvider>
    </AuthProvider>
  );
}
