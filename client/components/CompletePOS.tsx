import React, { useState, useEffect } from "react";

// Define all interfaces
interface User {
  id: string;
  username: string;
  password: string;
  role: "admin" | "supervisor" | "kasir" | "staff";
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
  paymentMethod: "cash" | "card" | "ewallet";
  cashGiven: number;
  customer: string | null;
  status: "completed" | "voided";
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
  status: "open" | "closed";
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

const CompletePOS: React.FC = () => {
  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [lastCompletedSaleId, setLastCompletedSaleId] = useState<string | null>(
    null,
  );
  const [activeModule, setActiveModule] = useState<string>("order-entry");
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
  const [productSearch, setProductSearch] = useState("");
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "card" | "ewallet"
  >("cash");
  const [cashGiven, setCashGiven] = useState<number>(0);

  // Product form state
  const [productForm, setProductForm] = useState({
    name: "",
    barcode: "",
    price: 0,
    stock: 0,
    imageUrl: "",
  });

  // Customer form state
  const [customerForm, setCustomerForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // User form state
  const [userForm, setUserForm] = useState({
    username: "",
    password: "",
    role: "kasir" as "admin" | "supervisor" | "kasir" | "staff",
  });

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    storeName: "",
    taxRate: 0,
    currencySymbol: "",
  });

  // Settings state
  const [settings, setSettings] = useState<Settings>({
    storeName: "Crema POS",
    taxRate: 10,
    currencySymbol: "Rp",
    rolePermissions: {
      admin: [
        "order-entry",
        "stock-management",
        "customer-management",
        "reports",
        "shift-management",
        "settings",
        "integration",
        "user-management",
      ],
      supervisor: [
        "order-entry",
        "stock-management",
        "customer-management",
        "reports",
        "shift-management",
        "user-management",
      ],
      kasir: ["order-entry", "shift-management", "reports"],
      staff: ["order-entry"],
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
      customThankYouMessage: "Terima kasih atas pembelian Anda!",
    },
  });

  // Available modules
  const allModules = [
    { id: "order-entry", name: "Pesanan" },
    { id: "stock-management", name: "Stok" },
    { id: "customer-management", name: "Pelanggan" },
    { id: "reports", name: "Laporan" },
    { id: "shift-management", name: "Shift" },
    { id: "settings", name: "Pengaturan" },
    { id: "integration", name: "Integrasi" },
    { id: "user-management", name: "Akun" },
  ];

  // Sample data initialization
  const initializeSampleData = () => {
    if (products.length === 0) {
      const sampleProducts: Product[] = [
        {
          id: "prod-001",
          name: "Kopi Americano",
          barcode: "1234567890",
          price: 25000,
          stock: 50,
          imageUrl:
            "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=300&fit=crop",
        },
        {
          id: "prod-002",
          name: "Cappuccino",
          barcode: "1234567891",
          price: 30000,
          stock: 30,
          imageUrl:
            "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=300&h=300&fit=crop",
        },
        {
          id: "prod-003",
          name: "Latte",
          barcode: "1234567892",
          price: 32000,
          stock: 25,
          imageUrl:
            "https://images.unsplash.com/photo-1561047029-3000c68339ca?w=300&h=300&fit=crop",
        },
        {
          id: "prod-004",
          name: "Croissant",
          barcode: "1234567893",
          price: 15000,
          stock: 20,
          imageUrl:
            "https://images.unsplash.com/photo-1555507036-ab794f575e8c?w=300&h=300&fit=crop",
        },
        {
          id: "prod-005",
          name: "Sandwich",
          barcode: "1234567894",
          price: 45000,
          stock: 15,
          imageUrl:
            "https://images.unsplash.com/photo-1553909489-cd47e0ef937f?w=300&h=300&fit=crop",
        },
        {
          id: "prod-006",
          name: "Matcha Latte",
          barcode: "1234567895",
          price: 35000,
          stock: 12,
          imageUrl:
            "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=300&h=300&fit=crop",
        },
      ];
      setProducts(sampleProducts);
    }

    if (customers.length === 0) {
      const sampleCustomers: Customer[] = [
        {
          id: "cust-001",
          name: "Ahmad Rizki",
          email: "ahmad.rizki@email.com",
          phone: "081234567890",
        },
        {
          id: "cust-002",
          name: "Sari Dewi",
          email: "sari.dewi@email.com",
          phone: "081234567891",
        },
        {
          id: "cust-003",
          name: "Budi Santoso",
          email: "budi.santoso@email.com",
          phone: "081234567892",
        },
      ];
      setCustomers(sampleCustomers);
    }
  };

  // Utility functions
  const generateUniqueId = () => {
    return "id-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
  };

  const formatCurrency = (amount: number) => {
    const numAmount = Number(amount);
    if (isNaN(numAmount)) return `${settings.currencySymbol} 0`;
    return `${settings.currencySymbol} ${numAmount.toLocaleString("id-ID")}`;
  };

  // Data persistence
  const saveData = () => {
    try {
      localStorage.setItem(
        "posData",
        JSON.stringify({
          users,
          products,
          customers,
          sales,
          shifts,
          settings,
          currentUser: currentUser ? currentUser.id : null,
        }),
      );
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Gagal menyimpan data.");
    }
  };

