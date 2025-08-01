import React, { useState, useEffect } from 'react';

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
  };
}

const POS: React.FC = () => {
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
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Form states
  const [productSearch, setProductSearch] = useState('');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'ewallet'>('cash');
  const [cashGiven, setCashGiven] = useState<number>(0);

  // Settings state
  const [settings, setSettings] = useState<Settings>({
    storeName: 'Aplikasi POS Kasir',
    taxRate: 10,
    currencySymbol: 'Rp',
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
      customThankYouMessage: 'Terima kasih atas pembelian Anda!'
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

  // Utility functions
  const generateUniqueId = () => {
    return 'id-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  };

  const formatCurrency = (amount: number) => {
    const numAmount = Number(amount);
    if (isNaN(numAmount)) return `${settings.currencySymbol} 0.00`;
    if (numAmount % 1 === 0) {
      return `${settings.currencySymbol} ${numAmount.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    return `${settings.currencySymbol} ${numAmount.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
      alert('Username atau password salah.');
    }
  };

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar?')) {
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
      alert('Produk tidak ditemukan.');
      return;
    }

    if (product.stock <= 0) {
      alert(`Stok ${product.name} saat ini kosong.`);
      return;
    }

    if (!currentShift || currentShift.status !== 'open') {
      alert('Anda harus memulai shift untuk menambahkan produk ke keranjang.');
      return;
    }

    const existingItem = cart.find(item => item.productId === productId);
    if (existingItem) {
      if (existingItem.quantity + 1 > product.stock) {
        alert(`Hanya ada ${product.stock} unit ${product.name} yang tersedia.`);
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
  const processPayment = () => {
    if (cart.length === 0) {
      alert('Tidak ada item di keranjang untuk diproses.');
      return;
    }

    if (!currentShift || currentShift.status !== 'open') {
      alert('Anda harus memulai shift untuk memproses penjualan.');
      return;
    }

    const { finalTotal } = getCartTotals();

    if (paymentMethod === 'cash' && cashGiven < finalTotal) {
      alert('Jumlah uang yang diberikan tidak mencukupi.');
      return;
    }

    if (window.confirm(`Total Pembayaran: ${formatCurrency(finalTotal)}. Lanjutkan pembayaran?`)) {
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

      alert(`Pembayaran berhasil! Transaksi ${saleId} berhasil. Total: ${formatCurrency(finalTotal)}`);
    }
  };

  // Start shift
  const startShift = async () => {
    if (!currentUser) {
      alert('Anda harus login untuk memulai shift.');
      return;
    }
    
    if (currentShift && currentShift.status === 'open') {
      alert('Anda sudah memiliki shift yang sedang berjalan.');
      return;
    }

    const initialCashStr = prompt('Masukkan Kas Awal Shift:', '0');
    const initialCash = parseFloat(initialCashStr || '0');
    
    if (isNaN(initialCash) || initialCash < 0) {
      alert('Kas awal harus berupa angka positif.');
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
    
    alert(`Shift dimulai dengan kas awal ${formatCurrency(initialCash)}.`);
  };

  // End shift
  const endShift = async () => {
    if (!currentShift || currentShift.status !== 'open') {
      alert('Tidak ada shift yang sedang berjalan untuk diakhiri.');
      return;
    }

    const salesTotal = currentShift.salesIds.reduce((total, saleId) => {
      const sale = sales.find(s => s.id === saleId && s.status === 'completed');
      return total + (sale ? sale.totalAmount : 0);
    }, 0);

    const expectedCash = currentShift.startCash + salesTotal;
    const finalCashStr = prompt('Masukkan Kas Akhir Shift:', expectedCash.toString());
    const finalCash = parseFloat(finalCashStr || '0');
    
    if (isNaN(finalCash) || finalCash < 0) {
      alert('Kas akhir harus berupa angka positif.');
      return;
    }

    if (window.confirm('Apakah Anda yakin ingin mengakhiri shift ini?')) {
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
      alert(`Shift berakhir.\nKas Awal: ${formatCurrency(currentShift.startCash)}\nTotal Penjualan: ${formatCurrency(salesTotal)}\nKas Diharapkan: ${formatCurrency(expectedCash)}\nKas Akhir: ${formatCurrency(finalCash)}\nSelisih: ${formatCurrency(discrepancy)}`);
    }
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

          {/* Main Content */}
          <main className="flex-1 p-6 bg-white m-4 rounded-lg shadow-md">
            <div className="flex items-center justify-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900">{settings.storeName}</h1>
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                      {products
                        .filter(product => 
                          product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                          product.id.toLowerCase().includes(productSearch.toLowerCase()) ||
                          (product.barcode && product.barcode.toLowerCase().includes(productSearch.toLowerCase()))
                        )
                        .map((product) => (
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
                            <div className="font-semibold text-gray-900 mb-1">{product.name}</div>
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
                      onClick={() => {
                        if (cart.length > 0 && window.confirm('Apakah Anda yakin ingin mengosongkan keranjang?')) {
                          setCart([]);
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
                      <p><strong>ID Shift:</strong> {currentShift.id}</p>
                      <p><strong>Waktu Mulai:</strong> {new Date(currentShift.startTime).toLocaleString('id-ID')}</p>
                      <p><strong>Kas Awal:</strong> {formatCurrency(currentShift.startCash)}</p>
                      <p><strong>Penjualan Saat Ini:</strong> {currentShift.salesIds.length} transaksi</p>
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
                        <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shifts.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="border border-gray-200 py-4 text-center text-gray-500">Tidak ada riwayat shift.</td>
                        </tr>
                      ) : (
                        [...shifts].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).map((shift) => {
                          const user = users.find(u => u.id === shift.userId);
                          return (
                            <tr key={shift.id} className="even:bg-gray-50">
                              <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500">{shift.id}</td>
                              <td className="border border-gray-200 px-3 py-2 text-sm font-medium text-gray-900">{user?.username || 'Unknown'}</td>
                              <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500">{new Date(shift.startTime).toLocaleString('id-ID')}</td>
                              <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500">{formatCurrency(shift.startCash)}</td>
                              <td className="border border-gray-200 px-3 py-2 text-sm">
                                <span className={shift.status === 'open' ? 'text-blue-500' : 'text-gray-500'}>
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

            {/* Other modules placeholder */}
            {activeModule !== 'order-entry' && activeModule !== 'shift-management' && (
              <div className="text-center py-8">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                  {allModules.find(m => m.id === activeModule)?.name || 'Modul'}
                </h2>
                <p className="text-gray-600">Modul ini sedang dalam pengembangan...</p>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
};

export default POS;
