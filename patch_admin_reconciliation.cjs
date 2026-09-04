const fs = require('fs');

let content = fs.readFileSync('src/pages/admin/AdminReconciliation.tsx', 'utf8');

const oldFetch = `  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_events')
        .select(\`
          id, event_type, provider_reference, processed, created_at, provider,
          payment:payment_id (
            amount, transaction_reference, status
          )
        \`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      toast.error('Failed to load reconciliation data');
    } finally {
      setLoading(false);
    }
  };`;

const newFetch = `  const fetchPayments = async () => {
    try {
      const { data: events, error } = await supabase
        .from('payment_events')
        .select('id, event_type, provider_reference, processed, created_at, provider, payment_id')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const paymentsData = events || [];
      
      // Fetch associated payments manually since foreign key might not be exposed to PostgREST
      if (paymentsData.length > 0) {
        const paymentIds = paymentsData.map(e => e.payment_id).filter(Boolean);
        if (paymentIds.length > 0) {
          const { data: pData } = await supabase
            .from('payments')
            .select('id, amount, transaction_reference, status')
            .in('id', paymentIds);
            
          if (pData) {
            paymentsData.forEach(event => {
              if (event.payment_id) {
                event.payment = pData.find(p => p.id === event.payment_id);
              }
            });
          }
        }
      }
      
      setPayments(paymentsData);
    } catch (error) {
      toast.error('Failed to load reconciliation data');
    } finally {
      setLoading(false);
    }
  };`;

content = content.replace(oldFetch, newFetch);
fs.writeFileSync('src/pages/admin/AdminReconciliation.tsx', content);
