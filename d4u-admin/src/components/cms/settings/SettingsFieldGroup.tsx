import type { ReactNode } from 'react';

interface SettingsFieldGroupProps {
  children: ReactNode;
  columns?: 1 | 2;
}

export default function SettingsFieldGroup({ children, columns = 2 }: SettingsFieldGroupProps) {
  return (
    <div className={`grid grid-cols-1 ${columns === 2 ? 'md:grid-cols-2' : ''} gap-6`}>
      {children}
    </div>
  );
}
