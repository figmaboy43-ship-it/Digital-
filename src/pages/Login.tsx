import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export function Login() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { checkAuth } = useAuthStore();
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;
      
      await checkAuth();
      navigate('/dashboard');
    } catch (err: any) {
      setError('ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-md w-full gov-card p-8 border-t-4 border-t-primary">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="https://upload.wikimedia.org/wikipedia/commons/8/84/Government_Seal_of_Bangladesh.svg" alt="BD Gov Logo" className="w-16 h-16 opacity-90" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">লগইন করুন</h2>
          <p className="mt-2 text-sm text-gray-600">
            আপনার অ্যাকাউন্টে প্রবেশ করতে ইমেইল ও পাসওয়ার্ড দিন
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-gov-red text-gov-red px-4 py-3 rounded-sm flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-sm font-medium text-gray-700">ইমেইল ঠিকানা <span className="text-gov-red">*</span></label>
            <div className="mt-1">
              <input
                {...register('email', { required: 'ইমেইল আবশ্যক' })}
                type="email"
                className="gov-input"
              />
              {errors.email && <p className="mt-1 text-sm text-gov-red">{errors.email.message as string}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">পাসওয়ার্ড <span className="text-gov-red">*</span></label>
            <div className="mt-1">
              <input
                {...register('password', { required: 'পাসওয়ার্ড আবশ্যক' })}
                type="password"
                className="gov-input"
              />
              {errors.password && <p className="mt-1 text-sm text-gov-red">{errors.password.message as string}</p>}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded-sm"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                মনে রাখুন
              </label>
            </div>
            <div className="text-sm">
              <a href="#" className="font-medium text-primary hover:text-primary-dark">
                পাসওয়ার্ড ভুলে গেছেন?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full gov-button flex justify-center py-2.5"
            >
              {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'লগইন করুন'}
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-600 border-t border-gray-100 pt-4">
          অ্যাকাউন্ট নেই?{' '}
          <Link to="/register" className="font-medium text-primary hover:text-primary-dark">
            নতুন নিবন্ধন করুন
          </Link>
        </div>
        
        <div className="mt-6 flex items-start text-xs text-gray-500 bg-gray-50 p-3 rounded-sm border border-gray-200">
          <ShieldAlert className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400 mt-0.5" />
          <p>সতর্কতা: এটি একটি সুরক্ষিত সিস্টেম। অননুমোদিত অ্যাক্সেস আইনত দণ্ডনীয় অপরাধ।</p>
        </div>
      </div>
    </div>
  );
}
