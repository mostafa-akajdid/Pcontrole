import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { useAppearance } from '@/contexts/AppearanceContext';
import { useAuth } from '@/contexts/AuthContext';

export default function Register() {
  const router = useRouter();
  const { accentColor } = useAppearance();
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const result = await register(formData.name, formData.email, formData.password, formData.confirmPassword);
      if (!result.success) {
        setError(result.message);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFocus = (e) => {
    e.currentTarget.style.boxShadow = `0 0 0 2px ${accentColor}`;
  };

  const handleBlur = (e) => {
    e.currentTarget.style.boxShadow = '';
  };

  return (
    <>
      <Head>
        <title>Sign Up - PIOLEC CMS</title>
        <meta name="description" content="Créez votre compte PIOLEC" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        {/* Left Side - Image/Illustration */}
        <div 
          className="hidden lg:flex lg:flex-1 items-center justify-center p-12 relative overflow-hidden"
          style={{ 
            background: `linear-gradient(to bottom right, ${accentColor}dd, ${accentColor}, ${accentColor}cc)`
          }}
        >
          <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          <div className="relative z-10 text-white max-w-md">
            <h2 className="text-4xl font-bold mb-4">Start your journey with us</h2>
            <p className="text-green-100 text-lg mb-8">
              Rejoignez les équipes qui utilisent PIOLEC pour optimiser leur flux de travail.
            </p>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex -space-x-2">
                  <img 
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces" 
                    alt="User 1" 
                    className="w-10 h-10 rounded-full border-2 border-white object-cover"
                  />
                  <img 
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces" 
                    alt="User 2" 
                    className="w-10 h-10 rounded-full border-2 border-white object-cover"
                  />
                  <img 
                    src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=faces" 
                    alt="User 3" 
                    className="w-10 h-10 rounded-full border-2 border-white object-cover"
                  />
                </div>
                <div>
                  <div className="flex text-yellow-300">
                    {'★'.repeat(5)}
                  </div>
                </div>
              </div>
              <p className="text-sm text-green-50">
                "PIOLEC a transformé la façon dont notre équipe travaille. Hautement recommandé!"
              </p>
              <p className="text-xs text-green-200 mt-2">- Sarah Johnson, Product Manager</p>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full border-4 flex items-center justify-center" style={{ borderColor: accentColor }}>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: accentColor }}></div>
              </div>
              <span className="text-2xl font-bold text-gray-800 dark:text-white">PIOLEC CMS</span>
            </div>

            {/* Title */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Create an account</h1>
              <p className="text-gray-500 dark:text-gray-400">Get started with your free account</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your full name"
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter your email"
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Create a password"
                    className="w-full pl-12 pr-12 py-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirm your password"
                    className="w-full pl-12 pr-12 py-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Terms */}
              <label className="flex items-start gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 mt-0.5 rounded border-gray-300 dark:border-gray-600 focus:ring-2"
                  style={{ accentColor: accentColor }}
                  required 
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  I agree to the{' '}
                  <span className="font-medium hover:opacity-80" style={{ color: accentColor }}>
                    Terms of Service
                  </span>
                  {' '}and{' '}
                  <span className="font-medium hover:opacity-80" style={{ color: accentColor }}>
                    Privacy Policy
                  </span>
                </span>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full text-white py-3 rounded-xl font-medium hover:opacity-90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: accentColor }}
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">Or sign up with</span>
                </div>
              </div>

              {/* Social Login */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Google</span>
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Facebook</span>
                </button>
              </div>
            </form>

            {/* Sign In Link */}
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
              Already have an account?{' '}
              <Link href="/" className="font-medium hover:opacity-80" style={{ color: accentColor }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
