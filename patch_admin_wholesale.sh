sed -i 's/export default function AdminWholesale() {/import AdminWholesaleSettings from ".\/AdminWholesaleSettings";\n\nexport default function AdminWholesale() {\n  const [activeTab, setActiveTab] = useState<"applications" | "settings">("applications");/' src/pages/admin/AdminWholesale.tsx

# Need to replace the start of the return statement
# I will use sed to replace 'return (' with the tab layout and then add the closing logic
