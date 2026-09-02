import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function Register() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('password');

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            mobile: data.mobile,
          }
        }
      });

      if (authError) throw authError;
      
      navigate('/login', { state: { message: 'নিবন্ধন সফল হয়েছে! অনুগ্রহ করে লগইন করুন।' } });
    } catch (err: any) {
      setError(err.message || 'নিবন্ধনে ত্রুটি হয়েছে');
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
          <h2 className="text-2xl font-bold text-gray-900">নতুন নিবন্ধন</h2>
          <p className="mt-2 text-sm text-gray-600">
            সেবা গ্রহণের জন্য একটি নতুন অ্যাকাউন্ট তৈরি করুন
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-gov-red text-gov-red px-4 py-3 rounded-sm flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-sm font-medium text-gray-700">সম্পূর্ণ নাম <span className="text-gov-red">*</span></label>
            <div className="mt-1">
              <input
                {...register('full_name', { required: 'নাম আবশ্যক' })}
                type="text"
                className="gov-input"
              />
              {errors.full_name && <p className="mt-1 text-sm text-gov-red">{errors.full_name.message as string}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">মোবাইল নম্বর <span className="text-gov-red">*</span></label>
            <div className="mt-1">
              <input
                {...register('mobile', { required: 'মোবাইল নম্বর আবশ্যক' })}
                type="tel"
                className="gov-input"
              />
              {errors.mobile && <p className="mt-1 text-sm text-gov-red">{errors.mobile.message as string}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">ইমেইল ঠিকানা <span className="text-gov-red">*</span></label>
            <div className="mt-1">
              <input
                {...register('email', { 
                  required: 'ইমেইল আবশ্যক',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "সঠিক ইমেইল প্রদান করুন"
                  }
                })}
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
                {...register('password', { 
                  required: 'পাসওয়ার্ড আবশ্যক',
                  minLength: { value: 6, message: 'অন্তত ৬ অক্ষরের হতে হবে' }
                })}
                type="password"
                className="gov-input"
              />
              {errors.password && <p className="mt-1 text-sm text-gov-red">{errors.password.message as string}</p>}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">পাসওয়ার্ড নিশ্চিত করুন <span className="text-gov-red">*</span></label>
            <div className="mt-1">
              <input
                {...register('confirmPassword', { 
                  required: 'পাসওয়ার্ড নিশ্চিত করা আবশ্যক',
                  validate: value => value === password || 'পাসওয়ার্ড মেলেনি'
                })}
                type="password"
                className="gov-input"
              />
              {errors.confirmPassword && <p className="mt-1 text-sm text-gov-red">{errors.confirmPassword.message as string}</p>}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full gov-button flex justify-center py-2.5"
            >
              {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'নিবন্ধন করুন'}
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-600 border-t border-gray-100 pt-4">
          আগে থেকে অ্যাকাউন্ট আছে?{' '}
          <Link to="/login" className="font-medium text-primary hover:text-primary-dark">
            লগইন করুন
          </Link>
        </div>
        
        <div className="mt-6 flex items-start text-xs text-gray-500 bg-gray-50 p-3 rounded-sm border border-gray-200">
          <ShieldAlert className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400 mt-0.5" />
          <p>সতর্কতা: আপনার প্রদত্ত তথ্য সঠিক হতে হবে। ভুল তথ্যের জন্য আইনি ব্যবস্থা গ্রহণ করা হতে পারে।</p>
        </div>
      </div>
    </div>
  );
}
