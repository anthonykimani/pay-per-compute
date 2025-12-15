'use client';

import { toast as sonnerToast } from 'sonner';
import type { ToastT } from 'sonner';

type ToastVariant = 'default' | 'destructive' | 'success';

interface ToastProps {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

export function useToast() {
  const toast = ({ title, description, variant = 'default', duration = 4000 }: ToastProps) => {
    const options: ToastT = {
      duration,
      id: ''
    };

    switch (variant) {
      case 'destructive':
        return sonnerToast.error(title, { description, ...options });
      case 'success':
        return sonnerToast.success(title, { description, ...options });
      default:
        return sonnerToast(title, { description, ...options });
    }
  };

  return { toast };
}