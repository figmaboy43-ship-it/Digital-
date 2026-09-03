# Add import
sed -i 's/import { Clock/import { DynamicIcon } from '\''..\/..\/components\/DynamicIcon'\'';\nimport { Clock/g' src/pages/Dashboard/ServicesList.tsx

# Replace name rendering
sed -i 's/<h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight">{service.name}<\/h3>/<h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight flex items-start gap-2"> {service.icon \&\& <DynamicIcon name={service.icon} className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />} <span>{service.name}<\/span><\/h3>/g' src/pages/Dashboard/ServicesList.tsx
