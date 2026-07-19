import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Mail, ArrowLeft } from 'lucide-react';
import { useAppearance } from '@/contexts/AppearanceContext';

export default function ForgotPassword() {
  const router = useRouter();
  const { accentColor } = useAppearance();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSubmitted(true);
      } else {
        setError(data.message || 'Failed to send reset email');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Forgot Password - Taskily</title>
        <meta name="description" content="Reset your Taskily password" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-full border-4 flex items-center justify-center" style={{ borderColor: accentColor }}>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: accentColor }}></div>
            </div>
            <span className="text-2xl font-bold text-gray-800 dark:text-white">Taskily</span>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
            {!isSubmitted ? (
              <>
                {/* Title */}
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${accentColor}20` }}>
                    <Mail style={{ color: accentColor }} size={32} />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Forgot Password?</h1>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No worries, we'll send you reset instructions
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                        onFocus={(e) => e.currentTarget.style.boxShadow = `0 0 0 2px ${accentColor}`}
                        onBlur={(e) => e.currentTarget.style.boxShadow = ''}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full text-white py-3 rounded-xl font-medium hover:opacity-90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: accentColor }}
                  >
                    {loading ? 'Sending...' : 'Reset Password'}
                  </button>
                </form>

                <Link 
                  href="/" 
                  className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mt-6"
                >
                  <ArrowLeft size={16} />
                  Back to login
                </Link>
              </>
            ) : (
              <>
                {/* Success State */}
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${accentColor}20` }}>
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: accentColor }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Check your email</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                    We sent a password reset link to<br />
                    <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span>
                  </p>
                  
                  <button
                    onClick={() => router.push('/')}
                    className="w-full text-white py-3 rounded-xl font-medium hover:opacity-90 transition-all shadow-lg mb-4"
                    style={{ backgroundColor: accentColor }}
                  >
                    Back to Login
                  </button>

                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Didn't receive the email?{' '}
                    <button 
                      onClick={() => { setIsSubmitted(false); setEmail(''); }}
                      className="font-medium hover:opacity-80"
                      style={{ color: accentColor }}
                    >
                      Click to resend
                    </button>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
