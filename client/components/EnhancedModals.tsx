import React, { useState, useEffect } from 'react';

// Enhanced Alert Modal
interface AlertModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  title,
  message,
  type = 'info',
  onClose
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return 'border-green-500 bg-green-50 text-green-800';
      case 'error':
        return 'border-red-500 bg-red-50 text-red-800';
      case 'warning':
        return 'border-yellow-500 bg-yellow-50 text-yellow-800';
      default:
        return 'border-blue-500 bg-blue-50 text-blue-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
        <div className={`p-6 rounded-t-xl border-l-4 ${getColors()}`}>
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{getIcon()}</div>
            <div className="flex-1">
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="text-sm mt-1">{message}</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
              type === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' :
              type === 'error' ? 'bg-red-600 hover:bg-red-700 text-white' :
              type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' :
              'bg-blue-600 hover:bg-blue-700 text-white'
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
  type?: 'danger' | 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  type = 'info',
  confirmText = 'Ya',
  cancelText = 'Tidak',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return '🗑️';
      case 'warning':
        return '⚠️';
      default:
        return '❓';
    }
  };

  const getConfirmButtonColors = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="text-3xl">{getIcon()}</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            </div>
          </div>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2 px-4 rounded-lg font-semibold bg-gray-200 hover:bg-gray-300 text-gray-800 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${getConfirmButtonColors()}`}
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
  inputType?: 'text' | 'number' | 'email' | 'tel';
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export const PromptModal: React.FC<PromptModalProps> = ({
  isOpen,
  title,
  message,
  defaultValue = '',
  placeholder = '',
  inputType = 'text',
  onConfirm,
  onCancel
}) => {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="text-3xl">💬</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">{title}</h3>
              </div>
            </div>
            <p className="text-gray-600 mb-4">{message}</p>
            <input
              type={inputType}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              autoFocus
            />
          </div>
          <div className="px-6 py-4 bg-gray-50 rounded-b-xl">
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-2 px-4 rounded-lg font-semibold bg-gray-200 hover:bg-gray-300 text-gray-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2 px-4 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
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
  onPrint
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
        <div className="p-6 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
            <div className="text-3xl">🎉</div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 mb-6">{message}</p>
          
          <div className="space-y-3">
            {showPrintOption && onPrint && (
              <button
                onClick={onPrint}
                className="w-full py-3 px-4 rounded-lg font-semibold bg-green-600 hover:bg-green-700 text-white transition-colors flex items-center justify-center space-x-2"
              >
                <span>🖨️</span>
                <span>Cetak Struk</span>
              </button>
            )}
            <button
              onClick={onClose}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                showPrintOption 
                  ? 'bg-gray-200 hover:bg-gray-300 text-gray-800' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {showPrintOption ? 'Tutup' : 'OK'}
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
  message
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-700 font-medium">{message}</p>
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
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const [confirm, setConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info';
    resolve?: (value: boolean) => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const [prompt, setPrompt] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    defaultValue: string;
    inputType: 'text' | 'number' | 'email' | 'tel';
    resolve?: (value: string | null) => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    defaultValue: '',
    inputType: 'text'
  });

  const [success, setSuccess] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    showPrintOption: boolean;
    onPrint?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    showPrintOption: false
  });

  const [loading, setLoading] = useState<{
    isOpen: boolean;
    message: string;
  }>({
    isOpen: false,
    message: ''
  });

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setAlert({ isOpen: true, title, message, type });
  };

  const showConfirm = (title: string, message: string, type: 'danger' | 'warning' | 'info' = 'info'): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirm({ isOpen: true, title, message, type, resolve });
    });
  };

  const showPrompt = (
    title: string, 
    message: string, 
    defaultValue: string = '',
    inputType: 'text' | 'number' | 'email' | 'tel' = 'text'
  ): Promise<string | null> => {
    return new Promise((resolve) => {
      setPrompt({ isOpen: true, title, message, defaultValue, inputType, resolve });
    });
  };

  const showSuccess = (title: string, message: string, showPrintOption: boolean = false, onPrint?: () => void) => {
    setSuccess({ isOpen: true, title, message, showPrintOption, onPrint });
  };

  const showLoading = (message: string) => {
    setLoading({ isOpen: true, message });
  };

  const hideLoading = () => {
    setLoading({ isOpen: false, message: '' });
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
      <LoadingModal
        isOpen={loading.isOpen}
        message={loading.message}
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
    Modals
  };
};
