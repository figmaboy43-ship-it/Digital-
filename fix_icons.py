import re

files_to_update = [
    'src/pages/Dashboard/ServicesList.tsx',
    'src/pages/Wholesale/Services.tsx'
]

for file_path in files_to_update:
    try:
        with open(file_path, 'r') as f:
            content = f.read()
            
        if 'import { DynamicIcon }' not in content:
            content = content.replace("import { Clock", "import { DynamicIcon } from '../../components/DynamicIcon';\nimport { Clock")
            
        old_tag = '<h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight">{service.name}</h3>'
        new_tag = '<h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight flex items-start gap-2">{service.icon && <DynamicIcon name={service.icon} className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}<span>{service.name}</span></h3>'
        
        content = content.replace(old_tag, new_tag)
        
        with open(file_path, 'w') as f:
            f.write(content)
            
        print(f"Updated {file_path}")
    except Exception as e:
        print(f"Failed to update {file_path}: {str(e)}")

