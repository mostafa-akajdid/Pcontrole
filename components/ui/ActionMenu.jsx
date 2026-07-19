import { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';

export default function ActionMenu({ actions, onAction }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const menuRef = useRef(null);

  const closeWithAnimation = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 200);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        closeWithAnimation();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleActionClick = (action) => {
    if (typeof action.onClick === 'function') {
      action.onClick();
    }
    closeWithAnimation();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          if (isOpen) {
            closeWithAnimation();
          } else {
            setIsOpen(true);
            setIsClosing(false);
          }
        }}
        className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <MoreVertical size={18} />
      </button>

      {(isOpen || isClosing) && (
        <div 
          className={`absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-[100] origin-top-right ${
            isClosing ? 'animate-dropdownSlideOut' : 'animate-dropdownSlideIn'
          }`}
        >
          <div className="py-2">
            {actions.map((action, index) => (
              <div key={index}>
                {action.divider ? (
                  <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActionClick(action);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${
                      action.danger 
                        ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {action.icon && <action.icon size={16} />}
                    <span className="text-sm">{action.label}</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
