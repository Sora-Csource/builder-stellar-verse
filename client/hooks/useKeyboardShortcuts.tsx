import { useEffect } from 'react';

interface KeyboardShortcutsProps {
  onOpenOrderEntry?: () => void;
  onOpenStockManagement?: () => void;
  onOpenCustomerManagement?: () => void;
  onOpenReports?: () => void;
  onOpenShiftManagement?: () => void;
  onOpenSettings?: () => void;
  onProcessPayment?: () => void;
  onClearCart?: () => void;
  onAddProduct?: () => void;
  onAddCustomer?: () => void;
  onLogout?: () => void;
  onSearch?: () => void;
}

export const useKeyboardShortcuts = ({
  onOpenOrderEntry,
  onOpenStockManagement,
  onOpenCustomerManagement,
  onOpenReports,
  onOpenShiftManagement,
  onOpenSettings,
  onProcessPayment,
  onClearCart,
  onAddProduct,
  onAddCustomer,
  onLogout,
  onSearch
}: KeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if user is typing in an input field
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      // Check for modifier keys (Ctrl or Cmd on Mac)
      const isModifierPressed = event.ctrlKey || event.metaKey;
      const isAltPressed = event.altKey;

      if (isModifierPressed && !isAltPressed) {
        switch (event.key.toLowerCase()) {
          case '1':
            event.preventDefault();
            onOpenOrderEntry?.();
            break;
          case '2':
            event.preventDefault();
            onOpenStockManagement?.();
            break;
          case '3':
            event.preventDefault();
            onOpenCustomerManagement?.();
            break;
          case '4':
            event.preventDefault();
            onOpenReports?.();
            break;
          case '5':
            event.preventDefault();
            onOpenShiftManagement?.();
            break;
          case '6':
            event.preventDefault();
            onOpenSettings?.();
            break;
          case 'enter':
            event.preventDefault();
            onProcessPayment?.();
            break;
          case 'delete':
          case 'backspace':
            event.preventDefault();
            onClearCart?.();
            break;
          case 'n':
            event.preventDefault();
            if (event.shiftKey) {
              onAddCustomer?.();
            } else {
              onAddProduct?.();
            }
            break;
          case 'f':
            event.preventDefault();
            onSearch?.();
            break;
          case 'q':
            event.preventDefault();
            onLogout?.();
            break;
        }
      }

      // Function keys (without modifiers)
      if (!isModifierPressed && !isAltPressed) {
        switch (event.key) {
          case 'F1':
            event.preventDefault();
            onOpenOrderEntry?.();
            break;
          case 'F2':
            event.preventDefault();
            onOpenStockManagement?.();
            break;
          case 'F3':
            event.preventDefault();
            onOpenCustomerManagement?.();
            break;
          case 'F4':
            event.preventDefault();
            onOpenReports?.();
            break;
          case 'F5':
            event.preventDefault();
            onOpenShiftManagement?.();
            break;
          case 'F6':
            event.preventDefault();
            onOpenSettings?.();
            break;
          case 'F9':
            event.preventDefault();
            onProcessPayment?.();
            break;
          case 'Escape':
            event.preventDefault();
            onClearCart?.();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    onOpenOrderEntry,
    onOpenStockManagement,
    onOpenCustomerManagement,
    onOpenReports,
    onOpenShiftManagement,
    onOpenSettings,
    onProcessPayment,
    onClearCart,
    onAddProduct,
    onAddCustomer,
    onLogout,
    onSearch
  ]);
};

// Keyboard shortcuts help component
export const KeyboardShortcutsHelp = () => {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
      <h4 className="font-semibold text-gray-800 mb-3">⌨️ Keyboard Shortcuts</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
        <div className="space-y-1">
          <p><kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl+1</kbd> atau <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">F1</kbd> Pesanan</p>
          <p><kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl+2</kbd> atau <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">F2</kbd> Stok</p>
          <p><kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl+3</kbd> atau <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">F3</kbd> Pelanggan</p>
          <p><kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl+4</kbd> atau <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">F4</kbd> Laporan</p>
          <p><kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl+5</kbd> atau <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">F5</kbd> Shift</p>
          <p><kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl+6</kbd> atau <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">F6</kbd> Pengaturan</p>
        </div>
        <div className="space-y-1">
          <p><kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl+Enter</kbd> atau <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">F9</kbd> Proses Bayar</p>
          <p><kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl+Del</kbd> atau <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Esc</kbd> Kosongkan Keranjang</p>
          <p><kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl+N</kbd> Tambah Produk</p>
          <p><kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl+Shift+N</kbd> Tambah Pelanggan</p>
          <p><kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl+F</kbd> Fokus Pencarian</p>
          <p><kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl+Q</kbd> Logout</p>
        </div>
      </div>
    </div>
  );
};
