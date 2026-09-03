sed -i 's/processing_time: '\'''\''/processing_time: '\'''\'', icon: '\'''\''/g' src/pages/admin/AdminServices.tsx
sed -i 's/processing_time: srvForm.processing_time/processing_time: srvForm.processing_time, icon: srvForm.icon/g' src/pages/admin/AdminServices.tsx
sed -i 's/processing_time: srv.processing_time || '\'''\''/processing_time: srv.processing_time || '\'''\'', icon: srv.icon || '\'''\''/g' src/pages/admin/AdminServices.tsx
