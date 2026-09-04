const fs = require('fs');

const path = 'src/pages/admin/AdminPaymentMethods.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldSave = `      if (editingId) {
        const { error } = await supabase.from('payment_methods').update(payload).eq('id', editingId);
        if (error) throw error;
        toast.success('Payment method updated');
      } else {
        const { error } = await supabase.from('payment_methods').insert([payload]);
        if (error) throw error;
        toast.success('Payment method added');
      }`;

const newSave = `      let finalPayload = { ...payload };
      let saveError;
      
      if (editingId) {
        const { error } = await supabase.from('payment_methods').update(finalPayload).eq('id', editingId);
        saveError = error;
      } else {
        const { error } = await supabase.from('payment_methods').insert([finalPayload]);
        saveError = error;
      }

      if (saveError && saveError.message.includes('max_amount')) {
        // Fallback for missing columns
        delete finalPayload.min_amount;
        delete finalPayload.max_amount;
        
        toast.error('Limits ignored. Please run SQL migration to add min_amount/max_amount columns.', { duration: 5000 });
        
        if (editingId) {
          const { error: retryError } = await supabase.from('payment_methods').update(finalPayload).eq('id', editingId);
          if (retryError) throw retryError;
        } else {
          const { error: retryError } = await supabase.from('payment_methods').insert([finalPayload]);
          if (retryError) throw retryError;
        }
        toast.success(editingId ? 'Payment method updated (without limits)' : 'Payment method added (without limits)');
      } else if (saveError) {
        throw saveError;
      } else {
        toast.success(editingId ? 'Payment method updated' : 'Payment method added');
      }`;

content = content.replace(oldSave, newSave);
fs.writeFileSync(path, content);
console.log('Patched handleSave');
