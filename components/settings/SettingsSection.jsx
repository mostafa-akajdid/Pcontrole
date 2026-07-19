import { useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function SettingsSection({ title, description, icon: Icon, children, onSave, loading = false }) {
  return (
    <Card padding="none">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Icon size={20} className="text-gray-600 dark:text-gray-400" />
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
            {description && <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>}
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
      {onSave && (
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <Button onClick={onSave} loading={loading} icon={Save}>
            Save Changes
          </Button>
        </div>
      )}
    </Card>
  );
}
