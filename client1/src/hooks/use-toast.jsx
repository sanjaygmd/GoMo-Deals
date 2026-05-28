import { useToast as useToastFromContext } from "../context/ToastContext";

/**
 * Re-exports useToast from ToastContext for backward compatibility.
 */
export const useToast = () => {
  return useToastFromContext();
};
