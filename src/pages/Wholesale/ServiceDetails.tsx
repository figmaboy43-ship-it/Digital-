import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { ArrowLeft, Clock, Shield, CheckCircle, AlertTriangle, FileText, Minus, Plus, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

export function WholesaleServiceDetails() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [customerNote, setCustomerNote] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);
  const [quantity, setQuantity] = useState(1);

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
        navigate('/wholesale/services');
        return;
      }
      setService(serviceData);

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

      const initialData: Record<string, any> = {};
      const requiredFields = (serviceData.required_fields as any[]) || [];
      requiredFields.forEach(field => {
        initialData[field.name] = field.type === 'file' ? null : '';
      });
      setFormData(initialData);

    } catch (error) {
      console.error(error);
      toast.error('Failed to load service details');
      navigate('/wholesale/services');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= 100) {
      setQuantity(newQuantity);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    const requiredFields = (service.required_fields as any[]) || [];
    for (const field of requiredFields) {
      if (field.required && !formData[field.name]) {
        toast.error(`Please provide ${field.label || field.name}`);
        return;
      }
    }

    const price = service.wholesale_price * quantity;

    if (walletBalance < price) {
      toast.error('Insufficient wallet balance. Please deposit funds.');
      return;
    }

    setSubmitting(true);
    try {
      // Include quantity in the payload
      const payloadData = {
        ...formData,
        quantity: quantity
      };

      const orderPayload = {
        p_service_id: service.id,
        p_order_data: payloadData,
        p_use_wallet: true,
        p_customer_note: customerNote || null,
        p_coupon_code: null
      };

      const { data, error } = await supabase.rpc('create_order', orderPayload);

      if (error) {
        throw new Error(error.message);
      }

      if (data && !data.success) {
        throw new Error(data.message);
      }

      toast.success(`Bulk order placed successfully!`);
      navigate('/wholesale/orders');
    } catch (error: any) {
      console.error('Order Error:', error);
      toast.error(error.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-6 max-w-4xl mx-auto"><div className="h-64 bg-white rounded-2xl"></div></div>;
  }

  if (!service) return null;

  const unitPrice = service.wholesale_price;
  const subtotal = service.retail_price * quantity;
  const finalPrice = unitPrice * quantity;
  const totalSavings = subtotal - finalPrice;
  const hasEnoughBalance = walletBalance >= finalPrice;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <Link to="/wholesale/services" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-2">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Services
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {service.thumbnail_url && (
          <div className="h-48 sm:h-64 bg-slate-100 relative">
            <img src={service.thumbnail_url} alt={service.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6 text-white flex justify-between items-end">
              <div>
                <span className="px-3 py-1 bg-emerald-500/90 backdrop-blur-md rounded-full text-xs font-bold mb-3 inline-block shadow-sm">
                  Wholesale Authorized
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold">{service.name}</h1>
              </div>
            </div>
          </div>
        )}

        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            
            {/* Quantity Selector */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Order Quantity</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 font-medium">Number of items</p>
                  <p className="text-sm text-slate-500">Max 100 per bulk order</p>
                </div>
                <div className="flex items-center bg-white border border-slate-300 rounded-lg overflow-hidden shadow-sm">
                  <button 
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="p-3 text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="w-16 text-center font-bold text-slate-900 border-x border-slate-300 py-2">
                    {quantity}
                  </div>
                  <button 
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= 100}
                    className="p-3 text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

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
                  Wholesale Instructions
                </h3>
                <div className="text-amber-800 text-sm whitespace-pre-wrap">
                  {service.instructions}
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Order Details</h3>
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
                        placeholder={field.placeholder || (quantity > 1 ? `Provide details for all ${quantity} items (e.g. list of IDs/Names)` : '')}
                      />
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

                <div className="pt-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    অতিরিক্ত তথ্য / নোট (অপশনাল)
                  </label>
                  <textarea
                    rows={3}
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none"
                    placeholder="অতিরিক্ত কোনো তথ্য, লিংক বা নির্দেশনা থাকলে এখানে লিখুন..."
                  ></textarea>
                </div>

                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={submitting || !hasEnoughBalance}
                    className={`w-full flex items-center justify-center px-6 py-4 border border-transparent rounded-xl shadow-sm text-lg font-bold text-white transition-all
                      ${hasEnoughBalance 
                        ? 'bg-slate-900 hover:bg-slate-800 disabled:opacity-50' 
                        : 'bg-slate-300 cursor-not-allowed'}`}
                  >
                    {submitting ? 'Processing...' : hasEnoughBalance ? 'Confirm Bulk Order' : 'Insufficient Balance'}
                  </button>
                  {!hasEnoughBalance && (
                    <p className="text-center text-red-500 text-sm mt-3 font-medium">
                      You need ৳{(finalPrice - walletBalance).toFixed(2)} more. <Link to="/wholesale/deposit" className="underline hover:text-red-600">Deposit now</Link>
                    </p>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Right Sidebar - Order Summary */}
          <div className="md:col-span-1">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 sticky top-6 text-white shadow-xl">
              <h3 className="text-lg font-bold mb-6 flex items-center">
                <Tag className="w-5 h-5 mr-2 text-emerald-400" />
                Wholesale Summary
              </h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Unit Price</span>
                  <span className="font-medium">৳{unitPrice.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Quantity</span>
                  <span className="font-medium">x {quantity}</span>
                </div>

                <div className="flex justify-between text-sm pt-4 border-t border-slate-700/50">
                  <span className="text-slate-400">Retail Equivalent</span>
                  <span className="font-medium line-through text-slate-500">৳{subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-sm text-emerald-400 font-medium">
                  <span>Your Profit</span>
                  <span>+৳{totalSavings.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700/50 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-base font-bold">Total Payable</span>
                  <span className="text-2xl font-bold text-emerald-400">৳{finalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Wallet Balance</span>
                  <span className={`font-medium ${hasEnoughBalance ? 'text-slate-300' : 'text-red-400'}`}>
                    ৳{walletBalance.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-start text-sm text-slate-300 mb-2">
                  <Clock className="w-4 h-4 mr-2 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Est. {service.processing_time_hours} Hours</span>
                </div>
                <div className="flex items-start text-sm text-slate-300">
                  <Shield className="w-4 h-4 mr-2 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Priority B2B Processing Lane</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
