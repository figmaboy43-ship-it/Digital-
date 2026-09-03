sed -i 's/service:service_id (name, processing_time_hours)/service:services!service_id (name, processing_time)/g' src/pages/admin/AdminOrderDetails.tsx
sed -i 's/user:user_id (full_name/user:profiles!user_id (full_name/g' src/pages/admin/AdminOrderDetails.tsx

sed -i 's/service:service_id (name, processing_time_hours)/service:services!service_id (name, processing_time)/g' src/pages/Dashboard/OrderDetails.tsx

sed -i 's/service.processing_time_hours/service.processing_time/g' src/pages/Dashboard/ServicesList.tsx
sed -i 's/service.processing_time_hours} Hours/service.processing_time}/g' src/pages/Dashboard/ServiceDetails.tsx
sed -i 's/Est. {service.processing_time_hours} Hours/Est. {service.processing_time}/g' src/pages/Wholesale/ServiceDetails.tsx
