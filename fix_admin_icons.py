file_path = 'src/pages/admin/AdminServices.tsx'
with open(file_path, 'r') as f:
    content = f.read()

if 'import { DynamicIcon }' not in content:
    content = content.replace("import { Plus,", "import { DynamicIcon } from '../../components/DynamicIcon';\nimport { Plus,")

old_tag = '<h3 className="text-lg font-bold text-slate-900 mb-2">{service.name}</h3>'
new_tag = '<h3 className="text-lg font-bold text-slate-900 mb-2 flex items-start gap-2">{service.icon && <DynamicIcon name={service.icon} className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}<span>{service.name}</span></h3>'

content = content.replace(old_tag, new_tag)

with open(file_path, 'w') as f:
    f.write(content)
