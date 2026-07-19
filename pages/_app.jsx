import '@/styles/globals.css';
import { AppearanceProvider } from '@/contexts/AppearanceContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <AppearanceProvider>
        <ToastProvider>
          <Component {...pageProps} />
        </ToastProvider>
      </AppearanceProvider>
    </AuthProvider>
  );
}
