import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Mail } from 'lucide-react';
import { useAppearance } from '@/contexts/AppearanceContext';
import { useAuth } from '@/contexts/AuthContext';

export default function Verification() {
  const router = useRouter();
  const { accentColor } = useAppearance();
  const { user } = useAuth();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index, value) => {
    if (value.length > 1) {
      value = value[0];
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const newCode = [...code];
    
    for (let i = 0; i < pastedData.length; i++) {
      if (i < 6) {
        newCode[i] = pastedData[i];
      }
    }
    
    setCode(newCode);
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const verificationCode = code.join('');
    if (verificationCode.length === 6) {
      setLoading(true);
      setError('');

      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ code: verificationCode }),
        });

        const data = await response.json();

        if (data.success) {
          router.push('/dashboard');
        } else {
          setError(data.message || 'Invalid verification code');
        }
      } catch (err) {
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleResend = async () => {
    setCode(['', '', '', '', '', '']);
    setError('');
    inputRefs.current[0]?.focus();
  };

  return (
    <>
      <Head>
        <title>Vérification - PIOLEC CMS</title>
        <meta name="description" content="Verify your email address" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-full border-4 flex items-center justify-center" style={{ borderColor: accentColor }}>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: accentColor }}></div>
            </div>
            <span className="text-2xl font-bold text-gray-800 dark:text-white">PIOLEC CMS</span>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
            {/* Title */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${accentColor}20` }}>
                <Mail style={{ color: accentColor }} size={32} />
              </div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Verify your email</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                We sent a verification code to<br />
                <span className="font-medium text-gray-700 dark:text-gray-300">{user?.email || 'your email'}</span>
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Code Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">
                  Enter verification code
                </label>
                <div className="flex gap-2 justify-center">
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                      onFocus={(e) => e.currentTarget.style.boxShadow = `0 0 0 2px ${accentColor}`}
                      onBlur={(e) => e.currentTarget.style.boxShadow = ''}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={code.join('').length !== 6 || loading}
                className="w-full text-white py-3 rounded-xl font-medium hover:opacity-90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: accentColor }}
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>
            </form>

            {/* Resend */}
            <div className="text-center mt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Didn't receive the code?{' '}
                <button 
                  onClick={handleResend}
                  className="font-medium hover:opacity-80"
                  style={{ color: accentColor }}
                >
                  Resend
                </button>
              </p>
            </div>

            {/* Back Link */}
            <div className="text-center mt-4">
              <Link href="/" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