  const loadData = () => {
    try {
      const storedData = localStorage.getItem("posData");
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setUsers(parsedData.users || []);
        setProducts(parsedData.products || []);
        setCustomers(parsedData.customers || []);
        setSales(parsedData.sales || []);
        setShifts(parsedData.shifts || []);
        setSettings({ ...settings, ...(parsedData.settings || {}) });

        if (parsedData.currentUser) {
          const user = (parsedData.users || []).find(
            (u: User) => u.id === parsedData.currentUser,
          );
          if (user) {
            setCurrentUser(user);
            setIsLoginVisible(false);
            if (user.currentShiftId) {
              const shift = (parsedData.shifts || []).find(
                (s: Shift) =>
                  s.id === user.currentShiftId && s.status === "open",
              );
              setCurrentShift(shift || null);
            }
          }
        }

        if (!parsedData.users || parsedData.users.length === 0) {
          const defaultUsers = [
            {
              id: "admin-001",
              username: "admin",
              password: "admin",
              role: "admin" as const,
              currentShiftId: null,
            },
          ];
          setUsers(defaultUsers);
        }
      } else {
        const defaultUsers = [
          {
            id: "admin-001",
            username: "admin",
            password: "admin",
            role: "admin" as const,
            currentShiftId: null,
          },
        ];
        setUsers(defaultUsers);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      const defaultUsers = [
        {
          id: "admin-001",
          username: "admin",
          password: "admin",
          role: "admin" as const,
          currentShiftId: null,
        },
      ];
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
    if (
      users.length > 0 ||
      products.length > 0 ||
      customers.length > 0 ||
      sales.length > 0 ||
      shifts.length > 0
    ) {
      saveData();
    }
  }, [users, products, customers, sales, shifts, settings, currentUser]);

  useEffect(() => {
    initializeSampleData();
  }, []);

  // Authentication
  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    const user = users.find(
      (u) => u.username === username && u.password === password,
    );

