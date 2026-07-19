import { useState, useEffect, useCallback, useRef } from 'react';

export function useModalAnimation(isOpen, { delay = 0, onClose }) {
  const [isClosing, setIsClosing] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    timerRef.current = setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, delay);
  }, [onClose, delay]);

  const shouldRender = isOpen || isClosing;

  return { isClosing, handleClose, shouldRender };
}
