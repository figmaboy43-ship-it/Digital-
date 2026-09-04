const fs = require('fs');
let content = fs.readFileSync('src/pages/WholesaleProgram.tsx', 'utf8');

if (!content.includes('supabase.channel')) {
  const useEffectBlock = `  useEffect(() => {
    fetchSettings();
  }, []);`;
  
  const newUseEffectBlock = `  useEffect(() => {
    fetchSettings();

    const channel = supabase
      .channel('site_settings_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_settings', filter: "key=eq.wholesale_content" },
        (payload) => {
          let val = payload.new.value;
          if (typeof val === 'string') {
            try { val = JSON.parse(val); } catch (e) {}
          }
          if (val && val.benefits) setBenefits(val.benefits);
          if (val && val.conditions) setConditions(val.conditions);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);`;
  
  content = content.replace(useEffectBlock, newUseEffectBlock);
  fs.writeFileSync('src/pages/WholesaleProgram.tsx', content);
}
