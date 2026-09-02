import React from 'react';
import { LifeBuoy, Mail, MessageSquare } from 'lucide-react';

export function WholesaleSupport() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Partner Support</h1>
        <p className="text-slate-500 mt-1">Get priority assistance for your wholesale account</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Dedicated B2B Chat</h3>
          <p className="text-slate-500 text-sm mb-6">Chat directly with your account manager during business hours.</p>
          <button className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors">
            Start Conversation
          </button>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Email Support</h3>
          <p className="text-slate-500 text-sm mb-6">Create a detailed ticket. Wholesale partners get guaranteed &lt; 2hr response time.</p>
          <button className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-colors">
            Open Support Ticket
          </button>
        </div>
      </div>
    </div>
  );
}
