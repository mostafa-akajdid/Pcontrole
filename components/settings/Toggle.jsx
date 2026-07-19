import { useAppearance } from '@/contexts/AppearanceContext';

export default function Toggle({ label, description, checked, onChange, disabled = false }) {
  const { accentColor } = useAppearance();

  return (
    <label className={`flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50'} transition-colors`}>
      <div className="flex-1 mr-4">
        <p className="font-medium text-gray-800 dark:text-gray-200">{label}</p>
        {description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{ backgroundColor: checked ? accentColor : '#d1d5db' }}
      >
        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </label>
  );
}
