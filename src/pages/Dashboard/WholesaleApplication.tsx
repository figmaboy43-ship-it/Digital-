import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Building2, Upload, FileText, CheckCircle, ArrowRight, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export function WholesaleApplication() {
  const { user, profile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    tradeLicense: '',
    businessType: 'agency',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // In a complete app, you'd insert this into a separate 'wholesale_applications' table,
      // upload files, and then update the profile status. For this demo, we update the profile directly.
      const { error } = await supabase
        .from('profiles')
        .update({
          wholesale_status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      
      // Update local state by forcing a refresh or optimistically
      window.location.reload(); 
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  if (profile?.wholesale_status === 'pending' || profile?.wholesale_status === 'under_review') {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
            <Clock className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Application Under Review</h2>
          <p className="text-slate-500 max-w-md mx-auto mb-8">
            Your application for the Wholesale Program has been received and is currently being reviewed by our team. We'll notify you once a decision is made.
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 w-full max-w-sm">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Status</span>
              <span className="font-bold text-amber-600 capitalize">{profile.wholesale_status.replace('_', ' ')}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (profile?.wholesale_status === 'approved') {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">You're a Wholesale Partner!</h2>
          <p className="text-slate-500 max-w-md mx-auto mb-8">
            Your account is fully active in the Wholesale Program. You are now receiving exclusive B2B pricing on all services.
          </p>
          <Link 
            to="/wholesale"
            className="inline-flex items-center justify-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
          >
            Go to Wholesale Dashboard
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Wholesale Partner Program</h1>
        <p className="text-slate-500 mt-2">Unlock exclusive B2B pricing, priority support, and dedicated processing lines for your business.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-5">
          
          <div className="md:col-span-2 bg-slate-900 p-8 text-white flex flex-col relative overflow-hidden">
            <div className="relative z-10 space-y-8">
              <div>
                <h3 className="text-xl font-bold mb-2">Program Benefits</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Join hundreds of agencies and resellers boosting their margins with our dedicated wholesale tier.</p>
              </div>
              
              <ul className="space-y-5">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 shrink-0" />
                  <span className="text-sm font-medium text-slate-200">Up to 40% discount on retail prices</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 shrink-0" />
                  <span className="text-sm font-medium text-slate-200">Priority application processing</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 shrink-0" />
                  <span className="text-sm font-medium text-slate-200">Dedicated account manager</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 shrink-0" />
                  <span className="text-sm font-medium text-slate-200">API access (Coming soon)</span>
                </li>
              </ul>
            </div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none transform translate-x-1/3 translate-y-1/3"></div>
          </div>
          
          <div className="md:col-span-3 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Application Form</h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Business Name *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      placeholder="Your Company or Shop Name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Business Type</label>
                    <select
                      value={formData.businessType}
                      onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    >
                      <option value="agency">Travel/Visa Agency</option>
                      <option value="computer_shop">Computer/Print Shop</option>
                      <option value="freelancer">Independent Reseller</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Trade License No.</label>
                    <input
                      type="text"
                      value={formData.tradeLicense}
                      onChange={(e) => setFormData({ ...formData, tradeLicense: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Brief Description *</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none"
                    placeholder="Tell us a bit about your daily order volume and the types of services you need."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Upload Documents (Optional)</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-10 w-10 text-slate-400" />
                      <div className="flex text-sm justify-center text-slate-600">
                        <span className="relative rounded-md font-medium text-emerald-600 hover:text-emerald-500">
                          Upload Trade License or NID
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">PNG, JPG, PDF up to 5MB</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center px-6 py-3.5 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-70"
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                  {!loading && <ArrowRight className="w-5 h-5 ml-2" />}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// Ensure Clock icon is imported