    if (user) {
      setCurrentUser(user);
      setIsLoginVisible(false);

      if (user.currentShiftId) {
        const shift = shifts.find(
          (s) => s.id === user.currentShiftId && s.status === "open",
        );
        setCurrentShift(shift || null);
      } else {
        setCurrentShift(null);
      }

      const allowedModules = settings.rolePermissions[user.role] || [];
      if (allowedModules.length > 0) {
        setActiveModule(allowedModules[0]);
      }
    } else {
      alert("Username atau password salah.");
    }
  };

  const handleLogout = () => {
    if (window.confirm("Apakah Anda yakin ingin keluar?")) {
      setCurrentUser(null);
      setCurrentShift(null);
      setIsLoginVisible(true);
      setActiveModule("order-entry");
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
    const product = products.find((p) => p.id === productId);
    if (!product) {
      alert("Produk tidak ditemukan.");
      return;
    }

    if (product.stock <= 0) {
      alert(`Stok ${product.name} saat ini kosong.`);
      return;
    }

    if (!currentShift || currentShift.status !== "open") {
      alert("Anda harus memulai shift untuk menambahkan produk ke keranjang.");
      return;
    }

    const existingItem = cart.find((item) => item.productId === productId);
    if (existingItem) {
      if (existingItem.quantity + 1 > product.stock) {
        alert(`Hanya ada ${product.stock} unit ${product.name} yang tersedia.`);
        return;
      }
      setCart(
        cart.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
        },
      ]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    const product = products.find((p) => p.id === productId);
    if (product && quantity <= product.stock && quantity >= 1) {
      setCart(
        cart.map((item) =>
          item.productId === productId ? { ...item, quantity } : item,
        ),
      );
    }
  };

  // Calculate cart totals
  const getCartTotals = () => {
    const subtotal = cart.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0,
    );
    const taxAmount = subtotal * (settings.taxRate / 100);
    const finalTotal = subtotal + taxAmount;
    return { subtotal, taxAmount, finalTotal };
  };

  // Process payment
  const processPayment = () => {
    if (cart.length === 0) {
      alert("Tidak ada item di keranjang untuk diproses.");
      return;
    }

    if (!currentShift || currentShift.status !== "open") {
      alert("Anda harus memulai shift untuk memproses penjualan.");
      return;
    }

    const { finalTotal } = getCartTotals();

    if (paymentMethod === "cash" && cashGiven < finalTotal) {
      alert("Jumlah uang yang diberikan tidak mencukupi.");
      return;
    }

    if (
      window.confirm(
        `Total Pembayaran: ${formatCurrency(finalTotal)}. Lanjutkan pembayaran?`,
      )
    ) {
      // Update stock
      const updatedProducts = products.map((product) => {
        const cartItem = cart.find((item) => item.productId === product.id);
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
        cashGiven: paymentMethod === "cash" ? cashGiven : 0,
        customer: null,
        status: "completed",
        processedByUserId: currentUser?.id || "unknown",
        shiftId: currentShift?.id || "",
      };
      setSales([...sales, newSale]);
      setLastCompletedSaleId(saleId);

      // Update current shift
      if (currentShift) {
        const updatedShift = {
          ...currentShift,
          salesIds: [...currentShift.salesIds, saleId],
        };
        setCurrentShift(updatedShift);
        setShifts(
          shifts.map((s) => (s.id === currentShift.id ? updatedShift : s)),
        );
      }

      // Clear cart
      setCart([]);
      setCashGiven(0);

      alert(
        `Pembayaran berhasil! Transaksi ${saleId} berhasil. Total: ${formatCurrency(finalTotal)}`,
      );
    }
  };

  // Product management
  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!productForm.name || productForm.price <= 0 || productForm.stock < 0) {
      alert("Mohon isi semua field dengan benar.");
      return;
    }

    if (editingProduct) {
      // Edit existing product
      setProducts(
        products.map((p) =>
          p.id === editingProduct.id ? { ...p, ...productForm } : p,
        ),
      );
      alert("Produk berhasil diperbarui.");
    } else {
      // Add new product
      const newProduct: Product = {
        id: generateUniqueId(),
        ...productForm,
      };
      setProducts([...products, newProduct]);
      alert("Produk baru berhasil ditambahkan.");
    }

    setShowProductModal(false);
    setEditingProduct(null);
    setProductForm({ name: "", barcode: "", price: 0, stock: 0, imageUrl: "" });
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      barcode: product.barcode || "",
      price: product.price,
      stock: product.stock,
      imageUrl: product.imageUrl || "",
    });
    setShowProductModal(true);
  };

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus produk ini?")) {
      setProducts(products.filter((p) => p.id !== productId));
      alert("Produk berhasil dihapus.");
    }
  };

  // Customer management
  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerForm.name) {
      alert("Nama pelanggan tidak boleh kosong.");
      return;
    }

    if (editingCustomer) {
      // Edit existing customer
      setCustomers(
        customers.map((c) =>
          c.id === editingCustomer.id ? { ...c, ...customerForm } : c,
        ),
      );
      alert("Data pelanggan berhasil diperbarui.");
    } else {
      // Add new customer
      const newCustomer: Customer = {
        id: generateUniqueId(),
        ...customerForm,
      };
      setCustomers([...customers, newCustomer]);
      alert("Pelanggan baru berhasil ditambahkan.");
    }

    setShowCustomerModal(false);
    setEditingCustomer(null);
    setCustomerForm({ name: "", email: "", phone: "" });
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setCustomerForm({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone || "",
    });
    setShowCustomerModal(true);
  };

  const handleDeleteCustomer = (customerId: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus pelanggan ini?")) {
      setCustomers(customers.filter((c) => c.id !== customerId));
      alert("Pelanggan berhasil dihapus.");
    }
  };

  // User management
  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!userForm.username || !userForm.password) {
      alert("Username dan password tidak boleh kosong.");
      return;
    }

    // Check if username already exists
    const existingUser = users.find(
      (u) => u.username === userForm.username && u.id !== editingUser?.id,
    );
    if (existingUser) {
      alert("Username sudah digunakan.");
      return;
    }

    if (editingUser) {
      // Edit existing user
      setUsers(
        users.map((u) => (u.id === editingUser.id ? { ...u, ...userForm } : u)),
      );
      alert("Pengguna berhasil diperbarui.");
    } else {
      // Add new user
      const newUser: User = {
        id: generateUniqueId(),
        currentShiftId: null,
        ...userForm,
      };
      setUsers([...users, newUser]);
      alert("Pengguna baru berhasil ditambahkan.");
    }

    setShowUserModal(false);
    setEditingUser(null);
    setUserForm({ username: "", password: "", role: "kasir" });
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      password: user.password,
      role: user.role,
    });
    setShowUserModal(true);
  };

  const handleDeleteUser = (userId: string) => {
    if (currentUser && currentUser.id === userId) {
      alert("Anda tidak dapat menghapus akun yang sedang digunakan.");
      return;
    }

    if (window.confirm("Apakah Anda yakin ingin menghapus pengguna ini?")) {
      setUsers(users.filter((u) => u.id !== userId));
      alert("Pengguna berhasil dihapus.");
    }
  };

  // Settings management
  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !settingsForm.storeName ||
      settingsForm.taxRate < 0 ||
      !settingsForm.currencySymbol
    ) {
      alert("Mohon isi semua field dengan benar.");
      return;
    }

    setSettings({
      ...settings,
      storeName: settingsForm.storeName,
      taxRate: settingsForm.taxRate,
      currencySymbol: settingsForm.currencySymbol,
    });

    alert("Pengaturan berhasil disimpan.");
  };

  // Initialize settings form when accessing settings
  useEffect(() => {
    if (activeModule === "settings") {
      setSettingsForm({
        storeName: settings.storeName,
        taxRate: settings.taxRate,
        currencySymbol: settings.currencySymbol,
      });
    }
  }, [activeModule, settings]);

  // Shift management
  const startShift = async () => {
    if (!currentUser) {
      alert("Anda harus login untuk memulai shift.");
      return;
    }

    if (currentShift && currentShift.status === "open") {
      alert("Anda sudah memiliki shift yang sedang berjalan.");
      return;
    }

    const initialCashStr = prompt("Masukkan Kas Awal Shift:", "0");
    const initialCash = parseFloat(initialCashStr || "0");

    if (isNaN(initialCash) || initialCash < 0) {
      alert("Kas awal harus berupa angka positif.");
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
      status: "open",
    };

    setShifts([...shifts, newShift]);
    setCurrentShift(newShift);

    // Update user's current shift ID
    const updatedUser = { ...currentUser, currentShiftId: newShift.id };
    setCurrentUser(updatedUser);
    setUsers(users.map((u) => (u.id === currentUser.id ? updatedUser : u)));

    alert(`Shift dimulai dengan kas awal ${formatCurrency(initialCash)}.`);
  };

  // End shift
  const endShift = async () => {
    if (!currentShift || currentShift.status !== "open") {
      alert("Tidak ada shift yang sedang berjalan untuk diakhiri.");
      return;
    }

    const salesTotal = currentShift.salesIds.reduce((total, saleId) => {
      const sale = sales.find(
        (s) => s.id === saleId && s.status === "completed",
      );
      return total + (sale ? sale.totalAmount : 0);
    }, 0);

    const expectedCash = currentShift.startCash + salesTotal;
    const finalCashStr = prompt(
      "Masukkan Kas Akhir Shift:",
      expectedCash.toString(),
    );
    const finalCash = parseFloat(finalCashStr || "0");

    if (isNaN(finalCash) || finalCash < 0) {
      alert("Kas akhir harus berupa angka positif.");
      return;
    }

    if (window.confirm("Apakah Anda yakin ingin mengakhiri shift ini?")) {
      const updatedShift = {
        ...currentShift,
        endTime: new Date().toISOString(),
        endCash: finalCash,
        status: "closed" as const,
      };

      setShifts(
        shifts.map((s) => (s.id === currentShift.id ? updatedShift : s)),
      );
      setCurrentShift(null);

      // Clear current shift from user
      if (currentUser) {
        const updatedUser = { ...currentUser, currentShiftId: null };
        setCurrentUser(updatedUser);
        setUsers(users.map((u) => (u.id === currentUser.id ? updatedUser : u)));
      }

      const discrepancy = finalCash - expectedCash;
      alert(
        `Shift berakhir.\nKas Awal: ${formatCurrency(currentShift.startCash)}\nTotal Penjualan: ${formatCurrency(salesTotal)}\nKas Diharapkan: ${formatCurrency(expectedCash)}\nKas Akhir: ${formatCurrency(finalCash)}\nSelisih: ${formatCurrency(discrepancy)}`,
      );
    }
  };

  // Get filtered sales for reports
  const getFilteredSales = () => {
    if (!reportStartDate && !reportEndDate) return sales;

    return sales.filter((sale) => {
      const saleDate = new Date(sale.date);
      const startDate = reportStartDate ? new Date(reportStartDate) : null;
      const endDate = reportEndDate ? new Date(reportEndDate) : null;

      if (startDate && saleDate < startDate) return false;
      if (endDate && saleDate > endDate) return false;

      return true;
    });
  };

  return (
    <div
      className="min-h-screen bg-gray-100"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Login Screen */}
      {isLoginVisible && (
        <div className="fixed inset-0 bg-gray-100 flex items-center justify-center z-50">
          <div className="bg-white p-12 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">
              Login POS
            </h2>
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Username:
                </label>
                <input
                  type="text"
                  name="username"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Password:
                </label>
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
              {allModules.map(
                (module) =>
                  hasModuleAccess(module.id) && (
                    <button
                      key={module.id}
                      onClick={() => setActiveModule(module.id)}
                      className={`flex flex-col items-center px-4 py-2 rounded-md text-sm transition-colors ${
                        activeModule === module.id
                          ? "bg-gray-700 text-white"
                          : "hover:bg-gray-700 hover:text-white"
                      }`}
                    >
                      <span className="text-xs">{module.name}</span>
                    </button>
                  ),
              )}
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
              <h1 className="text-3xl font-bold text-gray-900">
                {settings.storeName}
              </h1>
            </div>

            {/* Order Entry Module */}
            {activeModule === "order-entry" &&
              hasModuleAccess("order-entry") && (
                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                    Entri Pesanan
                  </h2>
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

                      <h3 className="text-xl font-semibold mb-3 text-gray-800">
                        Daftar Produk
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6 max-h-96 overflow-y-auto">
                        {products
                          .filter(
                            (product) =>
                              product.name
                                .toLowerCase()
                                .includes(productSearch.toLowerCase()) ||
                              product.id
                                .toLowerCase()
                                .includes(productSearch.toLowerCase()) ||
                              (product.barcode &&
                                product.barcode
                                  .toLowerCase()
                                  .includes(productSearch.toLowerCase())),
                          )
                          .map((product) => (
                            <div
                              key={product.id}
                              onClick={() => addToCart(product.id)}
                              className={`border border-gray-200 rounded-lg p-4 text-center cursor-pointer transition-all hover:shadow-md ${
                                product.stock <= 0
                                  ? "opacity-60 cursor-not-allowed bg-red-50"
                                  : "bg-white hover:transform hover:-translate-y-1"
                              }`}
                            >
                              <img
                                src={
                                  product.imageUrl ||
                                  "https://placehold.co/80x80/cccccc/333333?text=No+Img"
                                }
                                alt={product.name}
                                className="w-20 h-20 object-cover rounded-md mx-auto mb-3 border border-gray-200"
                                onError={(e) => {
                                  e.currentTarget.src =
                                    "https://placehold.co/80x80/cccccc/333333?text=No+Img";
                                }}
                              />
                              <div className="font-semibold text-gray-900 mb-1 text-sm">
                                {product.name}
                              </div>
                              <div className="text-sm text-indigo-600 font-medium">
                                {formatCurrency(product.price)}
                              </div>
                              <div
                                className={`text-xs ${product.stock <= 5 ? "text-red-500 font-bold" : "text-gray-500"}`}
                              >
                                Stok: {product.stock}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Cart and Payment */}
                    <div>
                      <h3 className="text-xl font-semibold mb-3 text-gray-800">
                        Keranjang Belanja
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-lg shadow-inner mb-4 max-h-80 overflow-y-auto">
                        <table className="min-w-full">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Produk
                              </th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Harga
                              </th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Qty
                              </th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Total
                              </th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Aksi
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white">
                            {cart.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={5}
                                  className="py-4 text-center text-gray-500"
                                >
                                  Keranjang kosong.
                                </td>
                              </tr>
                            ) : (
                              cart.map((item) => {
                                const itemTotal = item.quantity * item.price;
                                return (
                                  <tr
                                    key={item.productId}
                                    className="border-b border-gray-200"
                                  >
                                    <td className="px-2 py-2 text-sm">
                                      {item.name}
                                    </td>
                                    <td className="px-2 py-2 text-sm">
                                      {formatCurrency(item.price)}
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) =>
                                          updateCartQuantity(
                                            item.productId,
                                            parseInt(e.target.value),
                                          )
                                        }
                                        className="w-16 border rounded px-2 py-1 text-center text-sm"
                                      />
                                    </td>
                                    <td className="px-2 py-2 text-sm">
                                      {formatCurrency(itemTotal)}
                                    </td>
                                    <td className="px-2 py-2">
                                      <button
                                        onClick={() =>
                                          removeFromCart(item.productId)
                                        }
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
                          if (
                            cart.length > 0 &&
                            window.confirm(
                              "Apakah Anda yakin ingin mengosongkan keranjang?",
                            )
                          ) {
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
                          const { subtotal, taxAmount, finalTotal } =
                            getCartTotals();
                          const change =
                            paymentMethod === "cash"
                              ? Math.max(0, cashGiven - finalTotal)
                              : 0;

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
                                <label className="block text-gray-700 font-bold mb-2">
                                  Metode Pembayaran:
                                </label>
                                <select
                                  value={paymentMethod}
                                  onChange={(e) =>
                                    setPaymentMethod(
                                      e.target.value as
                                        | "cash"
                                        | "card"
                                        | "ewallet",
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                                >
                                  <option value="cash">Tunai</option>
                                  <option value="card">Kartu</option>
                                  <option value="ewallet">
                                    Dompet Digital
                                  </option>
                                </select>
                              </div>

                              {paymentMethod === "cash" && (
                                <div className="mb-4">
                                  <label className="block text-gray-700 font-bold mb-2">
                                    Uang Diberikan:
                                  </label>
                                  <input
                                    type="number"
                                    value={cashGiven}
                                    onChange={(e) =>
                                      setCashGiven(
                                        parseFloat(e.target.value) || 0,
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                                    placeholder="0"
                                  />
                                  <div className="flex justify-between font-bold text-lg mt-2">
                                    <span>Kembalian:</span>
                                    <span
                                      className={
                                        change >= 0
                                          ? "text-green-500"
                                          : "text-red-500"
                                      }
                                    >
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
            {activeModule === "stock-management" &&
              hasModuleAccess("stock-management") && (
                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                    Manajemen Stok
                  </h2>
                  <button
                    onClick={() => setShowProductModal(true)}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-indigo-700 transition duration-200 mb-4"
                  >
                    Tambah Produk Baru
                  </button>

                  <div className="bg-gray-50 p-4 rounded-lg shadow-inner overflow-x-auto">
                    <table className="min-w-full border-collapse">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Gambar
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Nama Produk
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Barcode
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Harga
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Stok
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="border border-gray-200 py-4 text-center text-gray-500"
                            >
                              Tidak ada produk. Tambahkan produk baru.
                            </td>
                          </tr>
                        ) : (
                          products.map((product) => (
                            <tr key={product.id} className="even:bg-gray-50">
                              <td className="border border-gray-200 px-3 py-2">
                                <img
                                  src={
                                    product.imageUrl ||
                                    "https://placehold.co/40x40/cccccc/333333?text=N/A"
                                  }
                                  alt={product.name}
                                  className="w-10 h-10 object-cover rounded-md"
                                  onError={(e) => {
                                    e.currentTarget.src =
                                      "https://placehold.co/40x40/cccccc/333333?text=N/A";
                                  }}
                                />
                              </td>
                              <td className="border border-gray-200 px-3 py-2 text-sm font-medium text-gray-900">
                                {product.name}
                              </td>
                              <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500">
                                {product.barcode || "-"}
                              </td>
                              <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500">
                                {formatCurrency(product.price)}
                              </td>
                              <td className="border border-gray-200 px-3 py-2 text-sm">
                                <span
                                  className={
                                    product.stock <= 5
                                      ? "text-red-500 font-bold"
                                      : "text-gray-500"
                                  }
                                >
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
                                  onClick={() =>
                                    handleDeleteProduct(product.id)
                                  }
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
            {activeModule === "customer-management" &&
              hasModuleAccess("customer-management") && (
                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                    Manajemen Pelanggan
                  </h2>
                  <button
                    onClick={() => setShowCustomerModal(true)}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-indigo-700 transition duration-200 mb-4"
                  >
                    Tambah Pelanggan Baru
                  </button>

                  <div className="bg-gray-50 p-4 rounded-lg shadow-inner overflow-x-auto">
                    <table className="min-w-full border-collapse">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Nama Pelanggan
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Email
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Telepon
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {customers.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="border border-gray-200 py-4 text-center text-gray-500"
                            >
                              Tidak ada pelanggan. Tambahkan pelanggan baru.
                            </td>
                          </tr>
                        ) : (
                          customers.map((customer) => (
                            <tr key={customer.id} className="even:bg-gray-50">
                              <td className="border border-gray-200 px-3 py-2 text-sm font-medium text-gray-900">
                                {customer.name}
                              </td>
                              <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500">
                                {customer.email || "-"}
                              </td>
                              <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500">
                                {customer.phone || "-"}
                              </td>
                              <td className="border border-gray-200 px-3 py-2 text-sm">
                                <button
                                  onClick={() => handleEditCustomer(customer)}
                                  className="text-indigo-600 hover:text-indigo-900 mr-4"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteCustomer(customer.id)
                                  }
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
            {activeModule === "reports" && hasModuleAccess("reports") && (
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                  Laporan
                </h2>

                <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow-inner">
                  <h3 className="text-xl font-semibold mb-3 text-gray-800">
                    Filter Laporan Penjualan
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-gray-700 font-bold mb-2">
                        Tanggal Mulai:
                      </label>
                      <input
                        type="date"
                        value={reportStartDate}
                        onChange={(e) => setReportStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-bold mb-2">
                        Tanggal Akhir:
                      </label>
                      <input
                        type="date"
                        value={reportEndDate}
                        onChange={(e) => setReportEndDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {(() => {
                    const filteredSales = getFilteredSales();
                    const completedSales = filteredSales.filter(
                      (s) => s.status === "completed",
                    );
                    const totalRevenue = completedSales.reduce(
                      (sum, sale) => sum + sale.totalAmount,
                      0,
                    );
                    const totalTransactions = completedSales.length;

                    return (
                      <div className="bg-white p-4 rounded-md shadow-sm text-gray-700 mb-4">
                        <h4 className="font-semibold mb-2">
                          Ringkasan Laporan
                        </h4>
                        <p>
                          Total Pendapatan:{" "}
                          <span className="font-bold text-green-600">
                            {formatCurrency(totalRevenue)}
                          </span>
                        </p>
                        <p>
                          Jumlah Transaksi:{" "}
                          <span className="font-bold">{totalTransactions}</span>
                        </p>
                        <p>
                          Rata-rata per Transaksi:{" "}
                          <span className="font-bold">
                            {formatCurrency(
                              totalTransactions > 0
                                ? totalRevenue / totalTransactions
                                : 0,
                            )}
                          </span>
                        </p>
                      </div>
                    );
                  })()}

                  <div className="bg-white p-4 rounded-lg shadow-inner overflow-x-auto">
                    <table className="min-w-full border-collapse">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            ID Penjualan
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Tanggal
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Total
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Metode Bayar
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredSales().length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="border border-gray-200 py-4 text-center text-gray-500"
                            >
                              Tidak ada data penjualan.
                            </td>
                          </tr>
                        ) : (
                          getFilteredSales()
                            .filter(
                              (sale, index, self) =>
                                self.findIndex((s) => s.id === sale.id) ===
                                index,
                            )
                            .sort(
                              (a, b) =>
                                new Date(b.date).getTime() -
                                new Date(a.date).getTime(),
                            )
                            .map((sale, index) => (
                              <tr
                                key={`${sale.id}-${index}`}
                                className="even:bg-gray-50"
                              >
                                <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500">
                                  {sale.id}
                                </td>
                                <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500">
                                  {new Date(sale.date).toLocaleString("id-ID")}
                                </td>
                                <td className="border border-gray-200 px-3 py-2 text-sm font-medium text-gray-900">
                                  {formatCurrency(sale.totalAmount)}
                                </td>
                                <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500">
                                  {sale.paymentMethod === "cash"
                                    ? "Tunai"
                                    : sale.paymentMethod === "card"
                                      ? "Kartu"
                                      : "Dompet Digital"}
                                </td>
                                <td className="border border-gray-200 px-3 py-2 text-sm">
                                  <span
                                    className={
                                      sale.status === "completed"
                                        ? "text-green-600 font-semibold"
                                        : "text-red-600 font-semibold"
                                    }
                                  >
                                    {sale.status === "completed"
                                      ? "Selesai"
                                      : "Dibatalkan"}
                                  </span>
                                </td>
                                <td className="border border-gray-200 px-3 py-2 text-sm">
                                  <button
                                    onClick={() => {
                                      setSelectedSale(sale);
                                      setShowSaleDetailModal(true);
                                    }}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    Detail
                                  </button>
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg shadow-inner">
                  <h3 className="text-xl font-semibold mb-3 text-gray-800">
                    Laporan Stok
                  </h3>
                  <div className="bg-white p-4 rounded-lg shadow-inner overflow-x-auto">
                    <table className="min-w-full border-collapse">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Nama Produk
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Stok Saat Ini
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Harga
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Nilai Stok
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {products
                          .sort((a, b) => a.stock - b.stock)
                          .map((product) => (
                            <tr key={product.id} className="even:bg-gray-50">
                              <td className="border border-gray-200 px-3 py-2 text-sm font-medium text-gray-900">
                                {product.name}
                              </td>
                              <td className="border border-gray-200 px-3 py-2 text-sm">
                                <span
                                  className={
                                    product.stock <= 5
                                      ? "text-red-500 font-bold"
                                      : "text-gray-500"
                                  }
                                >
                                  {product.stock}
                                </span>
                              </td>
                              <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500">
                                {formatCurrency(product.price)}
                              </td>
                              <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500">
                                {formatCurrency(product.price * product.stock)}
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
            {activeModule === "shift-management" &&
              hasModuleAccess("shift-management") && (
                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                    Manajemen Shift
                  </h2>
                  <div className="flex space-x-4 mb-6">
                    <button
                      onClick={startShift}
                      disabled={currentShift && currentShift.status === "open"}
                      className="bg-indigo-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
                    >
                      Mulai Shift Hari Ini
                    </button>
                    <button
                      onClick={endShift}
                      disabled={!currentShift || currentShift.status !== "open"}
                      className="bg-gray-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
                    >
                      Akhiri Shift
                    </button>
                  </div>

                  <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-4 rounded-md shadow-md mb-6">
                    {currentShift && currentShift.status === "open" ? (
                      <div>
                        <h3 className="text-xl font-bold mb-2">
                          Shift Aktif Saat Ini ({currentUser.username})
                        </h3>
                        <p>
                          <strong>ID Shift:</strong> {currentShift.id}
                        </p>
                        <p>
                          <strong>Waktu Mulai:</strong>{" "}
                          {new Date(currentShift.startTime).toLocaleString(
                            "id-ID",
                          )}
                        </p>
                        <p>
                          <strong>Kas Awal:</strong>{" "}
                          {formatCurrency(currentShift.startCash)}
                        </p>
                        <p>
                          <strong>Penjualan Saat Ini:</strong>{" "}
                          {currentShift.salesIds.length} transaksi
                        </p>
                        {(() => {
                          const salesTotal = currentShift.salesIds.reduce(
                            (total, saleId) => {
                              const sale = sales.find(
                                (s) =>
                                  s.id === saleId && s.status === "completed",
                              );
                              return total + (sale ? sale.totalAmount : 0);
                            },
                            0,
                          );
                          return (
                            <p>
                              <strong>Total Pendapatan:</strong>{" "}
                              {formatCurrency(salesTotal)}
                            </p>
                          );
                        })()}
                      </div>
                    ) : (
                      <p>
                        Tidak ada shift yang sedang berjalan. Klik "Mulai Shift
                        Hari Ini" untuk memulai.
                      </p>
                    )}
                  </div>

                  <h3 className="text-xl font-semibold mb-3 text-gray-800">
                    Riwayat Shift
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg shadow-inner overflow-x-auto">
                    <table className="min-w-full border-collapse">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            ID Shift
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Pengguna
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Waktu Mulai
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Kas Awal
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Total Penjualan
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {shifts.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="border border-gray-200 py-4 text-center text-gray-500"
                            >
                              Tidak ada riwayat shift.
                            </td>
                          </tr>
                        ) : (
                          [...shifts]
                            .sort(
                              (a, b) =>
                                new Date(b.startTime).getTime() -
                                new Date(a.startTime).getTime(),
                            )
                            .map((shift) => {
                              const user = users.find(
                                (u) => u.id === shift.userId,
                              );
                              const salesTotal = shift.salesIds.reduce(
                                (total, saleId) => {
                                  const sale = sales.find(
                                    (s) =>
                                      s.id === saleId &&
                                      s.status === "completed",
                                  );
                                  return total + (sale ? sale.totalAmount : 0);
                                },
                                0,
                              );
                              return (
                                <tr key={shift.id} className="even:bg-gray-50">
                                  <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500">
                                    {shift.id}
                                  </td>
                                  <td className="border border-gray-200 px-3 py-2 text-sm font-medium text-gray-900">
                                    {user?.username || "Unknown"}
                                  </td>
                                  <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500">
                                    {new Date(shift.startTime).toLocaleString(
                                      "id-ID",
                                    )}
                                  </td>
                                  <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500">
                                    {formatCurrency(shift.startCash)}
                                  </td>
                                  <td className="border border-gray-200 px-3 py-2 text-sm font-medium text-gray-900">
                                    {formatCurrency(salesTotal)}
                                  </td>
                                  <td className="border border-gray-200 px-3 py-2 text-sm">
                                    <span
                                      className={
                                        shift.status === "open"
                                          ? "text-blue-500"
                                          : "text-gray-500"
                                      }
                                    >
                                      {shift.status === "open"
                                        ? "Terbuka"
                                        : "Ditutup"}
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
            {activeModule === "settings" && hasModuleAccess("settings") && (
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                  Pengaturan
                </h2>
                <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                  <form onSubmit={handleSettingsSubmit} className="space-y-4">
                    <div>
                      <label className="block text-gray-700 font-bold mb-2">
                        Nama Toko:
                      </label>
                      <input
                        type="text"
                        value={settingsForm.storeName}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            storeName: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-bold mb-2">
                        Tarif Pajak (%):
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={settingsForm.taxRate}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            taxRate: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-bold mb-2">
                        Simbol Mata Uang:
                      </label>
                      <input
                        type="text"
                        maxLength={5}
                        value={settingsForm.currencySymbol}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            currencySymbol: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-indigo-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-indigo-700 transition duration-200"
                    >
                      Simpan Pengaturan
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* User Management Module */}
            {activeModule === "user-management" &&
              hasModuleAccess("user-management") && (
                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                    Manajemen Akun Pengguna
                  </h2>
                  <button
                    onClick={() => setShowUserModal(true)}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-indigo-700 transition duration-200 mb-4"
                  >
                    Tambah Pengguna Baru
                  </button>

                  <div className="bg-gray-50 p-4 rounded-lg shadow-inner overflow-x-auto">
                    <table className="min-w-full border-collapse">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Username
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Peran
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.length === 0 ? (
                          <tr>
                            <td
                              colSpan={3}
                              className="border border-gray-200 py-4 text-center text-gray-500"
                            >
                              Tidak ada pengguna. Tambahkan pengguna baru.
                            </td>
                          </tr>
                        ) : (
                          users.map((user) => (
                            <tr key={user.id} className="even:bg-gray-50">
                              <td className="border border-gray-200 px-3 py-2 text-sm font-medium text-gray-900">
                                {user.username}
                              </td>
                              <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500 capitalize">
                                {user.role}
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
            {activeModule === "integration" &&
              hasModuleAccess("integration") && (
                <div className="text-center py-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                    Integrasi Eksternal
                  </h2>
                  <div
                    className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md"
                    role="alert"
                  >
                    <p className="font-bold">Modul ini akan datang!</p>
                    <p>
                      Fungsionalitas integrasi dengan sistem eksternal
                      (misalnya, akuntansi, e-commerce) akan tersedia di
                      pembaruan mendatang.
                    </p>
                  </div>
                </div>
              )}
          </main>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-gray-800">
              {editingProduct ? "Edit Produk" : "Tambah Produk Baru"}
            </h3>
            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Nama Produk:
                </label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) =>
                    setProductForm({ ...productForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Barcode (Opsional):
                </label>
                <input
                  type="text"
                  value={productForm.barcode}
                  onChange={(e) =>
                    setProductForm({ ...productForm, barcode: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  URL Gambar (Opsional):
                </label>
                <input
                  type="url"
                  value={productForm.imageUrl}
                  onChange={(e) =>
                    setProductForm({ ...productForm, imageUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Harga:
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={productForm.price}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      price: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Stok:
                </label>
                <input
                  type="number"
                  min="0"
                  value={productForm.stock}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      stock: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-md font-semibold hover:bg-indigo-700 transition duration-200"
                >
                  Simpan Produk
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProductModal(false);
                    setEditingProduct(null);
                    setProductForm({
                      name: "",
                      barcode: "",
                      price: 0,
                      stock: 0,
                      imageUrl: "",
                    });
                  }}
                  className="flex-1 bg-gray-600 text-white py-2 rounded-md font-semibold hover:bg-gray-700 transition duration-200"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-gray-800">
              {editingCustomer ? "Edit Pelanggan" : "Tambah Pelanggan Baru"}
            </h3>
            <form onSubmit={handleCustomerSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Nama Pelanggan:
                </label>
                <input
                  type="text"
                  value={customerForm.name}
                  onChange={(e) =>
                    setCustomerForm({ ...customerForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Email (Opsional):
                </label>
                <input
                  type="email"
                  value={customerForm.email}
                  onChange={(e) =>
                    setCustomerForm({ ...customerForm, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Telepon (Opsional):
                </label>
                <input
                  type="tel"
                  value={customerForm.phone}
                  onChange={(e) =>
                    setCustomerForm({ ...customerForm, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-md font-semibold hover:bg-indigo-700 transition duration-200"
                >
                  Simpan Pelanggan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomerModal(false);
                    setEditingCustomer(null);
                    setCustomerForm({ name: "", email: "", phone: "" });
                  }}
                  className="flex-1 bg-gray-600 text-white py-2 rounded-md font-semibold hover:bg-gray-700 transition duration-200"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-gray-800">
              {editingUser ? "Edit Pengguna" : "Tambah Pengguna Baru"}
            </h3>
            <form onSubmit={handleUserSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Username:
                </label>
                <input
                  type="text"
                  value={userForm.username}
                  onChange={(e) =>
                    setUserForm({ ...userForm, username: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Password:
                </label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) =>
                    setUserForm({ ...userForm, password: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Peran:
                </label>
                <select
                  value={userForm.role}
                  onChange={(e) =>
                    setUserForm({
                      ...userForm,
                      role: e.target.value as
                        | "admin"
                        | "supervisor"
                        | "kasir"
                        | "staff",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                >
                  <option value="admin">Administrator</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="kasir">Kasir</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-md font-semibold hover:bg-indigo-700 transition duration-200"
                >
                  Simpan Pengguna
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUserModal(false);
                    setEditingUser(null);
                    setUserForm({ username: "", password: "", role: "kasir" });
                  }}
                  className="flex-1 bg-gray-600 text-white py-2 rounded-md font-semibold hover:bg-gray-700 transition duration-200"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sale Detail Modal */}
      {showSaleDetailModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4 text-gray-800">
              Detail Penjualan
            </h3>
            <div className="space-y-3 text-gray-700">
              <p>
                <strong>ID Penjualan:</strong> {selectedSale.id}
              </p>
              <p>
                <strong>Tanggal:</strong>{" "}
                {new Date(selectedSale.date).toLocaleString("id-ID")}
              </p>
              <p>
                <strong>Metode Pembayaran:</strong>{" "}
                {selectedSale.paymentMethod === "cash"
                  ? "Tunai"
                  : selectedSale.paymentMethod === "card"
                    ? "Kartu"
                    : "Dompet Digital"}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={
                    selectedSale.status === "completed"
                      ? "text-green-600 font-semibold"
                      : "text-red-600 font-semibold"
                  }
                >
                  {selectedSale.status === "completed"
                    ? "Selesai"
                    : "Dibatalkan"}
                </span>
              </p>

              <h4 className="font-semibold mt-4 mb-2">Item:</h4>
              <ul className="space-y-1">
                {selectedSale.items.map((item, index) => (
                  <li key={index} className="flex justify-between py-1">
                    <span>
                      {item.name} x {item.quantity}
                    </span>
                    <span>{formatCurrency(item.quantity * item.price)}</span>
                  </li>
                ))}
              </ul>

              <div className="border-t pt-2 mt-4">
                {(() => {
                  const subtotal = selectedSale.items.reduce(
                    (sum, item) => sum + item.quantity * item.price,
                    0,
                  );
                  const taxAmount = subtotal * (settings.taxRate / 100);
                  const finalTotal = subtotal + taxAmount;
                  const change =
                    selectedSale.paymentMethod === "cash"
                      ? selectedSale.cashGiven - finalTotal
                      : 0;

                  return (
                    <>
                      <p className="flex justify-between font-semibold">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </p>
                      <p className="flex justify-between font-semibold">
                        <span>Pajak ({settings.taxRate}%):</span>
                        <span>{formatCurrency(taxAmount)}</span>
                      </p>
                      <h3 className="flex justify-between text-xl font-bold mt-2">
                        <span>Total Akhir:</span>
                        <span>{formatCurrency(finalTotal)}</span>
                      </h3>
                      {selectedSale.paymentMethod === "cash" && (
                        <>
                          <p className="flex justify-between font-semibold">
                            <span>Tunai Diberikan:</span>
                            <span>
                              {formatCurrency(selectedSale.cashGiven)}
                            </span>
                          </p>
                          <p className="flex justify-between font-semibold">
                            <span>Kembalian:</span>
                            <span>{formatCurrency(change)}</span>
                          </p>
                        </>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
            <button
              onClick={() => {
                setShowSaleDetailModal(false);
                setSelectedSale(null);
              }}
              className="w-full bg-gray-600 text-white py-2 rounded-md font-semibold hover:bg-gray-700 transition duration-200 mt-6"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompletePOS;
