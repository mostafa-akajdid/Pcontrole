import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useModalAnimation } from '@/hooks/useModalAnimation';

export default function ConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger', // 'danger' or 'warning' or 'info'
  loading = false
}) {
  const { isClosing, handleClose, shouldRender } = useModalAnimation(isOpen, { delay: 300, onClose });

  if (!shouldRender) return null;

  const typeStyles = {
    danger: {
      icon: 'bg-red-100 text-red-600',
      button: 'bg-red-600 hover:bg-red-700'
    },
    warning: {
      icon: 'bg-orange-100 text-orange-600',
      button: 'bg-orange-600 hover:bg-orange-700'
    },
    info: {
      icon: 'bg-blue-100 text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700'
    }
  };

  const style = typeStyles[type] || typeStyles.danger;

  const handleConfirm = async () => {
    try {
      await onConfirm();
      handleClose();
    } catch {
      // dialog stays open; caller handles error display
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleClose}
      ></div>

      {/* Dialog */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
        <div 
          className={`bg-white rounded-2xl max-w-md w-full pointer-events-auto transform transition-all duration-300 ease-out ${
            isClosing ? 'scale-95 opacity-0 translate-y-4' : 'scale-100 opacity-100 translate-y-0'
          }`}
        >
          <div className="p-6 text-center">
            {/* Icon */}
            <div className={`w-12 h-12 rounded-full ${style.icon} flex items-center justify-center mb-4 mx-auto`}>
              <AlertTriangle size={24} />
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>

            {/* Message */}
            <p className="text-gray-600 mb-6">{message}</p>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleConfirm}
                disabled={loading}
                className={`flex-1 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${style.button}`}
              >
                {loading ? 'Please wait...' : confirmText}
              </button>
              <button
                onClick={handleClose}
                disabled={loading}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
