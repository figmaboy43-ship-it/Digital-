# 1. Add states
sed -i '/const \[showRefundModal, setShowRefundModal\] = useState(false);/a \
  const [showCompleteModal, setShowCompleteModal] = useState(false);\
  const [deliveryNote, setDeliveryNote] = useState('\'''\'');\
  const [deliveryFile, setDeliveryFile] = useState<File | null>(null);\
  const [uploadingFile, setUploadingFile] = useState(false);\
' src/pages/admin/AdminOrderDetails.tsx

# 2. Add completeOrder function right after processRefund
sed -i '/const processRefund = async () => {/i \
  const completeOrder = async () => {\
    if (!order) return;\
    setStatusLoading(true);\
    setUploadingFile(true);\
    try {\
      let finalMessage = "Order completed successfully.";\
      if (deliveryNote) {\
         finalMessage += ` Note: ${deliveryNote}`;\
      }\
      if (deliveryFile) {\
        const fileExt = deliveryFile.name.split(".").pop();\
        const fileName = `${order.id}-${Math.random()}.${fileExt}`;\
        const { error: uploadError, data: uploadData } = await supabase.storage.from("service-images").upload(`deliveries/${fileName}`, deliveryFile);\
        if (uploadError) throw uploadError;\
        const { data: { publicUrl } } = supabase.storage.from("service-images").getPublicUrl(`deliveries/${fileName}`);\
        finalMessage += `\\n\\nDelivery File: ${publicUrl}`;\
      }\
      const { data, error } = await supabase.rpc("admin_update_order_status", {\
        p_order_id: order.id,\
        p_new_status: "completed",\
        p_message: finalMessage,\
        p_admin_note: adminNote\
      });\
      if (error) throw error;\
      toast.success("Order completed");\
      setShowCompleteModal(false);\
      fetchOrder();\
    } catch (error: any) {\
      toast.error(error.message || "Failed to complete order");\
    } finally {\
      setStatusLoading(false);\
      setUploadingFile(false);\
    }\
  };\
' src/pages/admin/AdminOrderDetails.tsx

# 3. Modify Complete Order button to open modal
sed -i 's/onClick={() => updateStatus('\''completed'\'')}/onClick={() => setShowCompleteModal(true)}/g' src/pages/admin/AdminOrderDetails.tsx

# 4. Add the Complete Modal before the final div
sed -i '/{showRefundModal && (/i \
      {/* Complete Order Modal */}\
      {showCompleteModal && (\
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">\
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">\
            <h2 className="text-xl font-bold text-slate-900 mb-2">Complete Order</h2>\
            <p className="text-slate-500 text-sm mb-6">Upload the completed work file or provide a delivery note to the customer.</p>\
            <div className="space-y-4 mb-6">\
              <div>\
                <label className="block text-sm font-medium text-slate-700 mb-1">Upload Work File (Optional)</label>\
                <input type="file" onChange={(e) => setDeliveryFile(e.target.files?.[0] || null)} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />\
              </div>\
              <div>\
                <label className="block text-sm font-medium text-slate-700 mb-1">Delivery Note / Link (Optional)</label>\
                <textarea value={deliveryNote} onChange={(e) => setDeliveryNote(e.target.value)} placeholder="Type a message or paste a Google Drive link here..." className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 min-h-[100px] outline-none" />\
              </div>\
            </div>\
            <div className="flex justify-end gap-3">\
              <button onClick={() => setShowCompleteModal(false)} disabled={statusLoading || uploadingFile} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">\
                Cancel\
              </button>\
              <button onClick={completeOrder} disabled={statusLoading || uploadingFile} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors flex items-center">\
                {uploadingFile ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}\
                Submit Work\
              </button>\
            </div>\
          </div>\
        </div>\
      )}\
' src/pages/admin/AdminOrderDetails.tsx
