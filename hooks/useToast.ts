import { useState, useCallback } from "react";

type ToastType = "success" | "error" | "info";

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: "",
    type: "info",
  });

  const show = useCallback((message: string, type: ToastType = "info") => {
    setToast({ visible: true, message, type });
  }, []);

  const hide = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const success = useCallback((message: string) => show(message, "success"), [show]);
  const error = useCallback((message: string) => show(message, "error"), [show]);
  const info = useCallback((message: string) => show(message, "info"), [show]);

  return {
    toast,
    show,
    hide,
    success,
    error,
    info,
  };
}
