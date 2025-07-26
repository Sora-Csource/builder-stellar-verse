import React, { useState, useEffect } from 'react';
import { useModals } from './EnhancedModals';
import { useKeyboardShortcuts, KeyboardShortcutsHelp } from '../hooks/useKeyboardShortcuts.tsx';

// Define all interfaces
interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'supervisor' | 'kasir' | 'staff';
  currentShiftId: string | null;
}

interface Product {
  id: string;
  name: string;
  barcode?: string;
  price: number;
  stock: number;
  imageUrl?: string;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Sale {
  id: string;
  date: string;
  items: CartItem[];
  totalAmount: number;
  paymentMethod: 'cash' | 'card' | 'ewallet';
  cashGiven: number;
  customer: string | null;
  status: 'completed' | 'voided';
  processedByUserId: string;
  shiftId: string;
}

interface Shift {
  id: string;
  userId: string;
  startTime: string;
  startCash: number;
  endTime: string | null;
  endCash: number | null;
  salesIds: string[];
  status: 'open' | 'closed';
}

interface Settings {
  storeName: string;
  taxRate: number;
  currencySymbol: string;
  logo?: string;
  rolePermissions: Record<string, string[]>;
  receiptSettings: {
    showStoreName: boolean;
    showDateTime: boolean;
    showTransactionId: boolean;
    showItemTotals: boolean;
    showSubtotal: boolean;
    showTax: boolean;
    showChange: boolean;
    showPaymentMethod: boolean;
    showThankYouMessage: boolean;
    customThankYouMessage: string;
    headerText: string;
    footerText: string;
    showLogo: boolean;
  };
}

const EnhancedPOS: React.FC = () => {
  // Custom modals hook
  const { showAlert, showConfirm, showPrompt, showSuccess, showLoading, hideLoading, Modals } = useModals();

  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [lastCompletedSaleId, setLastCompletedSaleId] = useState<string | null>(null);
  const [activeModule, setActiveModule] = useState<string>('order-entry');
  const [isLoginVisible, setIsLoginVisible] = useState(true);

  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showSaleDetailModal, setShowSaleDetailModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Form states
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'ewallet'>('cash');
  const [cashGiven, setCashGiven] = useState<number>(0);

  // Product form state
  const [productForm, setProductForm] = useState({
    name: '',
    barcode: '',
    price: 0,
    stock: 0,
    imageUrl: ''
  });

  // Customer form state
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // User form state
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    role: 'kasir' as 'admin' | 'supervisor' | 'kasir' | 'staff'
  });

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    storeName: 'Crema POS',
    taxRate: 10,
    currencySymbol: 'Rp',
    logo: ''
  });

  // Receipt settings form state
  const [receiptSettingsForm, setReceiptSettingsForm] = useState({
    showStoreName: true,
    showDateTime: true,
    showTransactionId: true,
    showItemTotals: true,
    showSubtotal: true,
    showTax: true,
    showChange: true,
    showPaymentMethod: true,
    showThankYouMessage: true,
    customThankYouMessage: 'Terima kasih atas pembelian Anda!',
    headerText: '',
    footerText: '',
    showLogo: true
  });

  // Settings tab state
  const [activeSettingsTab, setActiveSettingsTab] = useState('general');

  // Settings state
  const [settings, setSettings] = useState<Settings>({
    storeName: 'Crema POS',
    taxRate: 10,
    currencySymbol: 'Rp',
    logo: '',
    rolePermissions: {
      admin: ['order-entry', 'stock-management', 'customer-management', 'reports', 'shift-management', 'settings', 'integration', 'user-management'],
      supervisor: ['order-entry', 'stock-management', 'customer-management', 'reports', 'shift-management', 'user-management'],
      kasir: ['order-entry', 'shift-management', 'reports'],
      staff: ['order-entry']
    },
    receiptSettings: {
      showStoreName: true,
      showDateTime: true,
      showTransactionId: true,
      showItemTotals: true,
      showSubtotal: true,
      showTax: true,
      showChange: true,
      showPaymentMethod: true,
      showThankYouMessage: true,
      customThankYouMessage: 'Terima kasih atas pembelian Anda!',
      headerText: '',
      footerText: '',
      showLogo: true
    }
  });

  // Available modules
  const allModules = [
    { id: 'order-entry', name: 'Pesanan' },
    { id: 'stock-management', name: 'Stok' },
    { id: 'customer-management', name: 'Pelanggan' },
    { id: 'reports', name: 'Laporan' },
    { id: 'shift-management', name: 'Shift' },
    { id: 'settings', name: 'Pengaturan' },
    { id: 'integration', name: 'Integrasi' },
    { id: 'user-management', name: 'Akun' }
  ];

  // Sample data initialization
  const initializeSampleData = () => {
    if (products.length === 0) {
      const sampleProducts: Product[] = [
        {
          id: 'prod-001',
          name: 'Kopi Americano',
          barcode: '1234567890',
          price: 25000,
          stock: 50,
          imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=300&fit=crop'
        },
        {
          id: 'prod-002',
          name: 'Cappuccino',
          barcode: '1234567891',
          price: 30000,
          stock: 30,
          imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=300&h=300&fit=crop'
        },
        {
          id: 'prod-003',
          name: 'Latte',
          barcode: '1234567892',
          price: 32000,
          stock: 25,
          imageUrl: 'https://images.unsplash.com/photo-1561047029-3000c68339ca?w=300&h=300&fit=crop'
        },
        {
          id: 'prod-004',
          name: 'Croissant',
          barcode: '1234567893',
          price: 15000,
          stock: 20,
          imageUrl: 'https://images.unsplash.com/photo-1555507036-ab794f575e8c?w=300&h=300&fit=crop'
        },
        {
          id: 'prod-005',
          name: 'Sandwich',
          barcode: '1234567894',
          price: 45000,
          stock: 15,
          imageUrl: 'https://images.unsplash.com/photo-1553909489-cd47e0ef937f?w=300&h=300&fit=crop'
        },
        {
          id: 'prod-006',
          name: 'Matcha Latte',
          barcode: '1234567895',
          price: 35000,
          stock: 3, // Low stock for testing alert
          imageUrl: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=300&h=300&fit=crop'
        },
        {
          id: 'prod-007',
          name: 'Espresso',
          barcode: '1234567896',
          price: 20000,
          stock: 2, // Low stock for testing alert
          imageUrl: 'https://images.unsplash.com/photo-1610889556528-9a770e32642f?w=300&h=300&fit=crop'
        },
        {
          id: 'prod-008',
          name: 'Cake Slice',
          barcode: '1234567897',
          price: 35000,
          stock: 0, // Out of stock
          imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&h=300&fit=crop'
        }
      ];
      setProducts(sampleProducts);
    }

    if (customers.length === 0) {
      const sampleCustomers: Customer[] = [
        {
          id: 'cust-001',
          name: 'Ahmad Rizki',
          email: 'ahmad.rizki@email.com',
          phone: '081234567890'
        },
        {
          id: 'cust-002',
          name: 'Sari Dewi',
          email: 'sari.dewi@email.com',
          phone: '081234567891'
        },
        {
          id: 'cust-003',
          name: 'Budi Santoso',
          email: 'budi.santoso@email.com',
          phone: '081234567892'
        },
        {
          id: 'cust-004',
          name: 'Maya Sari',
          email: 'maya.sari@email.com',
          phone: '081234567893'
        },
        {
          id: 'cust-005',
          name: 'Andi Pratama',
          email: 'andi.pratama@email.com',
          phone: '081234567894'
        }
      ];
      setCustomers(sampleCustomers);
    }
  };

  // Utility functions
  const generateUniqueId = () => {
    return 'id-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  };

  const formatCurrency = (amount: number) => {
    const numAmount = Number(amount);
    if (isNaN(numAmount)) return `${settings.currencySymbol} 0`;
    return `${settings.currencySymbol} ${numAmount.toLocaleString('id-ID')}`;
  };

  // Receipt generation
  const generateReceiptHTML = (sale: Sale) => {
    const receiptSettings = settings.receiptSettings;
    const saleDate = new Date(sale.date).toLocaleString('id-ID');
    const subtotal = sale.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const taxAmount = subtotal * (settings.taxRate / 100);
    const finalTotal = subtotal + taxAmount;
    const cashGiven = sale.paymentMethod === 'cash' ? sale.cashGiven : 0;
    const change = sale.paymentMethod === 'cash' ? (cashGiven - finalTotal) : 0;

    let itemsHtml = '';
    if (receiptSettings.showItemTotals) {
      sale.items.forEach(item => {
        const itemTotal = item.quantity * item.price;
        itemsHtml += `
          <tr>
            <td style="text-align: left; padding: 2px 0; border-bottom: 1px dashed #ccc;">${item.name} x ${item.quantity}</td>
            <td style="text-align: right; padding: 2px 0; border-bottom: 1px dashed #ccc;">${formatCurrency(itemTotal)}</td>
          </tr>
        `;
      });
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Struk Pembelian</title>
        <style>
          body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 20px; }
          .receipt { width: 300px; margin: 0 auto; }
          .center { text-align: center; }
          .right { text-align: right; }
          .bold { font-weight: bold; }
          .line { border-top: 1px dashed #000; margin: 10px 0; }
          table { width: 100%; border-collapse: collapse; }
          .header { margin-bottom: 15px; }
          .footer { margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="receipt">
          ${receiptSettings.headerText ? `
            <div class="header center">
              <p>${receiptSettings.headerText}</p>
            </div>
            <div class="line"></div>
          ` : ''}

          ${receiptSettings.showLogo && settings.logo ? `
            <div class="center" style="margin-bottom: 10px;">
              <img src="${settings.logo}" alt="Logo" style="max-width: 100px; max-height: 100px; object-fit: contain;">
            </div>
          ` : ''}

          ${receiptSettings.showStoreName ? `
            <div class="header center">
              <h2 class="bold">${settings.storeName}</h2>
              ${receiptSettings.showDateTime ? `<p>${saleDate}</p>` : ''}
              ${receiptSettings.showTransactionId ? `<p>ID: ${sale.id}</p>` : ''}
            </div>
            <div class="line"></div>
          ` : ''}

          ${receiptSettings.showItemTotals ? `
            <table>
              <thead>
                <tr>
                  <th style="text-align: left;">Item</th>
                  <th style="text-align: right;">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            <div class="line"></div>
          ` : ''}

          <table>
            ${receiptSettings.showSubtotal ? `
              <tr>
                <td>Subtotal:</td>
                <td class="right bold">${formatCurrency(subtotal)}</td>
              </tr>
            ` : ''}
            ${receiptSettings.showTax ? `
              <tr>
                <td>Pajak (${settings.taxRate}%):</td>
                <td class="right bold">${formatCurrency(taxAmount)}</td>
              </tr>
            ` : ''}
            <tr>
              <td class="bold">TOTAL:</td>
              <td class="right bold">${formatCurrency(finalTotal)}</td>
            </tr>
            ${receiptSettings.showChange && sale.paymentMethod === 'cash' ? `
              <tr>
                <td>Tunai:</td>
                <td class="right">${formatCurrency(cashGiven)}</td>
              </tr>
              <tr>
                <td class="bold">Kembalian:</td>
                <td class="right bold">${formatCurrency(change)}</td>
              </tr>
            ` : ''}
            ${receiptSettings.showPaymentMethod ? `
              <tr>
                <td>Pembayaran:</td>
                <td class="right">${sale.paymentMethod === 'cash' ? 'Tunai' : sale.paymentMethod === 'card' ? 'Kartu' : 'E-Wallet'}</td>
              </tr>
            ` : ''}
          </table>

          ${receiptSettings.showThankYouMessage ? `
            <div class="line"></div>
            <div class="footer center">
              <p class="bold">${receiptSettings.customThankYouMessage}</p>
            </div>
          ` : ''}

          ${receiptSettings.footerText ? `
            <div class="footer center">
              <p>${receiptSettings.footerText}</p>
            </div>
          ` : ''}
        </div>
      </body>
      </html>
    `;
  };

  // Print receipt function
  const printReceipt = (sale: Sale) => {
    const receiptHTML = generateReceiptHTML(sale);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      setTimeout(() => {
        printWindow.close();
      }, 100);
    } else {
      showAlert('Kesalahan Browser', 'Tidak dapat membuka jendela cetak. Pastikan pop-up diizinkan untuk situs ini.', 'error');
    }
  };

  // Export functions
  const exportToCSV = (data: any[], filename: string) => {
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    const csvContent = `${headers}\n${rows}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Get low stock products
  const getLowStockProducts = () => {
    return products.filter(product => product.stock <= 5 && product.stock > 0);
  };

  // Get out of stock products
  const getOutOfStockProducts = () => {
    return products.filter(product => product.stock === 0);
  };

  // Data persistence
  const saveData = () => {
    try {
      localStorage.setItem('posData', JSON.stringify({
        users, products, customers, sales, shifts, settings,
        currentUser: currentUser ? currentUser.id : null
      }));
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Gagal menyimpan data.');
    }
  };

  const loadData = () => {
    try {
      const storedData = localStorage.getItem('posData');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setUsers(parsedData.users || []);
        setProducts(parsedData.products || []);
        setCustomers(parsedData.customers || []);
        setSales(parsedData.sales || []);
        setShifts(parsedData.shifts || []);
        setSettings({ ...settings, ...(parsedData.settings || {}) });

        if (parsedData.currentUser) {
          const user = (parsedData.users || []).find((u: User) => u.id === parsedData.currentUser);
          if (user) {
            setCurrentUser(user);
            setIsLoginVisible(false);
            if (user.currentShiftId) {
              const shift = (parsedData.shifts || []).find((s: Shift) => s.id === user.currentShiftId && s.status === 'open');
              setCurrentShift(shift || null);
            }
          }
        }

        if (!parsedData.users || parsedData.users.length === 0) {
          const defaultUsers = [{
            id: 'admin-001',
            username: 'admin',
            password: 'admin',
            role: 'admin' as const,
            currentShiftId: null
          }];
          setUsers(defaultUsers);
        }
      } else {
        const defaultUsers = [{
          id: 'admin-001',
          username: 'admin',
          password: 'admin',
          role: 'admin' as const,
          currentShiftId: null
        }];
        setUsers(defaultUsers);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      const defaultUsers = [{
        id: 'admin-001',
        username: 'admin',
        password: 'admin',
        role: 'admin' as const,
        currentShiftId: null
      }];
      setUsers(defaultUsers);
      setCurrentUser(null);
      setIsLoginVisible(true);
    }
  };

  // Effects
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (users.length > 0 || products.length > 0 || customers.length > 0 || sales.length > 0 || shifts.length > 0) {
      saveData();
    }
  }, [users, products, customers, sales, shifts, settings, currentUser]);

  useEffect(() => {
    initializeSampleData();
  }, []);

  // Keyboard shortcuts integration
  useKeyboardShortcuts({
    onOpenOrderEntry: () => setActiveModule('order-entry'),
    onOpenStockManagement: () => setActiveModule('stock-management'),
    onOpenCustomerManagement: () => setActiveModule('customer-management'),
    onOpenReports: () => setActiveModule('reports'),
    onOpenShiftManagement: () => setActiveModule('shift-management'),
    onOpenSettings: () => setActiveModule('settings'),
    onProcessPayment: () => {
      if (activeModule === 'order-entry' && cart.length > 0) {
        processPayment();
      }
    },
    onClearCart: () => {
      if (activeModule === 'order-entry' && cart.length > 0) {
        setCart([]);
      }
    },
    onAddProduct: () => {
      if (activeModule === 'stock-management') {
        setShowProductModal(true);
      }
    },
    onAddCustomer: () => {
      if (activeModule === 'customer-management') {
        setShowCustomerModal(true);
      }
    },
    onLogout: () => handleLogout(),
    onSearch: () => {
      // Focus search input if available
      const searchInput = document.querySelector('input[placeholder*="Cari"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    }
  });

  // Show alerts for low stock
  useEffect(() => {
    if (products.length > 0) {
      const lowStock = getLowStockProducts();
      const outOfStock = getOutOfStockProducts();
      
      if (outOfStock.length > 0) {
        const outOfStockNames = outOfStock.map(p => p.name).join(', ');
        console.warn(`Produk habis: ${outOfStockNames}`);
      }
      
      if (lowStock.length > 0) {
        const lowStockNames = lowStock.map(p => `${p.name} (${p.stock})`).join(', ');
        console.warn(`Stok rendah: ${lowStockNames}`);
      }
    }
  }, [products]);

  // Authentication
  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      setCurrentUser(user);
      setIsLoginVisible(false);
      
      if (user.currentShiftId) {
        const shift = shifts.find(s => s.id === user.currentShiftId && s.status === 'open');
        setCurrentShift(shift || null);
      } else {
        setCurrentShift(null);
      }
      
      const allowedModules = settings.rolePermissions[user.role] || [];
      if (allowedModules.length > 0) {
        setActiveModule(allowedModules[0]);
      }
    } else {
      showAlert('Login Gagal', 'Username atau password salah.', 'error');
    }
  };

  const handleLogout = async () => {
    const confirmed = await showConfirm('Konfirmasi Logout', 'Apakah Anda yakin ingin keluar?', 'warning');
    if (confirmed) {
      setCurrentUser(null);
      setCurrentShift(null);
      setIsLoginVisible(true);
      setActiveModule('order-entry');
    }
  };

  // Permission checks
  const hasModuleAccess = (moduleId: string) => {
    if (!currentUser) return false;
    const allowedModules = settings.rolePermissions[currentUser.role] || [];
    return allowedModules.includes(moduleId);
  };

  // Cart functions
  const addToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) {
      showAlert('Produk Tidak Ditemukan', 'Produk tidak ditemukan.', 'error');
      return;
    }

    if (product.stock <= 0) {
      showAlert('Stok Habis', `Stok ${product.name} saat ini kosong.`, 'warning');
      return;
    }

    if (!currentShift || currentShift.status !== 'open') {
      showAlert('Shift Diperlukan', 'Anda harus memulai shift untuk menambahkan produk ke keranjang.', 'warning');
      return;
    }

    const existingItem = cart.find(item => item.productId === productId);
    if (existingItem) {
      if (existingItem.quantity + 1 > product.stock) {
        showAlert('Stok Tidak Cukup', `Hanya ada ${product.stock} unit ${product.name} yang tersedia.`, 'warning');
        return;
      }
      setCart(cart.map(item => 
        item.productId === productId 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1
      }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (product && quantity <= product.stock && quantity >= 1) {
      setCart(cart.map(item => 
        item.productId === productId 
          ? { ...item, quantity }
          : item
      ));
    }
  };

  // Calculate cart totals
  const getCartTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const taxAmount = subtotal * (settings.taxRate / 100);
    const finalTotal = subtotal + taxAmount;
    return { subtotal, taxAmount, finalTotal };
  };

  // Process payment
  const processPayment = async () => {
    if (cart.length === 0) {
      showAlert('Keranjang Kosong', 'Tidak ada item di keranjang untuk diproses.', 'warning');
      return;
    }

    if (!currentShift || currentShift.status !== 'open') {
      showAlert('Shift Diperlukan', 'Anda harus memulai shift untuk memproses penjualan.', 'warning');
      return;
    }

    const { finalTotal } = getCartTotals();

    if (paymentMethod === 'cash' && cashGiven < finalTotal) {
      showAlert('Pembayaran Kurang', 'Jumlah uang yang diberikan tidak mencukupi.', 'error');
      return;
    }

    const confirmed = await showConfirm('Konfirmasi Pembayaran', `Total Pembayaran: ${formatCurrency(finalTotal)}. Lanjutkan pembayaran?`, 'info');
    if (confirmed) {
      // Update stock
      const updatedProducts = products.map(product => {
        const cartItem = cart.find(item => item.productId === product.id);
        if (cartItem) {
          return { ...product, stock: product.stock - cartItem.quantity };
        }
        return product;
      });
      setProducts(updatedProducts);

      // Create sale record
      const saleId = generateUniqueId();
      const newSale: Sale = {
        id: saleId,
        date: new Date().toISOString(),
        items: [...cart],
        totalAmount: finalTotal,
        paymentMethod,
        cashGiven: paymentMethod === 'cash' ? cashGiven : 0,
        customer: null,
        status: 'completed',
        processedByUserId: currentUser?.id || 'unknown',
        shiftId: currentShift?.id || ''
      };
      setSales([...sales, newSale]);
      setLastCompletedSaleId(saleId);

      // Update current shift
      if (currentShift) {
        const updatedShift = {
          ...currentShift,
          salesIds: [...currentShift.salesIds, saleId]
        };
        setCurrentShift(updatedShift);
        setShifts(shifts.map(s => s.id === currentShift.id ? updatedShift : s));
      }

      // Clear cart
      setCart([]);
      setCashGiven(0);

      // Show success modal with print option
      showSuccess(
        'Pembayaran Berhasil!',
        `Transaksi ${saleId} berhasil. Total: ${formatCurrency(finalTotal)}`,
        true,
        () => printReceipt(newSale)
      );
    }
  };

  // Void sale function
  const voidSale = async (saleId: string) => {
    const confirmed = await showConfirm('Batalkan Transaksi', 'Apakah Anda yakin ingin membatalkan transaksi ini? Stok produk akan dikembalikan.', 'danger');
    if (confirmed) {
      const saleIndex = sales.findIndex(s => s.id === saleId);
      if (saleIndex !== -1 && sales[saleIndex].status === 'completed') {
        const voidedSale = sales[saleIndex];
        
        // Update sale status
        const updatedSales = sales.map(s => 
          s.id === saleId 
            ? { ...s, status: 'voided' as const }
            : s
        );
        setSales(updatedSales);

        // Return stock
        const updatedProducts = products.map(product => {
          const voidedItem = voidedSale.items.find(item => item.productId === product.id);
          if (voidedItem) {
            return { ...product, stock: product.stock + voidedItem.quantity };
          }
          return product;
        });
        setProducts(updatedProducts);

        showAlert('Berhasil', `Transaksi ${saleId} berhasil dibatalkan dan stok dikembalikan.`, 'success');
      } else {
        showAlert('Error', 'Transaksi tidak dapat dibatalkan atau sudah dibatalkan.', 'error');
      }
    }
  };

  // Product management
  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productForm.name || productForm.price <= 0 || productForm.stock < 0) {
      showAlert('Input Tidak Valid', 'Mohon isi semua field dengan benar.', 'error');
      return;
    }

    if (editingProduct) {
      // Edit existing product
      setProducts(products.map(p =>
        p.id === editingProduct.id
          ? { ...p, ...productForm }
          : p
      ));
      showAlert('Berhasil', 'Produk berhasil diperbarui.', 'success');
    } else {
      // Add new product
      const newProduct: Product = {
        id: generateUniqueId(),
        ...productForm
      };
      setProducts([...products, newProduct]);
      showAlert('Berhasil', 'Produk baru berhasil ditambahkan.', 'success');
    }

    setShowProductModal(false);
    setEditingProduct(null);
    setProductForm({ name: '', barcode: '', price: 0, stock: 0, imageUrl: '' });
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      barcode: product.barcode || '',
      price: product.price,
      stock: product.stock,
      imageUrl: product.imageUrl || ''
    });
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    const confirmed = await showConfirm('Konfirmasi Hapus', 'Apakah Anda yakin ingin menghapus produk ini?', 'danger');
    if (confirmed) {
      setProducts(products.filter(p => p.id !== productId));
      showAlert('Berhasil', 'Produk berhasil dihapus.', 'success');
    }
  };

  // Customer management
  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerForm.name) {
      showAlert('Input Tidak Valid', 'Nama pelanggan tidak boleh kosong.', 'error');
      return;
    }

    if (editingCustomer) {
      // Edit existing customer
      setCustomers(customers.map(c =>
        c.id === editingCustomer.id
          ? { ...c, ...customerForm }
          : c
      ));
      showAlert('Berhasil', 'Data pelanggan berhasil diperbarui.', 'success');
    } else {
      // Add new customer
      const newCustomer: Customer = {
        id: generateUniqueId(),
        ...customerForm
      };
      setCustomers([...customers, newCustomer]);
      showAlert('Berhasil', 'Pelanggan baru berhasil ditambahkan.', 'success');
    }

    setShowCustomerModal(false);
    setEditingCustomer(null);
    setCustomerForm({ name: '', email: '', phone: '' });
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setCustomerForm({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || ''
    });
    setShowCustomerModal(true);
  };

  const handleDeleteCustomer = async (customerId: string) => {
    const confirmed = await showConfirm('Konfirmasi Hapus', 'Apakah Anda yakin ingin menghapus pelanggan ini?', 'danger');
    if (confirmed) {
      setCustomers(customers.filter(c => c.id !== customerId));
      showAlert('Berhasil', 'Pelanggan berhasil dihapus.', 'success');
    }
  };

  // User management
  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userForm.username || !userForm.password) {
      showAlert('Input Tidak Valid', 'Username dan password tidak boleh kosong.', 'error');
      return;
    }

    // Check if username already exists
    const existingUser = users.find(u => u.username === userForm.username && u.id !== editingUser?.id);
    if (existingUser) {
      showAlert('Duplikat Username', 'Username sudah digunakan.', 'error');
      return;
    }

    if (editingUser) {
      // Edit existing user
      setUsers(users.map(u =>
        u.id === editingUser.id
          ? { ...u, ...userForm }
          : u
      ));
      showAlert('Berhasil', 'Pengguna berhasil diperbarui.', 'success');
    } else {
      // Add new user
      const newUser: User = {
        id: generateUniqueId(),
        currentShiftId: null,
        ...userForm
      };
      setUsers([...users, newUser]);
      showAlert('Berhasil', 'Pengguna baru berhasil ditambahkan.', 'success');
    }

    setShowUserModal(false);
    setEditingUser(null);
    setUserForm({ username: '', password: '', role: 'kasir' });
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      password: user.password,
      role: user.role
    });
    setShowUserModal(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (currentUser && currentUser.id === userId) {
      showAlert('Tidak Dapat Menghapus', 'Anda tidak dapat menghapus akun yang sedang digunakan.', 'warning');
      return;
    }

    const confirmed = await showConfirm('Konfirmasi Hapus', 'Apakah Anda yakin ingin menghapus pengguna ini?', 'danger');
    if (confirmed) {
      setUsers(users.filter(u => u.id !== userId));
      showAlert('Berhasil', 'Pengguna berhasil dihapus.', 'success');
    }
  };

  // Settings management
  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!settingsForm.storeName || settingsForm.taxRate < 0 || !settingsForm.currencySymbol) {
      showAlert('Input Tidak Valid', 'Mohon isi semua field dengan benar.', 'error');
      return;
    }

    setSettings({
      ...settings,
      storeName: settingsForm.storeName,
      taxRate: settingsForm.taxRate,
      currencySymbol: settingsForm.currencySymbol,
      logo: settingsForm.logo
    });

    showAlert('Berhasil', 'Pengaturan umum berhasil disimpan.', 'success');
  };

  // Handle logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        showAlert('File Terlalu Besar', 'Ukuran file logo maksimal 2MB.', 'error');
        return;
      }

      if (!file.type.startsWith('image/')) {
        showAlert('Format File Salah', 'Mohon pilih file gambar (PNG, JPG, atau GIF).', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setSettingsForm({ ...settingsForm, logo: result });
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle receipt settings submit
  const handleReceiptSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setSettings({
      ...settings,
      receiptSettings: receiptSettingsForm
    });

    showAlert('Berhasil', 'Pengaturan struk berhasil disimpan.', 'success');
  };

  // Initialize settings form when accessing settings
  useEffect(() => {
    if (activeModule === 'settings') {
      setSettingsForm({
        storeName: settings.storeName,
        taxRate: settings.taxRate,
        currencySymbol: settings.currencySymbol,
        logo: settings.logo || ''
      });

      setReceiptSettingsForm({
        showStoreName: settings.receiptSettings.showStoreName ?? true,
        showDateTime: settings.receiptSettings.showDateTime ?? true,
        showTransactionId: settings.receiptSettings.showTransactionId ?? true,
        showItemTotals: settings.receiptSettings.showItemTotals ?? true,
        showSubtotal: settings.receiptSettings.showSubtotal ?? true,
        showTax: settings.receiptSettings.showTax ?? true,
        showChange: settings.receiptSettings.showChange ?? true,
        showPaymentMethod: settings.receiptSettings.showPaymentMethod ?? true,
        showThankYouMessage: settings.receiptSettings.showThankYouMessage ?? true,
        customThankYouMessage: settings.receiptSettings.customThankYouMessage || 'Terima kasih atas pembelian Anda!',
        headerText: settings.receiptSettings.headerText || '',
        footerText: settings.receiptSettings.footerText || '',
        showLogo: settings.receiptSettings.showLogo ?? true
      });
    }
  }, [activeModule, settings]);

  // Shift management
  const startShift = async () => {
    if (!currentUser) {
      showAlert('Login Diperlukan', 'Anda harus login untuk memulai shift.', 'warning');
      return;
    }

    if (currentShift && currentShift.status === 'open') {
      showAlert('Shift Terbuka', 'Anda sudah memiliki shift yang sedang berjalan.', 'warning');
      return;
    }

    const initialCashStr = await showPrompt('Mulai Shift', 'Masukkan Kas Awal Shift:', '0', 'number');
    if (initialCashStr === null) return; // User cancelled

    const initialCash = parseFloat(initialCashStr);

    if (isNaN(initialCash) || initialCash < 0) {
      showAlert('Input Tidak Valid', 'Kas awal harus berupa angka positif.', 'error');
      return;
    }

    const newShift: Shift = {
      id: generateUniqueId(),
      userId: currentUser.id,
      startTime: new Date().toISOString(),
      startCash: initialCash,
      endTime: null,
      endCash: null,
      salesIds: [],
      status: 'open'
    };
    
    setShifts([...shifts, newShift]);
    setCurrentShift(newShift);
    
    // Update user's current shift ID
    const updatedUser = { ...currentUser, currentShiftId: newShift.id };
    setCurrentUser(updatedUser);
    setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));
    
    showAlert('Shift Dimulai', `Shift dimulai dengan kas awal ${formatCurrency(initialCash)}.`, 'success');
  };

  // End shift
  const endShift = async () => {
    if (!currentShift || currentShift.status !== 'open') {
      showAlert('Tidak Ada Shift', 'Tidak ada shift yang sedang berjalan untuk diakhiri.', 'warning');
      return;
    }

    const salesTotal = currentShift.salesIds.reduce((total, saleId) => {
      const sale = sales.find(s => s.id === saleId && s.status === 'completed');
      return total + (sale ? sale.totalAmount : 0);
    }, 0);

    const expectedCash = currentShift.startCash + salesTotal;
    const finalCashStr = await showPrompt('Akhiri Shift', 'Masukkan Kas Akhir Shift:', expectedCash.toString(), 'number');
    if (finalCashStr === null) return; // User cancelled

    const finalCash = parseFloat(finalCashStr);

    if (isNaN(finalCash) || finalCash < 0) {
      showAlert('Input Tidak Valid', 'Kas akhir harus berupa angka positif.', 'error');
      return;
    }

    const confirmed = await showConfirm('Konfirmasi Akhiri Shift', 'Apakah Anda yakin ingin mengakhiri shift ini?', 'warning');
    if (confirmed) {
      const updatedShift = {
        ...currentShift,
        endTime: new Date().toISOString(),
        endCash: finalCash,
        status: 'closed' as const
      };
      
      setShifts(shifts.map(s => s.id === currentShift.id ? updatedShift : s));
      setCurrentShift(null);
      
      // Clear current shift from user
      if (currentUser) {
        const updatedUser = { ...currentUser, currentShiftId: null };
        setCurrentUser(updatedUser);
        setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));
      }

      const discrepancy = finalCash - expectedCash;
      showAlert('Shift Berakhir', `Kas Awal: ${formatCurrency(currentShift.startCash)}\nTotal Penjualan: ${formatCurrency(salesTotal)}\nKas Diharapkan: ${formatCurrency(expectedCash)}\nKas Akhir: ${formatCurrency(finalCash)}\nSelisih: ${formatCurrency(discrepancy)}`, 'info');
    }
  };

  // Get filtered sales for reports
  const getFilteredSales = () => {
    if (!reportStartDate && !reportEndDate) return sales;
    
    return sales.filter(sale => {
      const saleDate = new Date(sale.date);
      const startDate = reportStartDate ? new Date(reportStartDate) : null;
      const endDate = reportEndDate ? new Date(reportEndDate) : null;
      
      if (startDate && saleDate < startDate) return false;
      if (endDate && saleDate > endDate) return false;
      
      return true;
    });
  };

  // Filter functions for search
  const getFilteredProducts = () => {
    return products.filter(product =>
      product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      product.id.toLowerCase().includes(productSearch.toLowerCase()) ||
      (product.barcode && product.barcode.toLowerCase().includes(productSearch.toLowerCase()))
    );
  };

  const getFilteredCustomers = () => {
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      (customer.email && customer.email.toLowerCase().includes(customerSearch.toLowerCase())) ||
      (customer.phone && customer.phone.includes(customerSearch))
    );
  };

  const getFilteredUsers = () => {
    return users.filter(user =>
      user.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.role.toLowerCase().includes(userSearch.toLowerCase())
    );
  };

  return (
    <div className="min-h-screen bg-gray-100" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Login Screen */}
      {isLoginVisible && (
        <div className="fixed inset-0 bg-gray-100 flex items-center justify-center z-50">
          <div className="bg-white p-12 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">Login POS</h2>
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Username:</label>
                <input
                  type="text"
                  name="username"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">Password:</label>
                <input
                  type="password"
                  name="password"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-indigo-700 transition duration-200"
              >
                Masuk
              </button>
              <div className="mt-4 text-sm text-gray-600 text-center">
                <p>Default Login:</p>
                <p>Username: <strong>admin</strong></p>
                <p>Password: <strong>admin</strong></p>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main App */}
      {!isLoginVisible && currentUser && (
        <div className="flex flex-col min-h-screen">
          {/* Top Navigation */}
          <nav className="bg-gray-800 text-gray-300 px-6 py-3 shadow-lg rounded-b-lg">
            <div className="flex justify-center items-center flex-wrap gap-4">
              {allModules.map((module) => (
                hasModuleAccess(module.id) && (
                  <button
                    key={module.id}
                    onClick={() => setActiveModule(module.id)}
                    className={`flex flex-col items-center px-4 py-2 rounded-md text-sm transition-colors ${
                      activeModule === module.id
                        ? 'bg-gray-700 text-white'
                        : 'hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <span className="text-xs">{module.name}</span>
                  </button>
                )
              ))}
              <button
                onClick={handleLogout}
                className="flex flex-col items-center px-4 py-2 rounded-md text-sm hover:bg-gray-700 hover:text-white transition-colors"
              >
                <span className="text-xs">Keluar</span>
              </button>
            </div>
          </nav>

          {/* Stock Alerts */}
          {(getLowStockProducts().length > 0 || getOutOfStockProducts().length > 0) && (
            <div className="mx-4 mt-2">
              {getOutOfStockProducts().length > 0 && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-2 mb-2 rounded">
                  <p className="font-bold">Produk Habis:</p>
                  <p className="text-sm">{getOutOfStockProducts().map(p => p.name).join(', ')}</p>
                </div>
              )}
              {getLowStockProducts().length > 0 && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-2 mb-2 rounded">
                  <p className="font-bold">Stok Rendah:</p>
                  <p className="text-sm">{getLowStockProducts().map(p => `${p.name} (${p.stock})`).join(', ')}</p>
                </div>
              )}
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 p-6 bg-white m-4 rounded-lg shadow-md">
            <div className="flex items-center justify-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900">{settings.storeName}</h1>
              <span className="ml-4 text-sm text-gray-500">
                User: {currentUser.username} ({currentUser.role})
                {currentShift && ` | Shift: ${currentShift.id}`}
              </span>
            </div>

            {/* Order Entry Module */}
            {activeModule === 'order-entry' && hasModuleAccess('order-entry') && (
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Entri Pesanan</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Product Selection */}
                  <div>
                    <div className="mb-4">
                      <label className="block text-gray-700 font-bold mb-2">
                        Cari Produk (Nama/ID/Barcode):
                      </label>
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                        placeholder="Ketik nama, ID, atau barcode produk..."
                      />
                    </div>

                    <h3 className="text-xl font-semibold mb-3 text-gray-800">Daftar Produk</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6 max-h-96 overflow-y-auto">
                      {getFilteredProducts().map((product) => (
                        <div
                          key={product.id}
                          onClick={() => addToCart(product.id)}
                          className={`border border-gray-200 rounded-lg p-4 text-center cursor-pointer transition-all hover:shadow-md ${
                            product.stock <= 0 ? 'opacity-60 cursor-not-allowed bg-red-50' : 'bg-white hover:transform hover:-translate-y-1'
                          }`}
                        >
                          <img
                            src={product.imageUrl || 'https://placehold.co/80x80/cccccc/333333?text=No+Img'}
                            alt={product.name}
                            className="w-20 h-20 object-cover rounded-md mx-auto mb-3 border border-gray-200"
                            onError={(e) => {
                              e.currentTarget.src = 'https://placehold.co/80x80/cccccc/333333?text=No+Img';
                            }}
                          />
                          <div className="font-semibold text-gray-900 mb-1 text-sm">{product.name}</div>
                          <div className="text-sm text-indigo-600 font-medium">{formatCurrency(product.price)}</div>
                          <div className={`text-xs ${product.stock <= 5 ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                            Stok: {product.stock}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cart and Payment */}
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-gray-800">Keranjang Belanja</h3>
                    <div className="bg-gray-50 p-4 rounded-lg shadow-inner mb-4 max-h-80 overflow-y-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Harga</th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          {cart.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-4 text-center text-gray-500">Keranjang kosong.</td>
                            </tr>
                          ) : (
                            cart.map((item) => {
                              const itemTotal = item.quantity * item.price;
                              return (
                                <tr key={item.productId} className="border-b border-gray-200">
                                  <td className="px-2 py-2 text-sm">{item.name}</td>
                                  <td className="px-2 py-2 text-sm">{formatCurrency(item.price)}</td>
                                  <td className="px-2 py-2">
                                    <input
                                      type="number"
                                      min="1"
                                      value={item.quantity}
                                      onChange={(e) => updateCartQuantity(item.productId, parseInt(e.target.value))}
                                      className="w-16 border rounded px-2 py-1 text-center text-sm"
                                    />
                                  </td>
                                  <td className="px-2 py-2 text-sm">{formatCurrency(itemTotal)}</td>
                                  <td className="px-2 py-2">
                                    <button
                                      onClick={() => removeFromCart(item.productId)}
                                      className="text-red-600 hover:text-red-900 text-sm font-semibold"
                                    >
                                      Hapus
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    <button
                      onClick={async () => {
                        if (cart.length > 0) {
                          const confirmed = await showConfirm('Konfirmasi', 'Apakah Anda yakin ingin mengosongkan keranjang?', 'warning');
                          if (confirmed) {
                            setCart([]);
                          }
                        }
                      }}
                      className="w-full bg-gray-600 text-white py-2 rounded-md font-semibold hover:bg-gray-700 transition duration-200 mb-4"
                    >
                      Kosongkan Keranjang
                    </button>

                    {/* Payment Section */}
                    <div className="bg-gray-50 p-4 rounded-lg shadow-inner">
                      {(() => {
                        const { subtotal, taxAmount, finalTotal } = getCartTotals();
                        const change = paymentMethod === 'cash' ? Math.max(0, cashGiven - finalTotal) : 0;

                        return (
                          <>
                            <div className="space-y-2 mb-4">
                              <div className="flex justify-between font-semibold text-gray-700">
                                <span>Subtotal:</span>
                                <span>{formatCurrency(subtotal)}</span>
                              </div>
                              <div className="flex justify-between font-semibold text-gray-700">
                                <span>Pajak ({settings.taxRate}%):</span>
                                <span>{formatCurrency(taxAmount)}</span>
                              </div>
                              <div className="flex justify-between text-2xl font-bold text-gray-900 border-t pt-2">
                                <span>Total Akhir:</span>
                                <span>{formatCurrency(finalTotal)}</span>
                              </div>
                            </div>

                            <div className="mb-4">
                              <label className="block text-gray-700 font-bold mb-2">Metode Pembayaran:</label>
                              <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'card' | 'ewallet')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                              >
                                <option value="cash">Tunai</option>
                                <option value="card">Kartu</option>
                                <option value="ewallet">Dompet Digital</option>
                              </select>
                            </div>

                            {paymentMethod === 'cash' && (
                              <div className="mb-4">
                                <label className="block text-gray-700 font-bold mb-2">Uang Diberikan:</label>
                                <input
                                  type="number"
                                  value={cashGiven}
                                  onChange={(e) => setCashGiven(parseFloat(e.target.value) || 0)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                                  placeholder="0"
                                />
                                <div className="flex justify-between font-bold text-lg mt-2">
                                  <span>Kembalian:</span>
                                  <span className={change >= 0 ? 'text-green-500' : 'text-red-500'}>
                                    {formatCurrency(change)}
                                  </span>
                                </div>
                              </div>
                            )}

                            <button
                              onClick={processPayment}
                              className="w-full bg-indigo-600 text-white py-2 rounded-md font-semibold hover:bg-indigo-700 transition duration-200"
                            >
                              Proses Pembayaran
                            </button>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stock Management Module */}
            {activeModule === 'stock-management' && hasModuleAccess('stock-management') && (
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Manajemen Stok</h2>
                <div className="flex justify-between items-center mb-4">
                  <button
                    onClick={() => setShowProductModal(true)}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-indigo-700 transition duration-200"
                  >
                    Tambah Produk Baru
                  </button>
                  <input
                    type="text"
                    placeholder="Cari produk..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-lg shadow-inner overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Gambar</th>
                        <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nama Produk</th>
                        <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Barcode</th>
                        <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Harga</th>
                        <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stok</th>
                        <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredProducts().length === 0 ? (
                        <tr>
                          <td colSpan={6} className="border border-gray-200 py-4 text-center text-gray-500">Tidak ada produk ditemukan.</td>
                        </tr>
                      ) : (
                        getFilteredProducts().map((product) => (
                          <tr key={product.id} className="even:bg-gray-50">
                            <td className="border border-gray-200 px-3 py-2">
                              <img
                                src={product.imageUrl || 'https://placehold.co/40x40/cccccc/333333?text=N/A'}
                                alt={product.name}
                                className="w-10 h-10 object-cover rounded-md"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://placehold.co/40x40/cccccc/333333?text=N/A';
                                }}
                              />
                            </td>
                            <td className="border border-gray-200 px-3 py-2 text-sm font-medium text-gray-900">{product.name}</td>
                            <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500">{product.barcode || '-'}</td>
                            <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500">{formatCurrency(product.price)}</td>
                            <td className="border border-gray-200 px-3 py-2 text-sm">
                              <span className={product.stock <= 5 ? 'text-red-500 font-bold' : 'text-gray-500'}>
                                {product.stock}
                              </span>
                            </td>
                            <td className="border border-gray-200 px-3 py-2 text-sm">
                              <button
                                onClick={() => handleEditProduct(product)}
                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Hapus
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Customer Management Module */}
            {activeModule === 'customer-management' && hasModuleAccess('customer-management') && (
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Manajemen Pelanggan</h2>
                <div className="flex justify-between items-center mb-4">
                  <button
                    onClick={() => setShowCustomerModal(true)}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-indigo-700 transition duration-200"
                  >
                    Tambah Pelanggan Baru
                  </button>
                  <input
                    type="text"
                    placeholder="Cari pelanggan..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-lg shadow-inner overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nama Pelanggan</th>
                        <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Telepon</th>
                        <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredCustomers().length === 0 ? (
                        <tr>
                          <td colSpan={4} className="border border-gray-200 py-4 text-center text-gray-500">Tidak ada pelanggan ditemukan.</td>
                        </tr>
                      ) : (
                        getFilteredCustomers().map((customer) => (
                          <tr key={customer.id} className="even:bg-gray-50">
                            <td className="border border-gray-200 px-3 py-2 text-sm font-medium text-gray-900">{customer.name}</td>
                            <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500">{customer.email || '-'}</td>
                            <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500">{customer.phone || '-'}</td>
                            <td className="border border-gray-200 px-3 py-2 text-sm">
                              <button
                                onClick={() => handleEditCustomer(customer)}
                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteCustomer(customer.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Hapus
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Reports Module */}
            {activeModule === 'reports' && hasModuleAccess('reports') && (
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Laporan</h2>
                
                <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow-inner">
                  <h3 className="text-xl font-semibold mb-3 text-gray-800">Filter Laporan Penjualan</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-gray-700 font-bold mb-2">Tanggal Mulai:</label>
                      <input
                        type="date"
                        value={reportStartDate}
                        onChange={(e) => setReportStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-bold mb-2">Tanggal Akhir:</label>
                      <input
                        type="date"
                        value={reportEndDate}
                        onChange={(e) => setReportEndDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          const salesData = getFilteredSales().map(sale => ({
                            id: sale.id,
                            date: new Date(sale.date).toLocaleDateString('id-ID'),
                            total: sale.totalAmount,
                            payment: sale.paymentMethod,
                            status: sale.status
                          }));
                          if (salesData.length > 0) {
                            exportToCSV(salesData, 'laporan_penjualan.csv');
                          } else {
                            showAlert('Tidak Ada Data', 'Tidak ada data untuk diekspor.', 'warning');
                          }
                        }}
                        className="bg-green-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-green-700 transition duration-200"
                      >
                        Ekspor CSV
                      </button>
                    </div>
                  </div>
                  
                  {(() => {
                    const filteredSales = getFilteredSales();
                    const completedSales = filteredSales.filter(s => s.status === 'completed');
                    const voidedSales = filteredSales.filter(s => s.status === 'voided');
                    const totalRevenue = completedSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
                    const totalTransactions = completedSales.length;
                    
                    return (
                      <div className="bg-white p-4 rounded-md shadow-sm text-gray-700 mb-4">
                        <h4 className="font-semibold mb-2">Ringkasan Laporan</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Total Pendapatan</p>
                            <p className="font-bold text-green-600 text-lg">{formatCurrency(totalRevenue)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Transaksi Selesai</p>
                            <p className="font-bold text-blue-600 text-lg">{totalTransactions}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Transaksi Dibatalkan</p>
                            <p className="font-bold text-red-600 text-lg">{voidedSales.length}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Rata-rata per Transaksi</p>
                            <p className="font-bold text-purple-600 text-lg">{formatCurrency(totalTransactions > 0 ? totalRevenue / totalTransactions : 0)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="bg-white p-4 rounded-lg shadow-inner overflow-x-auto">
                    <table className="min-w-full border-collapse">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID Penjualan</th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Metode Bayar</th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredSales().length === 0 ? (
                          <tr>
                            <td colSpan={6} className="border border-gray-200 py-4 text-center text-gray-500">Tidak ada data penjualan.</td>
                          </tr>
                        ) : (
                          getFilteredSales().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((sale) => (
                            <tr key={sale.id} className="even:bg-gray-50">
                              <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500">{sale.id}</td>
                              <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500">{new Date(sale.date).toLocaleString('id-ID')}</td>
                              <td className="border border-gray-200 px-3 py-2 text-sm font-medium text-gray-900 ${sale.status === 'voided' ? 'line-through' : ''}">{formatCurrency(sale.totalAmount)}</td>
                              <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500">
                                {sale.paymentMethod === 'cash' ? 'Tunai' : sale.paymentMethod === 'card' ? 'Kartu' : 'E-Wallet'}
                              </td>
                              <td className="border border-gray-200 px-3 py-2 text-sm">
                                <span className={sale.status === 'completed' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                                  {sale.status === 'completed' ? 'Selesai' : 'Dibatalkan'}
                                </span>
                              </td>
                              <td className="border border-gray-200 px-3 py-2 text-sm">
                                <button
                                  onClick={() => {
                                    setSelectedSale(sale);
                                    setShowSaleDetailModal(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-900 mr-2"
                                >
                                  Detail
                                </button>
                                <button
                                  onClick={() => printReceipt(sale)}
                                  className="text-green-600 hover:text-green-900 mr-2"
                                >
                                  Cetak
                                </button>
                                {sale.status === 'completed' && (
                                  <button
                                    onClick={() => voidSale(sale.id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Batalkan
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg shadow-inner">
                  <h3 className="text-xl font-semibold mb-3 text-gray-800">Laporan Stok</h3>
                  <div className="bg-white p-4 rounded-lg shadow-inner overflow-x-auto">
                    <table className="min-w-full border-collapse">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nama Produk</th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stok Saat Ini</th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Harga</th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nilai Stok</th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.sort((a, b) => a.stock - b.stock).map((product) => (
                          <tr key={product.id} className="even:bg-gray-50">
                            <td className="border border-gray-200 px-3 py-2 text-sm font-medium text-gray-900">{product.name}</td>
                            <td className="border border-gray-200 px-3 py-2 text-sm">
                              <span className={product.stock <= 5 ? 'text-red-500 font-bold' : 'text-gray-500'}>
                                {product.stock}
                              </span>
                            </td>
                            <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500">{formatCurrency(product.price)}</td>
                            <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500">{formatCurrency(product.price * product.stock)}</td>
                            <td className="border border-gray-200 px-3 py-2 text-sm">
                              {product.stock === 0 && <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Habis</span>}
                              {product.stock > 0 && product.stock <= 5 && <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Rendah</span>}
                              {product.stock > 5 && <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Normal</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Shift Management Module */}
            {activeModule === 'shift-management' && hasModuleAccess('shift-management') && (
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Manajemen Shift</h2>
                <div className="flex space-x-4 mb-6">
                  <button
                    onClick={startShift}
                    disabled={currentShift && currentShift.status === 'open'}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
                  >
                    Mulai Shift Hari Ini
                  </button>
                  <button
                    onClick={endShift}
                    disabled={!currentShift || currentShift.status !== 'open'}
                    className="bg-gray-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
                  >
                    Akhiri Shift
                  </button>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-4 rounded-md shadow-md mb-6">
                  {currentShift && currentShift.status === 'open' ? (
                    <div>
                      <h3 className="text-xl font-bold mb-2">Shift Aktif Saat Ini ({currentUser.username})</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm">ID Shift:</p>
                          <p className="font-semibold">{currentShift.id}</p>
                        </div>
                        <div>
                          <p className="text-sm">Waktu Mulai:</p>
                          <p className="font-semibold">{new Date(currentShift.startTime).toLocaleString('id-ID')}</p>
                        </div>
                        <div>
                          <p className="text-sm">Kas Awal:</p>
                          <p className="font-semibold">{formatCurrency(currentShift.startCash)}</p>
                        </div>
                        <div>
                          <p className="text-sm">Transaksi:</p>
                          <p className="font-semibold">{currentShift.salesIds.length}</p>
                        </div>
                      </div>
                      {(() => {
                        const salesTotal = currentShift.salesIds.reduce((total, saleId) => {
                          const sale = sales.find(s => s.id === saleId && s.status === 'completed');
                          return total + (sale ? sale.totalAmount : 0);
                        }, 0);
                        return (
                          <div className="mt-2">
                            <p className="text-sm">Total Pendapatan:</p>
                            <p className="font-bold text-lg">{formatCurrency(salesTotal)}</p>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <p>Tidak ada shift yang sedang berjalan. Klik "Mulai Shift Hari Ini" untuk memulai.</p>
                  )}
                </div>

                <h3 className="text-xl font-semibold mb-3 text-gray-800">Riwayat Shift</h3>
                <div className="bg-gray-50 p-4 rounded-lg shadow-inner overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID Shift</th>
                        <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pengguna</th>
                        <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Waktu Mulai</th>
                        <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Kas Awal</th>
                        <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Penjualan</th>
                        <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shifts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="border border-gray-200 py-4 text-center text-gray-500">Tidak ada riwayat shift.</td>
                        </tr>
                      ) : (
                        [...shifts].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).map((shift) => {
                          const user = users.find(u => u.id === shift.userId);
                          const salesTotal = shift.salesIds.reduce((total, saleId) => {
                            const sale = sales.find(s => s.id === saleId && s.status === 'completed');
                            return total + (sale ? sale.totalAmount : 0);
                          }, 0);
                          return (
                            <tr key={shift.id} className="even:bg-gray-50">
                              <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500">{shift.id}</td>
                              <td className="border border-gray-200 px-3 py-2 text-sm font-medium text-gray-900">{user?.username || 'Unknown'}</td>
                              <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500">{new Date(shift.startTime).toLocaleString('id-ID')}</td>
                              <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500">{formatCurrency(shift.startCash)}</td>
                              <td className="border border-gray-200 px-3 py-2 text-sm font-medium text-gray-900">{formatCurrency(salesTotal)}</td>
                              <td className="border border-gray-200 px-3 py-2 text-sm">
                                <span className={shift.status === 'open' ? 'bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs' : 'bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs'}>
                                  {shift.status === 'open' ? 'Terbuka' : 'Ditutup'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Settings Module */}
            {activeModule === 'settings' && hasModuleAccess('settings') && (
              <div>
                <h2 className="text-2xl font-semibold mb-6 text-gray-800">Pengaturan</h2>

                {/* Settings Tabs */}
                <div className="mb-6">
                  <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                      <button
                        onClick={() => setActiveSettingsTab('general')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeSettingsTab === 'general'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <span className="flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Pengaturan Umum
                        </span>
                      </button>
                      <button
                        onClick={() => setActiveSettingsTab('receipt')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeSettingsTab === 'receipt'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <span className="flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Pengaturan Struk
                        </span>
                      </button>
                      <button
                        onClick={() => setActiveSettingsTab('shortcuts')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeSettingsTab === 'shortcuts'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <span className="flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 011-1h1a2 2 0 100-4H7a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                          </svg>
                          Keyboard Shortcuts
                        </span>
                      </button>
                    </nav>
                  </div>
                </div>

                {/* General Settings Tab */}
                {activeSettingsTab === 'general' && (
                  <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                    <form onSubmit={handleSettingsSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-gray-700 font-bold mb-2">Nama Toko:</label>
                            <input
                              type="text"
                              value={settingsForm.storeName || ''}
                              onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-gray-700 font-bold mb-2">Tarif Pajak (%):</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={settingsForm.taxRate || 0}
                              onChange={(e) => setSettingsForm({ ...settingsForm, taxRate: parseFloat(e.target.value) || 0 })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-gray-700 font-bold mb-2">Simbol Mata Uang:</label>
                            <input
                              type="text"
                              maxLength={5}
                              value={settingsForm.currencySymbol || ''}
                              onChange={(e) => setSettingsForm({ ...settingsForm, currencySymbol: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-gray-700 font-bold mb-2">Logo Toko:</label>
                            <div className="space-y-3">
                              {settingsForm.logo && (
                                <div className="flex items-center justify-center w-32 h-32 border border-gray-300 rounded-lg bg-white">
                                  <img
                                    src={settingsForm.logo}
                                    alt="Logo Toko"
                                    className="max-w-full max-h-full object-contain"
                                  />
                                </div>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                              />
                              <p className="text-sm text-gray-500">
                                Format: PNG, JPG, GIF. Maksimal 2MB.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-200">
                        <button
                          type="submit"
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-md font-semibold hover:from-indigo-700 hover:to-purple-700 transition duration-200"
                        >
                          Simpan Pengaturan Umum
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Receipt Settings Tab */}
                {activeSettingsTab === 'receipt' && (
                  <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                    <form onSubmit={handleReceiptSettingsSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">Konten Struk</h3>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-gray-700 font-bold mb-2">Teks Header (Opsional):</label>
                              <textarea
                                value={receiptSettingsForm.headerText || ''}
                                onChange={(e) => setReceiptSettingsForm({ ...receiptSettingsForm, headerText: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                                rows={2}
                                placeholder="Teks yang ditampilkan di atas struk"
                              />
                            </div>

                            <div>
                              <label className="block text-gray-700 font-bold mb-2">Pesan Terima Kasih:</label>
                              <textarea
                                value={receiptSettingsForm.customThankYouMessage || 'Terima kasih atas pembelian Anda!'}
                                onChange={(e) => setReceiptSettingsForm({ ...receiptSettingsForm, customThankYouMessage: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                                rows={2}
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-gray-700 font-bold mb-2">Teks Footer (Opsional):</label>
                              <textarea
                                value={receiptSettingsForm.footerText || ''}
                                onChange={(e) => setReceiptSettingsForm({ ...receiptSettingsForm, footerText: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                                rows={2}
                                placeholder="Teks yang ditampilkan di bawah struk"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">Elemen yang Ditampilkan</h3>

                          <div className="grid grid-cols-1 gap-3">
                            {[
                              { key: 'showLogo', label: 'Tampilkan Logo' },
                              { key: 'showStoreName', label: 'Nama Toko' },
                              { key: 'showDateTime', label: 'Tanggal & Waktu' },
                              { key: 'showTransactionId', label: 'ID Transaksi' },
                              { key: 'showItemTotals', label: 'Detail Item' },
                              { key: 'showSubtotal', label: 'Subtotal' },
                              { key: 'showTax', label: 'Pajak' },
                              { key: 'showPaymentMethod', label: 'Metode Pembayaran' },
                              { key: 'showChange', label: 'Kembalian' },
                              { key: 'showThankYouMessage', label: 'Pesan Terima Kasih' }
                            ].map((item) => (
                              <label key={item.key} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                                <input
                                  type="checkbox"
                                  checked={Boolean(receiptSettingsForm[item.key as keyof typeof receiptSettingsForm])}
                                  onChange={(e) => setReceiptSettingsForm({
                                    ...receiptSettingsForm,
                                    [item.key]: e.target.checked
                                  })}
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <span className="text-sm font-medium text-gray-700">{item.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-200">
                        <button
                          type="submit"
                          className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-3 rounded-md font-semibold hover:from-green-700 hover:to-blue-700 transition duration-200"
                        >
                          Simpan Pengaturan Struk
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Keyboard Shortcuts Tab */}
                {activeSettingsTab === 'shortcuts' && (
                  <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                    <KeyboardShortcutsHelp />
                  </div>
                )}
              </div>
            )}

            {/* User Management Module */}
            {activeModule === 'user-management' && hasModuleAccess('user-management') && (
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Manajemen Akun Pengguna</h2>
                <div className="flex justify-between items-center mb-4">
                  <button
                    onClick={() => setShowUserModal(true)}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-indigo-700 transition duration-200"
                  >
                    Tambah Pengguna Baru
                  </button>
                  <input
                    type="text"
                    placeholder="Cari pengguna..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-lg shadow-inner overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                        <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Peran</th>
                        <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredUsers().length === 0 ? (
                        <tr>
                          <td colSpan={4} className="border border-gray-200 py-4 text-center text-gray-500">Tidak ada pengguna ditemukan.</td>
                        </tr>
                      ) : (
                        getFilteredUsers().map((user) => (
                          <tr key={user.id} className="even:bg-gray-50">
                            <td className="border border-gray-200 px-3 py-2 text-sm font-medium text-gray-900">{user.username}</td>
                            <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500 capitalize">{user.role}</td>
                            <td className="border border-gray-200 px-3 py-2 text-sm">
                              {currentUser?.id === user.id ? (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Online</span>
                              ) : (
                                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">Offline</span>
                              )}
                            </td>
                            <td className="border border-gray-200 px-3 py-2 text-sm">
                              <button
                                onClick={() => handleEditUser(user)}
                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600 hover:text-red-900"
                                disabled={currentUser?.id === user.id}
                              >
                                Hapus
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Integration Module */}
            {activeModule === 'integration' && hasModuleAccess('integration') && (
              <div className="text-center py-8">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Integrasi Eksternal</h2>
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md" role="alert">
                  <p className="font-bold">Modul ini akan datang!</p>
                  <p>Fungsionalitas integrasi dengan sistem eksternal (misalnya, akuntansi, e-commerce) akan tersedia di pembaruan mendatang.</p>
                </div>
              </div>
            )}
          </main>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all border border-gray-100">
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">📦</div>
                <h3 className="text-xl font-bold">
                  {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
                </h3>
              </div>
            </div>
            <form onSubmit={handleProductSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-gray-700 font-bold mb-2">Nama Produk:</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">Barcode (Opsional):</label>
                <input
                  type="text"
                  value={productForm.barcode}
                  onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">URL Gambar (Opsional):</label>
                <input
                  type="url"
                  value={productForm.imageUrl}
                  onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">Harga:</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">Stok:</label>
                <input
                  type="number"
                  min="0"
                  value={productForm.stock}
                  onChange={(e) => setProductForm({ ...productForm, stock: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div className="flex space-x-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowProductModal(false);
                    setEditingProduct(null);
                    setProductForm({ name: '', barcode: '', price: 0, stock: 0, imageUrl: '' });
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition duration-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition duration-200 shadow-md"
                >
                  💾 Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all border border-gray-100">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">👥</div>
                <h3 className="text-xl font-bold">
                  {editingCustomer ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}
                </h3>
              </div>
            </div>
            <form onSubmit={handleCustomerSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-gray-700 font-bold mb-2">Nama Pelanggan:</label>
                <input
                  type="text"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">Email (Opsional):</label>
                <input
                  type="email"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">Telepon (Opsional):</label>
                <input
                  type="tel"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex space-x-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomerModal(false);
                    setEditingCustomer(null);
                    setCustomerForm({ name: '', email: '', phone: '' });
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition duration-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition duration-200 shadow-md"
                >
                  👤 Simpan Pelanggan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all border border-gray-100">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">👨‍💼</div>
                <h3 className="text-xl font-bold">
                  {editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
                </h3>
              </div>
            </div>
            <form onSubmit={handleUserSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-gray-700 font-bold mb-2">Username:</label>
                <input
                  type="text"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">Password:</label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">Peran:</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value as 'admin' | 'supervisor' | 'kasir' | 'staff' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                >
                  <option value="admin">Administrator</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="kasir">Kasir</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
              <div className="flex space-x-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserModal(false);
                    setEditingUser(null);
                    setUserForm({ username: '', password: '', role: 'kasir' });
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition duration-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition duration-200 shadow-md"
                >
                  🔐 Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sale Detail Modal */}
      {showSaleDetailModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
              <h3 className="text-xl font-bold flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Detail Penjualan
              </h3>
            </div>
            <div className="p-6">
            <div className="space-y-3 text-gray-700">
              <p><strong>ID Penjualan:</strong> {selectedSale.id}</p>
              <p><strong>Tanggal:</strong> {new Date(selectedSale.date).toLocaleString('id-ID')}</p>
              <p><strong>Metode Pembayaran:</strong> {
                selectedSale.paymentMethod === 'cash' ? 'Tunai' : 
                selectedSale.paymentMethod === 'card' ? 'Kartu' : 'Dompet Digital'
              }</p>
              <p><strong>Status:</strong> <span className={selectedSale.status === 'completed' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                {selectedSale.status === 'completed' ? 'Selesai' : 'Dibatalkan'}
              </span></p>
              
              <h4 className="font-semibold mt-4 mb-2">Item:</h4>
              <ul className="space-y-1">
                {selectedSale.items.map((item, index) => (
                  <li key={index} className="flex justify-between py-1">
                    <span>{item.name} x {item.quantity}</span>
                    <span>{formatCurrency(item.quantity * item.price)}</span>
                  </li>
                ))}
              </ul>
              
              <div className="border-t pt-2 mt-4">
                {(() => {
                  const subtotal = selectedSale.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
                  const taxAmount = subtotal * (settings.taxRate / 100);
                  const finalTotal = subtotal + taxAmount;
                  const change = selectedSale.paymentMethod === 'cash' ? (selectedSale.cashGiven - finalTotal) : 0;

                  return (
                    <>
                      <p className="flex justify-between font-semibold"><span>Subtotal:</span><span>{formatCurrency(subtotal)}</span></p>
                      <p className="flex justify-between font-semibold"><span>Pajak ({settings.taxRate}%):</span><span>{formatCurrency(taxAmount)}</span></p>
                      <h3 className="flex justify-between text-xl font-bold mt-2"><span>Total Akhir:</span><span>{formatCurrency(finalTotal)}</span></h3>
                      {selectedSale.paymentMethod === 'cash' && (
                        <>
                          <p className="flex justify-between font-semibold"><span>Tunai Diberikan:</span><span>{formatCurrency(selectedSale.cashGiven)}</span></p>
                          <p className="flex justify-between font-semibold"><span>Kembalian:</span><span>{formatCurrency(change)}</span></p>
                        </>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => printReceipt(selectedSale)}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition duration-200 flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Cetak Struk
              </button>
              <button
                onClick={() => {
                  setShowSaleDetailModal(false);
                  setSelectedSale(null);
                }}
                className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 rounded-lg font-semibold hover:from-gray-700 hover:to-gray-800 transition duration-200 flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Tutup
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Modals */}
      <Modals />
    </div>
  );
};

export default EnhancedPOS;
