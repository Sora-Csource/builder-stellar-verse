import React, { useState, useEffect, useRef } from "react";

// Enhanced Alert Modal
interface AlertModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: "success" | "error" | "warning" | "info";
  onClose: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  title,
  message,
  type = "info",
  onClose,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      buttonRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Enter") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "success":
        return (
          <svg
            className="w-6 h-6 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case "error":
        return (
          <svg
            className="w-6 h-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      case "warning":
        return (
          <svg
            className="w-6 h-6 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-6 h-6 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  const getColors = () => {
    switch (type) {
      case "success":
        return "border-green-500 bg-green-50 text-green-800";
      case "error":
        return "border-red-500 bg-red-50 text-red-800";
      case "warning":
        return "border-yellow-500 bg-yellow-50 text-yellow-800";
      default:
        return "border-blue-500 bg-blue-50 text-blue-800";
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 animate-fadeIn"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="alert-title"
      aria-describedby="alert-message"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all animate-scaleIn mobile-modal portrait-modal landscape-modal small-portrait-modal">
        <div className={`p-4 sm:p-6 rounded-t-xl border-l-4 ${getColors()} landscape-compact portrait-compact`}>
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">{getIcon()}</div>
            <div className="flex-1 min-w-0">
              <h3 id="alert-title" className="text-lg font-bold truncate">
                {title}
              </h3>
              <p id="alert-message" className="text-sm mt-1 break-words">
                {message}
              </p>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl">
          <button
            ref={buttonRef}
            onClick={onClose}
            className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              type === "success"
                ? "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500"
                : type === "error"
                  ? "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500"
                  : type === "warning"
                    ? "bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500"
                    : "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500"
            }`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Confirm Modal
interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: "danger" | "warning" | "info";
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  type = "info",
  confirmText = "Ya",
  cancelText = "Tidak",
  onConfirm,
  onCancel,
}) => {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && cancelButtonRef.current) {
      cancelButtonRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      } else if (event.key === "Enter") {
        onConfirm();
      } else if (event.key === "Tab") {
        event.preventDefault();
        if (document.activeElement === cancelButtonRef.current) {
          confirmButtonRef.current?.focus();
        } else {
          cancelButtonRef.current?.focus();
        }
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onCancel, onConfirm]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "danger":
        return (
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        );
      case "warning":
        return (
          <svg
            className="w-8 h-8 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-8 h-8 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  const getConfirmButtonColors = () => {
    switch (type) {
      case "danger":
        return "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500";
      case "warning":
        return "bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500";
      default:
        return "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500";
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 animate-fadeIn"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all animate-scaleIn mobile-modal portrait-modal landscape-modal small-portrait-modal">
        <div className="p-4 sm:p-6 landscape-compact portrait-compact">
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex-shrink-0">{getIcon()}</div>
            <div className="flex-1 min-w-0">
              <h3
                id="confirm-title"
                className="text-xl font-bold text-gray-900 truncate"
              >
                {title}
              </h3>
            </div>
          </div>
          <p id="confirm-message" className="text-gray-600 mb-6 break-words">
            {message}
          </p>
          <div className="flex space-x-3">
            <button
              ref={cancelButtonRef}
              onClick={onCancel}
              className="flex-1 py-2 px-4 rounded-lg font-semibold bg-gray-200 hover:bg-gray-300 text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              {cancelText}
            </button>
            <button
              ref={confirmButtonRef}
              onClick={onConfirm}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${getConfirmButtonColors()}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Prompt Modal
interface PromptModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  defaultValue?: string;
  placeholder?: string;
  inputType?: "text" | "number" | "email" | "tel";
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export const PromptModal: React.FC<PromptModalProps> = ({
  isOpen,
  title,
  message,
  defaultValue = "",
  placeholder = "",
  inputType = "text",
  onConfirm,
  onCancel,
}) => {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue, isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(value);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 animate-fadeIn"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="prompt-title"
      aria-describedby="prompt-message"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all animate-scaleIn mobile-modal portrait-modal landscape-modal small-portrait-modal">
        <form onSubmit={handleSubmit}>
          <div className="p-4 sm:p-6 landscape-compact portrait-compact">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  id="prompt-title"
                  className="text-xl font-bold text-gray-900 truncate"
                >
                  {title}
                </h3>
              </div>
            </div>
            <p id="prompt-message" className="text-gray-600 mb-4 break-words">
              {message}
            </p>
            <input
              ref={inputRef}
              type={inputType}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              aria-label={placeholder || "Masukkan nilai"}
            />
          </div>
          <div className="px-6 py-4 bg-gray-50 rounded-b-xl">
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-2 px-4 rounded-lg font-semibold bg-gray-200 hover:bg-gray-300 text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2 px-4 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                OK
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// Success Animation Modal
interface SuccessModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  showPrintOption?: boolean;
  onPrint?: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  title,
  message,
  onClose,
  showPrintOption = false,
  onPrint,
}) => {
  const primaryButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && primaryButtonRef.current) {
      primaryButtonRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Enter") {
        if (showPrintOption && onPrint && event.key === "Enter") {
          onPrint();
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, onPrint, showPrintOption]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 animate-fadeIn"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-title"
      aria-describedby="success-message"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all animate-scaleIn mobile-modal portrait-modal landscape-modal small-portrait-modal">
        <div className="p-4 sm:p-6 text-center landscape-compact portrait-compact">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3
            id="success-title"
            className="text-xl font-bold text-gray-900 mb-2"
          >
            {title}
          </h3>
          <p id="success-message" className="text-gray-600 mb-6 break-words">
            {message}
          </p>

          <div className="space-y-3">
            {showPrintOption && onPrint && (
              <button
                ref={primaryButtonRef}
                onClick={onPrint}
                className="w-full py-3 px-4 rounded-lg font-semibold bg-green-600 hover:bg-green-700 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center justify-center space-x-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                <span>Cetak Struk</span>
              </button>
            )}
            <button
              ref={!showPrintOption ? primaryButtonRef : undefined}
              onClick={onClose}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                showPrintOption
                  ? "bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-500"
                  : "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500"
              }`}
            >
              {showPrintOption ? "Tutup" : "OK"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Loading Modal
interface LoadingModalProps {
  isOpen: boolean;
  message: string;
}

export const LoadingModal: React.FC<LoadingModalProps> = ({
  isOpen,
  message,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loading-message"
    >
      <div className="bg-white rounded-xl shadow-2xl p-8 text-center transform transition-all animate-scaleIn">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p
          id="loading-message"
          className="text-gray-700 font-medium break-words"
        >
          {message}
        </p>
      </div>
    </div>
  );
};

// Enhanced Payment Confirmation Modal
interface PaymentConfirmModalProps {
  isOpen: boolean;
  title: string;
  cartItems: Array<{ name: string; quantity: number; price: number }>;
  totalAmount: number;
  paymentMethod: string;
  cashGiven?: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const PaymentConfirmModal: React.FC<PaymentConfirmModalProps> = ({
  isOpen,
  title,
  cartItems,
  totalAmount,
  paymentMethod,
  cashGiven = 0,
  onConfirm,
  onCancel,
}) => {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      } else if (event.key === "Enter") {
        onConfirm();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onCancel, onConfirm]);

  if (!isOpen) return null;

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString("id-ID")}`;
  };

  const change = paymentMethod === "cash" ? cashGiven - totalAmount : 0;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] p-4 animate-fadeIn"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-confirm-title"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all animate-scaleIn scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 hover:scrollbar-thumb-gray-500 mobile-modal portrait-modal landscape-modal small-portrait-modal tablet-portrait-modal tablet-landscape-modal ios-modal">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3
                id="payment-confirm-title"
                className="text-xl font-bold truncate"
              >
                {title}
              </h3>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Complete Items Summary */}
          <div className="mb-4">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              Ringkasan Lengkap Pesanan ({cartItems.length} item):
            </h4>
            <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto border border-gray-200 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 hover:scrollbar-thumb-gray-500">
              <div className="space-y-3">
                {cartItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center py-2 px-3 bg-white rounded-md border border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <span className="text-gray-800 font-medium">
                        {item.name}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatCurrency(item.price)} × {item.quantity}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(item.quantity * item.price)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {cartItems.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  Tidak ada item dalam pesanan
                </div>
              )}
            </div>
          </div>

          {/* Payment Details */}
          <div className="border-t pt-4 space-y-3">
            {/* Subtotal breakdown */}
            <div className="bg-blue-50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  Subtotal ({cartItems.length} item):
                </span>
                <span className="font-medium">
                  {formatCurrency(
                    cartItems.reduce(
                      (sum, item) => sum + item.quantity * item.price,
                      0,
                    ),
                  )}
                </span>
              </div>
            </div>

            <div className="flex justify-between text-lg font-bold border-t pt-3">
              <span>Total Pembayaran:</span>
              <span className="text-green-600">
                {formatCurrency(totalAmount)}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Metode Pembayaran:</span>
              <span className="font-medium">
                {paymentMethod === "cash"
                  ? "💵 Tunai"
                  : paymentMethod === "card"
                    ? "💳 Kartu"
                    : "📱 E-Wallet"}
              </span>
            </div>

            {paymentMethod === "cash" && (
              <>
                <div className="flex justify-between">
                  <span>Uang Diterima:</span>
                  <span className="font-medium">
                    {formatCurrency(cashGiven)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Kembalian:</span>
                  <span className="font-medium text-blue-600">
                    {formatCurrency(change)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Confirmation Message */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
            <div className="flex items-start space-x-3">
              <svg
                className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-yellow-800 mb-1">
                  Konfirmasi Pesanan
                </p>
                <p className="text-sm text-yellow-700">
                  Periksa kembali semua item di atas dan pastikan jumlah, harga,
                  dan total pembayaran sudah benar. Transaksi yang sudah
                  diproses tidak dapat dibatalkan.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl">
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 px-4 rounded-lg font-semibold bg-gray-200 hover:bg-gray-300 text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Batal
            </button>
            <button
              ref={confirmButtonRef}
              onClick={onConfirm}
              className="flex-1 py-3 px-4 rounded-lg font-semibold bg-green-600 hover:bg-green-700 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center justify-center space-x-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Proses Pembayaran</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal Hook for managing modals
export const useModals = () => {
  const [alert, setAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "warning" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const [confirm, setConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "danger" | "warning" | "info";
    resolve?: (value: boolean) => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const [prompt, setPrompt] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    defaultValue: string;
    inputType: "text" | "number" | "email" | "tel";
    resolve?: (value: string | null) => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    defaultValue: "",
    inputType: "text",
  });

  const [success, setSuccess] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    showPrintOption: boolean;
    onPrint?: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    showPrintOption: false,
  });

  const [loading, setLoading] = useState<{
    isOpen: boolean;
    message: string;
  }>({
    isOpen: false,
    message: "",
  });

  const [paymentConfirm, setPaymentConfirm] = useState<{
    isOpen: boolean;
    title: string;
    cartItems: Array<{ name: string; quantity: number; price: number }>;
    totalAmount: number;
    paymentMethod: string;
    cashGiven: number;
    resolve?: (value: boolean) => void;
  }>({
    isOpen: false,
    title: "",
    cartItems: [],
    totalAmount: 0,
    paymentMethod: "",
    cashGiven: 0,
  });

  const showAlert = (
    title: string,
    message: string,
    type: "success" | "error" | "warning" | "info" = "info",
  ) => {
    setAlert({ isOpen: true, title, message, type });
  };

  const showConfirm = (
    title: string,
    message: string,
    type: "danger" | "warning" | "info" = "info",
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirm({ isOpen: true, title, message, type, resolve });
    });
  };

  const showPrompt = (
    title: string,
    message: string,
    defaultValue: string = "",
    inputType: "text" | "number" | "email" | "tel" = "text",
  ): Promise<string | null> => {
    return new Promise((resolve) => {
      setPrompt({
        isOpen: true,
        title,
        message,
        defaultValue,
        inputType,
        resolve,
      });
    });
  };

  const showSuccess = (
    title: string,
    message: string,
    showPrintOption: boolean = false,
    onPrint?: () => void,
  ) => {
    setSuccess({ isOpen: true, title, message, showPrintOption, onPrint });
  };

  const showLoading = (message: string) => {
    setLoading({ isOpen: true, message });
  };

  const hideLoading = () => {
    setLoading({ isOpen: false, message: "" });
  };

  const showPaymentConfirm = (
    title: string,
    cartItems: Array<{ name: string; quantity: number; price: number }>,
    totalAmount: number,
    paymentMethod: string,
    cashGiven: number = 0,
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setPaymentConfirm({
        isOpen: true,
        title,
        cartItems,
        totalAmount,
        paymentMethod,
        cashGiven,
        resolve,
      });
    });
  };

  const closeAlert = () => {
    setAlert({ ...alert, isOpen: false });
  };

  const closeConfirm = (result: boolean) => {
    confirm.resolve?.(result);
    setConfirm({ ...confirm, isOpen: false });
  };

  const closePrompt = (result: string | null) => {
    prompt.resolve?.(result);
    setPrompt({ ...prompt, isOpen: false });
  };

  const closeSuccess = () => {
    setSuccess({ ...success, isOpen: false });
  };

  const closePaymentConfirm = (result: boolean) => {
    paymentConfirm.resolve?.(result);
    setPaymentConfirm({ ...paymentConfirm, isOpen: false });
  };

  const Modals = () => (
    <>
      <AlertModal
        isOpen={alert.isOpen}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={closeAlert}
      />
      <ConfirmModal
        isOpen={confirm.isOpen}
        title={confirm.title}
        message={confirm.message}
        type={confirm.type}
        onConfirm={() => closeConfirm(true)}
        onCancel={() => closeConfirm(false)}
      />
      <PromptModal
        isOpen={prompt.isOpen}
        title={prompt.title}
        message={prompt.message}
        defaultValue={prompt.defaultValue}
        inputType={prompt.inputType}
        onConfirm={(value) => closePrompt(value)}
        onCancel={() => closePrompt(null)}
      />
      <SuccessModal
        isOpen={success.isOpen}
        title={success.title}
        message={success.message}
        showPrintOption={success.showPrintOption}
        onPrint={success.onPrint}
        onClose={closeSuccess}
      />
      <LoadingModal isOpen={loading.isOpen} message={loading.message} />
      <PaymentConfirmModal
        isOpen={paymentConfirm.isOpen}
        title={paymentConfirm.title}
        cartItems={paymentConfirm.cartItems}
        totalAmount={paymentConfirm.totalAmount}
        paymentMethod={paymentConfirm.paymentMethod}
        cashGiven={paymentConfirm.cashGiven}
        onConfirm={() => closePaymentConfirm(true)}
        onCancel={() => closePaymentConfirm(false)}
      />
    </>
  );

  return {
    showAlert,
    showConfirm,
    showPrompt,
    showSuccess,
    showLoading,
    hideLoading,
    showPaymentConfirm,
    Modals,
  };
};
