import React from 'react';
import * as Icons from 'lucide-react';

interface DynamicIconProps extends Icons.LucideProps {
  name: string;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, ...props }) => {
  const Icon = (Icons as any)[name];
  
  if (!Icon) {
    // Return a default icon if not found
    const DefaultIcon = Icons.HelpCircle;
    return <DefaultIcon {...props} />;
  }

  return <Icon {...props} />;
};
