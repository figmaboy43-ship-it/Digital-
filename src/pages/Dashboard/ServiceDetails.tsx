import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { ArrowLeft, Clock, Shield, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export function ServiceDetails() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    if (slug) {
      fetchServiceDetails();
    }
  }, [slug]);

  const fetchServiceDetails = async () => {
    try {
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select('*, service_categories(name)')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (serviceError) throw serviceError;
      if (!serviceData) {
        toast.error('Service not found');
        navigate('/dashboard/services');
        return;
      }
      setService(serviceData);

      // Fetch wallet balance
      if (profile) {
        const { data: walletData } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', profile.id)
          .single();
        if (walletData) {
          setWalletBalance(walletData.balance);
        }
      }

      // Initialize form data
      const initialData: Record<string, any> = {};
      const requiredFields = (serviceData.required_fields as any[]) || [];
      requiredFields.forEach(field => {
        initialData[field.name] = field.type === 'file' ? null : '';
      });
      setFormData(initialData);

    } catch (error) {
      console.error(error);
      toast.error('Failed to load service details');
      navigate('/dashboard/services');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    // Validate fields
    const requiredFields = (service.required_fields as any[]) || [];
    for (const field of requiredFields) {
      if (field.required && !formData[field.name]) {
        toast.error(`Please provide ${field.label || field.name}`);
        return;
      }
    }

    const isWholesale = profile.role === 'wholesale' && profile.wholesale_status === 'approved';
    const price = isWholesale ? service.wholesale_price : service.retail_price;

    if (walletBalance < price) {
      toast.error('Insufficient wallet balance. Please deposit funds.');
      return;
    }

    setSubmitting(true);
    try {
      // Note: Real world would handle file uploads to Supabase storage here and replace with URLs
      
      const orderPayload = {
        p_service_id: service.id,
        p_order_data: formData,
        p_coupon_code: null
      };

      const { data, error } = await supabase.rpc('create_order', orderPayload);

      if (error) {
        throw new Error(error.message);
      }

      if (data && !data.success) {
        throw new Error(data.message);
      }

      toast.success('Order placed successfully!');
      navigate('/dashboard/orders');
    } catch (error: any) {
      console.error('Order Error:', error);
      toast.error(error.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-6 max-w-4xl mx-auto">
      <div className="h-10 bg-slate-200 rounded w-1/4"></div>
      <div className="h-64 bg-slate-200 rounded-2xl"></div>
    </div>;
  }

  if (!service) return null;

  const isWholesale = profile?.role === 'wholesale' && profile?.wholesale_status === 'approved';
  const finalPrice = isWholesale ? service.wholesale_price : service.retail_price;
  const hasEnoughBalance = walletBalance >= finalPrice;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <Link to="/dashboard/services" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-2">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Services
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {service.thumbnail_url && (
          <div className="h-48 sm:h-64 bg-slate-100 relative">
            <img src={service.thumbnail_url} alt={service.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-medium mb-3 inline-block border border-white/20">
                {service.service_categories?.name}
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold">{service.name}</h1>
            </div>
          </div>
        )}
        
        {!service.thumbnail_url && (
          <div className="p-6 sm:p-8 bg-slate-900 text-white rounded-t-2xl">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-medium mb-3 inline-block border border-white/20">
              {service.service_categories?.name}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold">{service.name}</h1>
          </div>
        )}

        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-slate-400" />
                Service Description
              </h3>
              <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
                {service.description}
              </p>
            </div>
            
            {service.instructions && (
              <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
                <h3 className="text-sm font-bold text-amber-900 mb-2 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1.5" />
                  Important Instructions
                </h3>
                <div className="text-amber-800 text-sm whitespace-pre-wrap">
                  {service.instructions}
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Required Information</h3>
              <form onSubmit={handleSubmit} className="space-y-5">
                {(service.required_fields as any[])?.map((field, index) => (
                  <div key={index}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {field.label || field.name} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        required={field.required}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-y min-h-[100px]"
                        placeholder={field.placeholder || ''}
                      />
                    ) : field.type === 'file' ? (
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="space-y-1 text-center">
                          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <div className="flex text-sm text-gray-600 justify-center">
                            <label className="relative cursor-pointer bg-white rounded-md font-medium text-emerald-600 hover:text-emerald-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-emerald-500 px-2 py-1">
                              <span>Upload a file</span>
                              <input 
                                type="file" 
                                className="sr-only" 
                                required={field.required}
                                onChange={(e) => {
                                  // Simplified file handling for this scope
                                  if(e.target.files && e.target.files[0]) {
                                    handleInputChange(field.name, e.target.files[0].name);
                                    toast.success('File attached');
                                  }
                                }}
                              />
                            </label>
                          </div>
                          <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                        </div>
                      </div>
                    ) : (
                      <input
                        type={field.type || 'text'}
                        required={field.required}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                        placeholder={field.placeholder || ''}
                      />
                    )}
                  </div>
                ))}

                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={submitting || !hasEnoughBalance}
                    className={`w-full flex items-center justify-center px-6 py-3.5 border border-transparent rounded-xl shadow-sm text-base font-bold text-white transition-all
                      ${hasEnoughBalance 
                        ? 'bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50' 
                        : 'bg-slate-300 cursor-not-allowed'}`}
                  >
                    {submitting ? 'Processing Order...' : hasEnoughBalance ? 'Confirm & Pay' : 'Insufficient Balance'}
                  </button>
                  {!hasEnoughBalance && (
                    <p className="text-center text-red-500 text-sm mt-3 font-medium">
                      You need ৳{(finalPrice - walletBalance).toFixed(2)} more. <Link to="/dashboard/deposit" className="underline hover:text-red-600">Deposit now</Link>
                    </p>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Right Sidebar - Order Summary */}
          <div className="md:col-span-1">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 sticky top-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Order Summary</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Processing Time</span>
                  <span className="font-medium text-slate-900 flex items-center">
                    <Clock className="w-4 h-4 mr-1 text-slate-400" />
                    {service.processing_time_hours} Hours
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Retail Price</span>
                  <span className={`font-medium ${isWholesale ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                    ৳{service.retail_price.toFixed(2)}
                  </span>
                </div>

                {isWholesale && (
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-600 font-medium">Wholesale Price</span>
                    <span className="font-bold text-purple-700">৳{service.wholesale_price.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 mb-6">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-base font-bold text-slate-900">Total Payable</span>
                  <span className="text-2xl font-bold text-emerald-600">৳{finalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Your Wallet</span>
                  <span className={`font-medium ${hasEnoughBalance ? 'text-slate-700' : 'text-red-500'}`}>
                    ৳{walletBalance.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start text-sm text-slate-600">
                  <Shield className="w-4 h-4 mr-2 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Secure automated checkout directly from your wallet balance.</span>
                </div>
                <div className="flex items-start text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 mr-2 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Instant order confirmation and status tracking.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
