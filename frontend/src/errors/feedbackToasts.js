import { toast } from "react-toastify";
import { i18n } from "../translate/i18n";

const base = {
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

export const toastAutoClose = {
  success: 3500,
  info: 4000,
  warning: 4500,
  error: 5500,
};

/**
 * Toast de sucesso (chave i18n).
 * @param {string} messageKey
 * @param {object} [params] — interpolação i18n (ex.: { count: 3 })
 * @param {object} [toastOptions] — react-toastify (toastId, etc.)
 */
export function showSuccessToast(messageKey, params, toastOptions) {
  const text =
    params != null ? i18n.t(messageKey, params) : i18n.t(messageKey);
  return toast.success(text, {
    ...base,
    autoClose: toastAutoClose.success,
    ...toastOptions,
  });
}

/** Mensagem já literal (evitar se existir chave i18n). */
export function showSuccessPlain(message, toastOptions) {
  return toast.success(message, {
    ...base,
    autoClose: toastAutoClose.success,
    ...toastOptions,
  });
}

export function showInfoToast(messageKey, params, toastOptions) {
  const text =
    params != null ? i18n.t(messageKey, params) : i18n.t(messageKey);
  return toast.info(text, {
    ...base,
    autoClose: toastAutoClose.info,
    ...toastOptions,
  });
}

export function showWarningToast(messageKey, params, toastOptions) {
  const text =
    params != null ? i18n.t(messageKey, params) : i18n.t(messageKey);
  return toast.warning(text, {
    ...base,
    autoClose: toastAutoClose.warning,
    ...toastOptions,
  });
}

export function getErrorToastOptions(overrides = {}) {
  return {
    ...base,
    autoClose: toastAutoClose.error,
    ...overrides,
  };
}
