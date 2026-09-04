const fs = require('fs');
let content = fs.readFileSync('src/pages/WholesaleProgram.tsx', 'utf8');

const earlyReturn = `if (profile?.role === 'wholesale') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <CheckCircle className="w-16 h-16 text-primary mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">আপনি ইতিমধ্যে একজন হোলসেল পার্টনার</h1>
        <p className="text-gray-600 mb-8">আপনার হোলসেল স্ট্যাটাস: <span className="font-bold uppercase">{profile.wholesale_status}</span></p>
        <button onClick={() => navigate('/wholesale')} className="gov-button inline-flex items-center">
          হোলসেল পোর্টালে যান <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    );
  }`;

const newEarlyReturn = `if (profile?.role === 'wholesale') {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <CheckCircle className="w-16 h-16 text-primary mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">আপনি ইতিমধ্যে একজন হোলসেল পার্টনার</h1>
          <p className="text-gray-600 mb-8">আপনার হোলসেল স্ট্যাটাস: <span className="font-bold uppercase">{profile.wholesale_status}</span></p>
          <button onClick={() => navigate('/wholesale')} className="gov-button inline-flex items-center">
            হোলসেল পোর্টালে যান <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="gov-card p-6 border-l-4 border-l-primary">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">হোলসেল সুবিধা</h3>
            <ul className="space-y-4">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-sm p-4 text-sm text-gray-600 flex items-start">
            <ShieldAlert className="w-5 h-5 text-gov-red mr-2 flex-shrink-0" />
            <p className="whitespace-pre-wrap">{conditions}</p>
          </div>
        </div>
      </div>
    );
  }`;

content = content.replace(earlyReturn, newEarlyReturn);
fs.writeFileSync('src/pages/WholesaleProgram.tsx', content);
