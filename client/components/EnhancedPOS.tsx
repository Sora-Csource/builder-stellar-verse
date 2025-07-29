import React, { useState, useEffect } from "react";
import { useModals } from "./EnhancedModals";
import {
  useKeyboardShortcuts,
  KeyboardShortcutsHelp,
} from "../hooks/useKeyboardShortcuts.tsx";
import { useOffline } from "../hooks/useOffline";

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
  price: number;
  stock: number;
  imageUrl?: string;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  loyaltyPoints: number;
  totalSpent: number;
  joinDate: string;
  tier: "Bronze" | "Silver" | "Gold" | "Platinum";
  isActive: boolean;
  lastVisit?: string;
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
  voidReason?: string;
  voidedBy?: string;
  voidedAt?: string;
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

interface OpenBill {
  id: string;
  customerName?: string;
  customerPhone?: string;
  tableNumber?: string;
  items: CartItem[];
  discountAmount: number;
  discountType: "percentage" | "amount";
  notes?: string;
  createdAt: string;
  createdBy: string;
  status: "held" | "resumed";
}

interface Expense {
  id: string;
  date: string;
  category:
    | "inventory"
    | "operations"
    | "marketing"
    | "utilities"
    | "salaries"
    | "rent"
    | "other";
  description: string;
  amount: number;
  supplier?: string;
  paymentMethod: "cash" | "card" | "transfer" | "check";
  receiptNumber?: string;
  notes?: string;
  createdBy: string;
  isRecurring?: boolean;
  recurringPeriod?: "daily" | "weekly" | "monthly" | "yearly";
  tags?: string[];
}

interface Settings {
  storeName: string;
  taxRate: number;
  currencySymbol: string;
  logo?: string;
  rolePermissions: Record<string, string[]>;
  // Financial settings
  taxType?: "inclusive" | "exclusive";
  maxDiscountPercent?: number;
  quickDiscountAmount?: number;
  quickDiscountPresets?: number[];
  serviceChargePercent?: number;
  enableServiceCharge?: boolean;
  // Backup settings
  autoBackupEnabled?: boolean;
  maxBackupFiles?: number;
  // Loyalty program settings
  loyaltyProgramEnabled?: boolean;
  pointsPerPurchase?: number; // Points per 1000 spent
  pointsRedemptionValue?: number; // 1 point = X rupiah
  tierThresholds?: {
    silver: number;
    gold: number;
    platinum: number;
  };
  tierBenefits?: {
    bronze: { pointsMultiplier: number; discountPercent: number };
    silver: { pointsMultiplier: number; discountPercent: number };
    gold: { pointsMultiplier: number; discountPercent: number };
    platinum: { pointsMultiplier: number; discountPercent: number };
  };
  // Sale ID format settings
  saleIdPrefix?: string;
  saleIdSuffix?: string;
  saleIdCounterLength?: number;
  saleIdUseDate?: boolean;
  saleIdDateFormat?: "YYYYMMDD" | "DDMMYYYY" | "MMDDYYYY";
  // Thermal printer settings
  thermalPrinterEnabled?: boolean;
  thermalPrinterWidth?: number;
  thermalPrinterIP?: string;
  thermalPrinterPort?: number;
  thermalPrinterConnection?: "network" | "bluetooth";
  bluetoothPrinterName?: string;
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
  const {
    showAlert,
    showConfirm,
    showPrompt,
    showSuccess,
    showLoading,
    hideLoading,
    Modals,
  } = useModals();

  // Offline functionality
  const { isOnline, getOfflineStatus, saveOfflineData, addOfflineSale } =
    useOffline();

  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [openBills, setOpenBills] = useState<OpenBill[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
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
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showOpenBillModal, setShowOpenBillModal] = useState(false);
  const [showHoldBillModal, setShowHoldBillModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedUserForPermissions, setSelectedUserForPermissions] =
    useState<User | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [selectedOpenBill, setSelectedOpenBill] = useState<OpenBill | null>(
    null,
  );

  // Sale counter for custom IDs
  const [saleCounter, setSaleCounter] = useState<number>(1);

  // Form states
  const [productSearch, setProductSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const [reportPaymentFilter, setReportPaymentFilter] = useState<string | null>(
    null,
  );
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "card" | "ewallet"
  >("cash");
  const [cashGiven, setCashGiven] = useState<number>(0);

  // Discount state
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<"percentage" | "amount">(
    "percentage",
  );

  // Notification system state
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      type: "info" | "warning" | "error" | "success";
      title: string;
      message: string;
      timestamp: Date;
      read: boolean;
    }>
  >([]);

  // Bluetooth printer state
  const [bluetoothDevice, setBluetoothDevice] =
    useState<BluetoothDevice | null>(null);
  const [bluetoothCharacteristic, setBluetoothCharacteristic] =
    useState<BluetoothRemoteGATTCharacteristic | null>(null);
  const [isBluetoothConnected, setIsBluetoothConnected] =
    useState<boolean>(false);

  // Product form state
  const [productForm, setProductForm] = useState({
    name: "",
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

  // Open bill form state
  const [openBillForm, setOpenBillForm] = useState({
    customerName: "",
    customerPhone: "",
    tableNumber: "",
    notes: "",
  });

  // Expense form state
  const [expenseForm, setExpenseForm] = useState({
    category: "other" as const,
    description: "",
    amount: 0,
    supplier: "",
    paymentMethod: "cash" as const,
    receiptNumber: "",
    notes: "",
    isRecurring: false,
    recurringPeriod: "monthly" as const,
    tags: [] as string[],
  });

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    storeName: "Crema POS",
    taxRate: 10,
    currencySymbol: "Rp",
    logo: "",
    // Financial settings
    taxType: "exclusive",
    maxDiscountPercent: 50,
    quickDiscountAmount: 5000,
    quickDiscountPresets: [5, 10, 15, 20],
    serviceChargePercent: 0,
    enableServiceCharge: false,
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
    customThankYouMessage: "Terima kasih atas pembelian Anda!",
    headerText: "",
    footerText: "",
    showLogo: true,
  });

  // Settings tab state
  const [activeSettingsTab, setActiveSettingsTab] = useState("general");

  // Reports tab state
  const [activeReportsTab, setActiveReportsTab] = useState("sales");

  // Settings state
  const [settings, setSettings] = useState<Settings>({
    storeName: "Crema POS",
    taxRate: 10,
    currencySymbol: "Rp",
    logo: "",
    // Financial settings defaults
    taxType: "exclusive",
    maxDiscountPercent: 50,
    quickDiscountAmount: 5000,
    quickDiscountPresets: [5, 10, 15, 20],
    serviceChargePercent: 0,
    enableServiceCharge: false,
    // Backup settings defaults
    autoBackupEnabled: false,
    maxBackupFiles: 7,
    // Loyalty program defaults
    loyaltyProgramEnabled: true,
    pointsPerPurchase: 1, // 1 point per 1000 spent
    pointsRedemptionValue: 1000, // 1 point = 1000 rupiah
    tierThresholds: {
      silver: 100000, // 100k spent
      gold: 500000, // 500k spent
      platinum: 1500000, // 1.5M spent
    },
    tierBenefits: {
      bronze: { pointsMultiplier: 1, discountPercent: 0 },
      silver: { pointsMultiplier: 1.2, discountPercent: 2 },
      gold: { pointsMultiplier: 1.5, discountPercent: 5 },
      platinum: { pointsMultiplier: 2, discountPercent: 10 },
    },
    // Sale ID format defaults
    saleIdPrefix: "TRX",
    saleIdSuffix: "",
    saleIdCounterLength: 4,
    saleIdUseDate: true,
    saleIdDateFormat: "YYYYMMDD",
    // Thermal printer defaults
    thermalPrinterEnabled: false,
    thermalPrinterWidth: 58, // 58mm thermal printer
    thermalPrinterIP: "192.168.1.100",
    thermalPrinterPort: 9100,
    thermalPrinterConnection: "network",
    bluetoothPrinterName: "",
    rolePermissions: {
      admin: [
        "order-entry",
        "stock-management",
        "stock-management.add",
        "stock-management.edit",
        "stock-management.delete",
        "customer-management",
        "customer-management.add",
        "customer-management.edit",
        "customer-management.delete",
        "expense-management",
        "expense-management.add",
        "expense-management.edit",
        "expense-management.delete",
        "expense-management.view",
        "reports",
        "reports.sales",
        "reports.shifts",
        "reports.stock",
        "reports.export",
        "shift-management",
        "shift-management.start",
        "shift-management.end",
        "settings",
        "settings.general",
        "settings.financial",
        "settings.printer",
        "settings.backup",
        "integration",
        "user-management",
        "user-management.add",
        "user-management.edit",
        "user-management.delete",
        "user-management.permissions",
      ],
      supervisor: [
        "order-entry",
        "stock-management",
        "stock-management.add",
        "stock-management.edit",
        "customer-management",
        "customer-management.add",
        "customer-management.edit",
        "expense-management",
        "expense-management.add",
        "expense-management.edit",
        "expense-management.view",
        "reports",
        "reports.sales",
        "reports.shifts",
        "reports.stock",
        "shift-management",
        "shift-management.start",
        "shift-management.end",
        "user-management",
        "user-management.add",
        "user-management.edit",
      ],
      kasir: [
        "order-entry",
        "shift-management",
        "shift-management.start",
        "shift-management.end",
        "expense-management.view",
        "reports",
        "reports.sales",
        "reports.shifts",
      ],
      staff: ["order-entry", "reports", "reports.sales"],
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
      headerText: "",
      footerText: "",
      showLogo: true,
    },
  });

  // Available modules
  const allModules = [
    { id: "order-entry", name: "Pesanan" },
    { id: "stock-management", name: "Stok" },
    { id: "customer-management", name: "Pelanggan" },
    { id: "expense-management", name: "Pengeluaran" },
    { id: "reports", name: "Laporan" },
    { id: "shift-management", name: "Shift" },
    { id: "settings", name: "Pengaturan" },
    { id: "integration", name: "Integrasi" },
    { id: "user-management", name: "Akun" },
  ];

  // Utility functions
  const generateUniqueId = () => {
    return "id-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
  };

  // Notification functions
  const addNotification = (
    type: "info" | "warning" | "error" | "success",
    title: string,
    message: string,
  ) => {
    const newNotification = {
      id: generateUniqueId(),
      type,
      title,
      message,
      timestamp: new Date(),
      read: false,
    };
    setNotifications((prev) => [newNotification, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)),
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const getUnreadCount = () => {
    return notifications.filter((n) => !n.read).length;
  };

  // Monitor stock levels and create notifications
  useEffect(() => {
    const outOfStockProducts = products.filter((p) => p.stock === 0);
    const lowStockProducts = products.filter(
      (p) => p.stock > 0 && p.stock <= 5,
    );

    // Clear existing stock notifications
    setNotifications((prev) =>
      prev.filter(
        (n) =>
          !n.message.includes("stok habis") &&
          !n.message.includes("stok rendah"),
      ),
    );

    // Add out of stock notifications
    if (outOfStockProducts.length > 0) {
      addNotification(
        "error",
        "Produk Stok Habis",
        `${outOfStockProducts.length} produk kehabisan stok: ${outOfStockProducts.map((p) => p.name).join(", ")}`,
      );
    }

    // Add low stock notifications
    if (lowStockProducts.length > 0) {
      addNotification(
        "warning",
        "Stok Rendah",
        `${lowStockProducts.length} produk dengan stok rendah: ${lowStockProducts.map((p) => `${p.name} (${p.stock})`).join(", ")}`,
      );
    }
  }, [products]);

  // Monitor online status and create notifications
  useEffect(() => {
    // Clear existing online/offline notifications
    setNotifications((prev) =>
      prev.filter(
        (n) =>
          !n.message.includes("internet") &&
          !n.message.includes("online") &&
          !n.message.includes("offline"),
      ),
    );

    if (isOnline) {
      addNotification("success", "Status Koneksi", "Terhubung ke internet");
    } else {
      addNotification(
        "warning",
        "Status Koneksi",
        "Mode offline - Data akan disinkronkan saat online",
      );
    }
  }, [isOnline]);

  // Click outside handler for notifications
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (
        showNotifications &&
        !target.closest(".notification-dropdown") &&
        !target.closest(".notification-button")
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

  // Sample data initialization
  const initializeSampleData = () => {
    if (products.length === 0) {
      const sampleProducts: Product[] = [
        {
          id: "prod-001",
          name: "Kopi Americano",
          price: 25000,
          stock: 50,
          imageUrl:
            "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=300&fit=crop",
        },
        {
          id: "prod-002",
          name: "Cappuccino",
          price: 30000,
          stock: 30,
          imageUrl:
            "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=300&h=300&fit=crop",
        },
        {
          id: "prod-003",
          name: "Latte",
          price: 32000,
          stock: 25,
          imageUrl:
            "https://images.unsplash.com/photo-1561047029-3000c68339ca?w=300&h=300&fit=crop",
        },
        {
          id: "prod-004",
          name: "Croissant",
          price: 15000,
          stock: 20,
          imageUrl:
            "https://images.unsplash.com/photo-1555507036-ab794f575e8c?w=300&h=300&fit=crop",
        },
        {
          id: "prod-005",
          name: "Sandwich",
          price: 45000,
          stock: 15,
          imageUrl:
            "https://images.unsplash.com/photo-1553909489-cd47e0ef937f?w=300&h=300&fit=crop",
        },
        {
          id: "prod-006",
          name: "Matcha Latte",
          price: 35000,
          stock: 3, // Low stock for testing alert
          imageUrl:
            "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=300&h=300&fit=crop",
        },
        {
          id: "prod-007",
          name: "Espresso",
          price: 20000,
          stock: 2, // Low stock for testing alert
          imageUrl:
            "https://images.unsplash.com/photo-1610889556528-9a770e32642f?w=300&h=300&fit=crop",
        },
        {
          id: "prod-008",
          name: "Cake Slice",
          price: 35000,
          stock: 0, // Out of stock
          imageUrl:
            "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&h=300&fit=crop",
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
        {
          id: "cust-004",
          name: "Maya Sari",
          email: "maya.sari@email.com",
          phone: "081234567893",
        },
        {
          id: "cust-005",
          name: "Andi Pratama",
          email: "andi.pratama@email.com",
          phone: "081234567894",
        },
      ];
      setCustomers(sampleCustomers);
    }
  };

  const generateShiftId = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");
    const hour = now.getHours().toString().padStart(2, "0");
    const minute = now.getMinutes().toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, "0");

    return `SH${year}${month}${day}-${hour}${minute}-${random}`;
  };

  const formatCurrency = (amount: number) => {
    const numAmount = Number(amount);
    if (isNaN(numAmount)) return `${settings.currencySymbol} 0`;
    return `${settings.currencySymbol} ${numAmount.toLocaleString("id-ID")}`;
  };

  // Receipt generation
  const generateReceiptHTML = (
    sale: Sale,
    useFormSettings: boolean = false,
  ) => {
    const receiptSettings = useFormSettings
      ? receiptSettingsForm
      : settings.receiptSettings;
    const saleDate = new Date(sale.date).toLocaleString("id-ID");
    const subtotal = sale.items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0,
    );
    const taxAmount = subtotal * (settings.taxRate / 100);
    const finalTotal = subtotal + taxAmount;
    const cashGiven = sale.paymentMethod === "cash" ? sale.cashGiven : 0;
    const change = sale.paymentMethod === "cash" ? cashGiven - finalTotal : 0;

    let itemsHtml = "";
    if (receiptSettings.showItemTotals) {
      sale.items.forEach((item) => {
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
          ${
            receiptSettings.headerText
              ? `
            <div class="header center">
              <p>${receiptSettings.headerText}</p>
            </div>
            <div class="line"></div>
          `
              : ""
          }

          ${
            receiptSettings.showLogo && settings.logo
              ? `
            <div class="center" style="margin-bottom: 10px;">
              <img src="${settings.logo}" alt="Logo" style="max-width: 100px; max-height: 100px; object-fit: contain;">
            </div>
          `
              : ""
          }

          ${
            receiptSettings.showStoreName
              ? `
            <div class="header center">
              <h2 class="bold">${settings.storeName}</h2>
              ${receiptSettings.showDateTime ? `<p>${saleDate}</p>` : ""}
              ${receiptSettings.showTransactionId ? `<p>ID: ${sale.id}</p>` : ""}
            </div>
            <div class="line"></div>
          `
              : ""
          }

          ${
            receiptSettings.showItemTotals
              ? `
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
          `
              : ""
          }

          <table>
            ${
              receiptSettings.showSubtotal
                ? `
              <tr>
                <td>Subtotal:</td>
                <td class="right bold">${formatCurrency(subtotal)}</td>
              </tr>
            `
                : ""
            }
            ${
              receiptSettings.showTax
                ? `
              <tr>
                <td>Pajak (${settings.taxRate}%):</td>
                <td class="right bold">${formatCurrency(taxAmount)}</td>
              </tr>
            `
                : ""
            }
            <tr>
              <td class="bold">TOTAL:</td>
              <td class="right bold">${formatCurrency(finalTotal)}</td>
            </tr>
            ${
              receiptSettings.showChange && sale.paymentMethod === "cash"
                ? `
              <tr>
                <td>Tunai:</td>
                <td class="right">${formatCurrency(cashGiven)}</td>
              </tr>
              <tr>
                <td class="bold">Kembalian:</td>
                <td class="right bold">${formatCurrency(change)}</td>
              </tr>
            `
                : ""
            }
            ${
              receiptSettings.showPaymentMethod
                ? `
              <tr>
                <td>Pembayaran:</td>
                <td class="right">${sale.paymentMethod === "cash" ? "Tunai" : sale.paymentMethod === "card" ? "Kartu" : "E-Wallet"}</td>
              </tr>
            `
                : ""
            }
          </table>

          ${
            receiptSettings.showThankYouMessage
              ? `
            <div class="line"></div>
            <div class="footer center">
              <p class="bold">${receiptSettings.customThankYouMessage}</p>
            </div>
          `
              : ""
          }

          ${
            receiptSettings.footerText
              ? `
            <div class="footer center">
              <p>${receiptSettings.footerText}</p>
            </div>
          `
              : ""
          }
        </div>
      </body>
      </html>
    `;
  };

  // Print receipt function
  const printReceipt = (sale: Sale) => {
    if (
      settings.thermalPrinterEnabled &&
      settings.thermalPrinterConnection === "bluetooth" &&
      isBluetoothConnected
    ) {
      printReceiptBluetooth(sale);
    } else {
      const receiptHTML = generateReceiptHTML(sale);
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(receiptHTML);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        setTimeout(() => {
          printWindow.close();
        }, 100);
      } else {
        showAlert(
          "Kesalahan Browser",
          "Tidak dapat membuka jendela cetak. Pastikan pop-up diizinkan untuk situs ini.",
          "error",
        );
      }
    }
  };

  // Bluetooth printer functions
  const connectBluetoothPrinter = async () => {
    try {
      if (!navigator.bluetooth) {
        showAlert(
          "Bluetooth Tidak Didukung",
          "Browser Anda tidak mendukung Web Bluetooth API. Gunakan Chrome atau Edge terbaru.",
          "error",
        );
        return;
      }

      showLoading("Mencari printer Bluetooth...");

      // Request Bluetooth device
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: ["000018f0-0000-1000-8000-00805f9b34fb"] }, // Serial port service
          { namePrefix: "POS" },
          { namePrefix: "Thermal" },
          { namePrefix: "Receipt" },
        ],
        optionalServices: ["000018f0-0000-1000-8000-00805f9b34fb"],
      });

      hideLoading();

      if (!device) {
        showAlert(
          "Tidak Ada Device",
          "Tidak ada printer Bluetooth ditemukan.",
          "warning",
        );
        return;
      }

      showLoading("Menghubungkan ke printer...");

      // Connect to GATT server
      const server = await device.gatt?.connect();
      if (!server) {
        hideLoading();
        showAlert(
          "Koneksi Gagal",
          "Tidak dapat terhubung ke GATT server.",
          "error",
        );
        return;
      }

      // Get service and characteristic
      const service = await server.getPrimaryService(
        "000018f0-0000-1000-8000-00805f9b34fb",
      );
      const characteristic = await service.getCharacteristic(
        "00002af1-0000-1000-8000-00805f9b34fb",
      );

      setBluetoothDevice(device);
      setBluetoothCharacteristic(characteristic);
      setIsBluetoothConnected(true);

      // Update settings with device name
      setSettings((prev) => ({
        ...prev,
        bluetoothPrinterName: device.name || "Unknown Device",
      }));

      hideLoading();
      addNotification(
        "success",
        "Bluetooth Printer",
        `Terhubung ke printer: ${device.name || "Unknown Device"}`,
      );

      // Listen for disconnection
      device.addEventListener("gattserverdisconnected", () => {
        setIsBluetoothConnected(false);
        setBluetoothDevice(null);
        setBluetoothCharacteristic(null);
        addNotification(
          "warning",
          "Bluetooth Printer",
          "Printer terputus dari koneksi",
        );
      });
    } catch (error) {
      hideLoading();
      console.error("Bluetooth connection error:", error);
      showAlert(
        "Koneksi Bluetooth Gagal",
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        "error",
      );
    }
  };

  const disconnectBluetoothPrinter = async () => {
    try {
      if (bluetoothDevice && bluetoothDevice.gatt?.connected) {
        await bluetoothDevice.gatt.disconnect();
      }
      setBluetoothDevice(null);
      setBluetoothCharacteristic(null);
      setIsBluetoothConnected(false);
      addNotification("info", "Bluetooth Printer", "Printer berhasil diputus");
    } catch (error) {
      console.error("Bluetooth disconnection error:", error);
      showAlert("Error", "Gagal memutus koneksi printer", "error");
    }
  };

  const generateESCPOSCommands = (sale: Sale): Uint8Array => {
    const commands: number[] = [];
    const encoder = new TextEncoder();

    // ESC/POS commands
    const ESC = 0x1b;
    const GS = 0x1d;

    // Initialize printer
    commands.push(ESC, 0x40);

    // Set text alignment to center
    commands.push(ESC, 0x61, 0x01);

    // Store name and header
    if (settings.receiptSettings.showStoreName) {
      commands.push(...Array.from(encoder.encode(`${settings.storeName}\n`)));
      commands.push(...Array.from(encoder.encode("=" + "=".repeat(30) + "\n")));
    }

    // Date and transaction ID
    if (settings.receiptSettings.showDateTime) {
      const saleDate = new Date(sale.date).toLocaleString("id-ID");
      commands.push(...Array.from(encoder.encode(`${saleDate}\n`)));
    }

    if (settings.receiptSettings.showTransactionId) {
      commands.push(...Array.from(encoder.encode(`ID: ${sale.id}\n`)));
    }

    commands.push(...Array.from(encoder.encode("=" + "=".repeat(30) + "\n")));

    // Set text alignment to left
    commands.push(ESC, 0x61, 0x00);

    // Items
    if (settings.receiptSettings.showItemTotals) {
      sale.items.forEach((item) => {
        const itemTotal = item.quantity * item.price;
        const itemLine = `${item.name} x${item.quantity}\n  ${formatCurrency(itemTotal)}\n`;
        commands.push(...Array.from(encoder.encode(itemLine)));
      });
    }

    commands.push(...Array.from(encoder.encode("-" + "-".repeat(30) + "\n")));

    // Totals
    const subtotal = sale.items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0,
    );
    const taxAmount = subtotal * (settings.taxRate / 100);
    const finalTotal = subtotal + taxAmount;

    if (settings.receiptSettings.showSubtotal) {
      commands.push(
        ...Array.from(
          encoder.encode(`Subtotal: ${formatCurrency(subtotal)}\n`),
        ),
      );
    }

    if (settings.receiptSettings.showTax) {
      commands.push(
        ...Array.from(
          encoder.encode(
            `Pajak (${settings.taxRate}%): ${formatCurrency(taxAmount)}\n`,
          ),
        ),
      );
    }

    // Bold total
    commands.push(ESC, 0x45, 0x01); // Bold on
    commands.push(
      ...Array.from(encoder.encode(`TOTAL: ${formatCurrency(finalTotal)}\n`)),
    );
    commands.push(ESC, 0x45, 0x00); // Bold off

    // Payment info
    if (settings.receiptSettings.showPaymentMethod) {
      const paymentText =
        sale.paymentMethod === "cash"
          ? "Tunai"
          : sale.paymentMethod === "card"
            ? "Kartu"
            : "E-Wallet";
      commands.push(
        ...Array.from(encoder.encode(`Pembayaran: ${paymentText}\n`)),
      );
    }

    if (settings.receiptSettings.showChange && sale.paymentMethod === "cash") {
      const change = sale.cashGiven - finalTotal;
      commands.push(
        ...Array.from(
          encoder.encode(`Tunai: ${formatCurrency(sale.cashGiven)}\n`),
        ),
      );
      commands.push(
        ...Array.from(encoder.encode(`Kembalian: ${formatCurrency(change)}\n`)),
      );
    }

    // Thank you message
    if (settings.receiptSettings.showThankYouMessage) {
      commands.push(ESC, 0x61, 0x01); // Center alignment
      commands.push(
        ...Array.from(
          encoder.encode(
            `\n${settings.receiptSettings.customThankYouMessage}\n`,
          ),
        ),
      );
    }

    // Cut paper
    commands.push(GS, 0x56, 0x42, 0x00);

    // Line feeds
    commands.push(0x0a, 0x0a, 0x0a);

    return new Uint8Array(commands);
  };

  const printReceiptBluetooth = async (sale: Sale) => {
    try {
      if (!bluetoothCharacteristic || !isBluetoothConnected) {
        showAlert(
          "Printer Tidak Terhubung",
          "Hubungkan printer Bluetooth terlebih dahulu.",
          "warning",
        );
        return;
      }

      showLoading("Mencetak struk...");

      const escposData = generateESCPOSCommands(sale);

      // Send data in chunks (Bluetooth has size limitations)
      const chunkSize = 20;
      for (let i = 0; i < escposData.length; i += chunkSize) {
        const chunk = escposData.slice(i, i + chunkSize);
        await bluetoothCharacteristic.writeValue(chunk);
        // Small delay between chunks
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      hideLoading();
      showSuccess("Berhasil", "Struk berhasil dicetak via Bluetooth", false);
    } catch (error) {
      hideLoading();
      console.error("Bluetooth printing error:", error);
      showAlert(
        "Gagal Mencetak",
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        "error",
      );
    }
  };

  const testBluetoothPrint = async () => {
    try {
      if (!bluetoothCharacteristic || !isBluetoothConnected) {
        showAlert(
          "Printer Tidak Terhubung",
          "Hubungkan printer Bluetooth terlebih dahulu.",
          "warning",
        );
        return;
      }

      showLoading("Mencetak test page...");

      const encoder = new TextEncoder();
      const testData = encoder.encode(
        `\n\nTEST PRINT\n${settings.storeName}\n${new Date().toLocaleString("id-ID")}\n\nPrinter Bluetooth OK!\n\n\n`,
      );

      await bluetoothCharacteristic.writeValue(testData);

      hideLoading();
      showSuccess(
        "Test Print",
        "Test print berhasil dikirim ke printer",
        false,
      );
    } catch (error) {
      hideLoading();
      console.error("Test print error:", error);
      showAlert(
        "Test Print Gagal",
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        "error",
      );
    }
  };

  // Export functions
  const exportToCSV = (
    data: any[],
    filename: string,
    customHeaders?: string[],
  ) => {
    if (data.length === 0) return;

    // Escape CSV values and wrap in quotes if needed
    const escapeCSVValue = (value: any) => {
      const str = String(value || "");
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = customHeaders || Object.keys(data[0]);
    const headerRow = headers.map(escapeCSVValue).join(",");
    const rows = data
      .map((row) => headers.map((key) => escapeCSVValue(row[key])).join(","))
      .join("\n");

    // Add UTF-8 BOM for proper Excel support
    const csvContent = `\uFEFF${headerRow}\n${rows}`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Get low stock products
  const getLowStockProducts = () => {
    return products.filter(
      (product) => product.stock <= 5 && product.stock > 0,
    );
  };

  // Get out of stock products
  const getOutOfStockProducts = () => {
    return products.filter((product) => product.stock === 0);
  };

  // Open bill management
  const holdCurrentBill = () => {
    if (cart.length === 0) {
      showAlert(
        "Keranjang Kosong",
        "Tidak ada item di keranjang untuk disimpan.",
        "warning",
      );
      return;
    }

    if (!currentUser || !currentShift) {
      showAlert(
        "Session Required",
        "Anda harus login dan memulai shift untuk menyimpan bill.",
        "warning",
      );
      return;
    }

    setShowHoldBillModal(true);
  };

  const saveHeldBill = () => {
    const newOpenBill: OpenBill = {
      id: generateUniqueId(),
      customerName: openBillForm.customerName,
      customerPhone: openBillForm.customerPhone,
      tableNumber: openBillForm.tableNumber,
      items: [...cart],
      discountAmount,
      discountType,
      notes: openBillForm.notes,
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.id || "",
      status: "held",
    };

    setOpenBills([...openBills, newOpenBill]);

    // Clear current cart
    setCart([]);
    setDiscountAmount(0);
    setDiscountType("percentage");

    // Reset form
    setOpenBillForm({
      customerName: "",
      customerPhone: "",
      tableNumber: "",
      notes: "",
    });

    setShowHoldBillModal(false);

    addNotification(
      "success",
      "Bill Tersimpan",
      `Bill untuk ${newOpenBill.customerName || "Customer"} berhasil disimpan`,
    );
  };

  const resumeOpenBill = (billId: string) => {
    const bill = openBills.find((b) => b.id === billId);
    if (!bill) {
      showAlert(
        "Bill Tidak Ditemukan",
        "Bill yang dipilih tidak ditemukan.",
        "error",
      );
      return;
    }

    // Check if current cart has items
    if (cart.length > 0) {
      showAlert(
        "Keranjang Berisi Item",
        "Selesaikan atau simpan transaksi saat ini sebelum membuka bill lain.",
        "warning",
      );
      return;
    }

    // Load bill into current cart
    setCart([...bill.items]);
    setDiscountAmount(bill.discountAmount);
    setDiscountType(bill.discountType);

    // Update bill status
    setOpenBills(
      openBills.map((b) =>
        b.id === billId ? { ...b, status: "resumed" as const } : b,
      ),
    );

    setShowOpenBillModal(false);
    addNotification(
      "info",
      "Bill Dibuka",
      `Bill untuk ${bill.customerName || "Customer"} berhasil dibuka`,
    );
  };

  const deleteOpenBill = async (billId: string) => {
    const confirmed = await showConfirm(
      "Hapus Bill",
      "Apakah Anda yakin ingin menghapus bill ini? Aksi ini tidak dapat dibatalkan.",
      "danger",
    );

    if (confirmed) {
      setOpenBills(openBills.filter((b) => b.id !== billId));
      addNotification("info", "Bill Dihapus", "Bill berhasil dihapus");
    }
  };

  const getOpenBillTotal = (bill: OpenBill) => {
    const subtotal = bill.items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0,
    );

    let discountValue = 0;
    if (bill.discountType === "percentage") {
      discountValue = (subtotal * bill.discountAmount) / 100;
    } else {
      discountValue = bill.discountAmount;
    }

    const maxDiscount = (subtotal * (settings.maxDiscountPercent || 50)) / 100;
    discountValue = Math.min(discountValue, maxDiscount);
    discountValue = Math.max(0, discountValue);

    const subtotalAfterDiscount = subtotal - discountValue;
    const taxAmount = subtotalAfterDiscount * (settings.taxRate / 100);
    const finalTotal = subtotalAfterDiscount + taxAmount;

    return {
      subtotal,
      discountValue,
      subtotalAfterDiscount,
      taxAmount,
      finalTotal,
    };
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
          openBills,
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
        setOpenBills(parsedData.openBills || []);
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
      shifts.length > 0 ||
      openBills.length > 0
    ) {
      saveData();
    }
  }, [
    users,
    products,
    customers,
    sales,
    shifts,
    openBills,
    settings,
    currentUser,
  ]);

  useEffect(() => {
    initializeSampleData();
  }, []);

  // Keyboard shortcuts integration
  useKeyboardShortcuts({
    onOpenOrderEntry: () => setActiveModule("order-entry"),
    onOpenStockManagement: () => setActiveModule("stock-management"),
    onOpenCustomerManagement: () => setActiveModule("customer-management"),
    onOpenReports: () => setActiveModule("reports"),
    onOpenShiftManagement: () => setActiveModule("shift-management"),
    onOpenSettings: () => setActiveModule("settings"),
    onProcessPayment: () => {
      if (activeModule === "order-entry" && cart.length > 0) {
        processPayment();
      }
    },
    onClearCart: () => {
      if (activeModule === "order-entry" && cart.length > 0) {
        setCart([]);
      }
    },
    onAddProduct: () => {
      if (activeModule === "stock-management") {
        setShowProductModal(true);
      }
    },
    onAddCustomer: () => {
      if (activeModule === "customer-management") {
        setShowCustomerModal(true);
      }
    },
    onLogout: () => handleLogout(),
    onSearch: () => {
      // Focus search input if available
      const searchInput = document.querySelector(
        'input[placeholder*="Cari"]',
      ) as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    },
  });

  // Show alerts for low stock
  useEffect(() => {
    if (products.length > 0) {
      const lowStock = getLowStockProducts();
      const outOfStock = getOutOfStockProducts();

      if (outOfStock.length > 0) {
        const outOfStockNames = outOfStock.map((p) => p.name).join(", ");
        console.warn(`Produk habis: ${outOfStockNames}`);
      }

      if (lowStock.length > 0) {
        const lowStockNames = lowStock
          .map((p) => `${p.name} (${p.stock})`)
          .join(", ");
        console.warn(`Stok rendah: ${lowStockNames}`);
      }
    }
  }, [products]);

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
      showAlert("Login Gagal", "Username atau password salah.", "error");
    }
  };

  const handleLogout = async () => {
    const confirmed = await showConfirm(
      "Konfirmasi Logout",
      "Apakah Anda yakin ingin keluar?",
      "warning",
    );
    if (confirmed) {
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

  // Submenu permission checker
  const hasSubmenuAccess = (moduleId: string, submenuId: string) => {
    if (!currentUser) return false;
    const allowedModules = settings.rolePermissions[currentUser.role] || [];
    const fullPermission = `${moduleId}.${submenuId}`;
    // Check if has specific submenu permission or full module access
    return (
      allowedModules.includes(fullPermission) ||
      allowedModules.includes(moduleId)
    );
  };

  // Cart functions
  const addToCart = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) {
      showAlert("Produk Tidak Ditemukan", "Produk tidak ditemukan.", "error");
      return;
    }

    if (product.stock <= 0) {
      showAlert(
        "Stok Habis",
        `Stok ${product.name} saat ini kosong.`,
        "warning",
      );
      return;
    }

    if (!currentShift || currentShift.status !== "open") {
      showAlert(
        "Shift Diperlukan",
        "Anda harus memulai shift untuk menambahkan produk ke keranjang.",
        "warning",
      );
      return;
    }

    const existingItem = cart.find((item) => item.productId === productId);
    if (existingItem) {
      if (existingItem.quantity + 1 > product.stock) {
        showAlert(
          "Stok Tidak Cukup",
          `Hanya ada ${product.stock} unit ${product.name} yang tersedia.`,
          "warning",
        );
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

    // Calculate discount
    let discountValue = 0;
    if (discountType === "percentage") {
      discountValue = (subtotal * discountAmount) / 100;
    } else {
      discountValue = discountAmount;
    }

    // Apply discount limits
    const maxDiscount = (subtotal * (settings.maxDiscountPercent || 50)) / 100;
    discountValue = Math.min(discountValue, maxDiscount);
    discountValue = Math.max(0, discountValue);

    const subtotalAfterDiscount = subtotal - discountValue;
    const taxAmount = subtotalAfterDiscount * (settings.taxRate / 100);
    const finalTotal = subtotalAfterDiscount + taxAmount;

    return {
      subtotal,
      discountValue,
      subtotalAfterDiscount,
      taxAmount,
      finalTotal,
    };
  };

  // Process payment
  const processPayment = async () => {
    if (cart.length === 0) {
      showAlert(
        "Keranjang Kosong",
        "Tidak ada item di keranjang untuk diproses.",
        "warning",
      );
      return;
    }

    if (!currentShift || currentShift.status !== "open") {
      showAlert(
        "Shift Diperlukan",
        "Anda harus memulai shift untuk memproses penjualan.",
        "warning",
      );
      return;
    }

    const { finalTotal } = getCartTotals();

    if (paymentMethod === "cash" && cashGiven < finalTotal) {
      showAlert(
        "Pembayaran Kurang",
        "Jumlah uang yang diberikan tidak mencukupi.",
        "error",
      );
      return;
    }

    const confirmed = await showConfirm(
      "Konfirmasi Pembayaran",
      `Total Pembayaran: ${formatCurrency(finalTotal)}. Lanjutkan pembayaran?`,
      "info",
    );
    if (confirmed) {
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

      // Process loyalty points if customer is selected
      if (selectedCustomer && settings.loyaltyProgramEnabled) {
        updateCustomerLoyalty(selectedCustomer.id, finalTotal);

        const pointsEarned = calculateLoyaltyPoints(
          finalTotal,
          selectedCustomer.tier,
        );
        if (pointsEarned > 0) {
          showAlert(
            "Points Earned! 🎯",
            `${selectedCustomer.name} mendapat ${pointsEarned} points!`,
            "success",
          );
        }
      }

      // Save offline data if not online
      if (!isOnline) {
        addOfflineSale(newSale);
        saveOfflineData({
          products: updatedProducts,
          sales: [...sales, newSale],
        });
      }

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

      // Clear cart and discount
      setCart([]);
      setCashGiven(0);
      setDiscountAmount(0);

      // Show success modal with print option
      showSuccess(
        "Pembayaran Berhasil!",
        `Transaksi ${saleId} berhasil. Total: ${formatCurrency(finalTotal)}`,
        true,
        () => printReceipt(newSale),
      );
    }
  };

  // Void sale function
  const voidSale = async (saleId: string) => {
    // First ask for confirmation
    const confirmed = await showConfirm(
      "Batalkan Transaksi",
      "Apakah Anda yakin ingin membatalkan transaksi ini? Stok produk akan dikembalikan.",
      "danger",
    );

    if (confirmed) {
      // Ask for void reason
      const voidReason = await showPrompt(
        "Alasan Pembatalan",
        "Masukkan alasan pembatalan transaksi:",
        "",
        "text",
      );

      if (voidReason === null) {
        // User cancelled the void reason prompt
        return;
      }

      if (!voidReason.trim()) {
        showAlert(
          "Alasan Diperlukan",
          "Anda harus memberikan alasan untuk membatalkan transaksi.",
          "warning",
        );
        return;
      }

      const saleIndex = sales.findIndex((s) => s.id === saleId);
      if (saleIndex !== -1 && sales[saleIndex].status === "completed") {
        const voidedSale = sales[saleIndex];

        // Update sale status with void information
        const updatedSales = sales.map((s) =>
          s.id === saleId
            ? {
                ...s,
                status: "voided" as const,
                voidReason: voidReason.trim(),
                voidedBy: currentUser?.username || "Unknown",
                voidedAt: new Date().toISOString(),
              }
            : s,
        );
        setSales(updatedSales);

        // Return stock
        const updatedProducts = products.map((product) => {
          const voidedItem = voidedSale.items.find(
            (item) => item.productId === product.id,
          );
          if (voidedItem) {
            return { ...product, stock: product.stock + voidedItem.quantity };
          }
          return product;
        });
        setProducts(updatedProducts);

        showAlert(
          "Berhasil",
          `Transaksi ${saleId} berhasil dibatalkan dan stok dikembalikan. Alasan: ${voidReason.trim()}`,
          "success",
        );

        // Add notification
        addNotification(
          "info",
          "Transaksi Dibatalkan",
          `Transaksi ${saleId} dibatalkan oleh ${currentUser?.username}. Alasan: ${voidReason.trim()}`,
        );
      } else {
        showAlert(
          "Error",
          "Transaksi tidak dapat dibatalkan atau sudah dibatalkan.",
          "error",
        );
      }
    }
  };

  // Product management
  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!productForm.name || productForm.price <= 0 || productForm.stock < 0) {
      showAlert(
        "Input Tidak Valid",
        "Mohon isi semua field dengan benar.",
        "error",
      );
      return;
    }

    if (editingProduct) {
      // Edit existing product
      setProducts(
        products.map((p) =>
          p.id === editingProduct.id ? { ...p, ...productForm } : p,
        ),
      );
      showAlert("Berhasil", "Produk berhasil diperbarui.", "success");
    } else {
      // Add new product
      const newProduct: Product = {
        id: generateUniqueId(),
        ...productForm,
      };
      setProducts([...products, newProduct]);
      showAlert("Berhasil", "Produk baru berhasil ditambahkan.", "success");
    }

    setShowProductModal(false);
    setEditingProduct(null);
    setProductForm({ name: "", price: 0, stock: 0, imageUrl: "" });
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      price: product.price,
      stock: product.stock,
      imageUrl: product.imageUrl || "",
    });
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    const confirmed = await showConfirm(
      "Konfirmasi Hapus",
      "Apakah Anda yakin ingin menghapus produk ini?",
      "danger",
    );
    if (confirmed) {
      setProducts(products.filter((p) => p.id !== productId));
      showAlert("Berhasil", "Produk berhasil dihapus.", "success");
    }
  };

  // Customer management
  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerForm.name) {
      showAlert(
        "Input Tidak Valid",
        "Nama pelanggan tidak boleh kosong.",
        "error",
      );
      return;
    }

    if (editingCustomer) {
      // Edit existing customer
      setCustomers(
        customers.map((c) =>
          c.id === editingCustomer.id ? { ...c, ...customerForm } : c,
        ),
      );
      showAlert("Berhasil", "Data pelanggan berhasil diperbarui.", "success");
    } else {
      // Add new customer
      const newCustomer: Customer = {
        id: generateUniqueId(),
        ...customerForm,
        loyaltyPoints: 0,
        totalSpent: 0,
        joinDate: new Date().toISOString(),
        tier: "Bronze",
        isActive: true,
      };
      setCustomers([...customers, newCustomer]);
      showAlert("Berhasil", "Pelanggan baru berhasil ditambahkan.", "success");
    }

    setShowCustomerModal(false);
    setEditingCustomer(null);
    setCustomerForm({ name: "", email: "", phone: "" });
  };

  // Loyalty Program Functions
  const calculateLoyaltyPoints = (
    amount: number,
    tier: string = "Bronze",
  ): number => {
    if (!settings.loyaltyProgramEnabled) return 0;

    const basePoints =
      Math.floor(amount / 1000) * (settings.pointsPerPurchase || 1);
    const tierMultiplier =
      settings.tierBenefits?.[tier as keyof typeof settings.tierBenefits]
        ?.pointsMultiplier || 1;

    return Math.floor(basePoints * tierMultiplier);
  };

  const calculateTier = (
    totalSpent: number,
  ): "Bronze" | "Silver" | "Gold" | "Platinum" => {
    if (!settings.tierThresholds) return "Bronze";

    if (totalSpent >= settings.tierThresholds.platinum) return "Platinum";
    if (totalSpent >= settings.tierThresholds.gold) return "Gold";
    if (totalSpent >= settings.tierThresholds.silver) return "Silver";
    return "Bronze";
  };

  const getTierDiscount = (tier: string): number => {
    return (
      settings.tierBenefits?.[tier as keyof typeof settings.tierBenefits]
        ?.discountPercent || 0
    );
  };

  const redeemLoyaltyPoints = (
    customerId: string,
    pointsToRedeem: number,
  ): number => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer || customer.loyaltyPoints < pointsToRedeem) return 0;

    const redemptionValue =
      pointsToRedeem * (settings.pointsRedemptionValue || 1000);

    // Update customer points
    setCustomers(
      customers.map((c) =>
        c.id === customerId
          ? { ...c, loyaltyPoints: c.loyaltyPoints - pointsToRedeem }
          : c,
      ),
    );

    return redemptionValue;
  };

  const updateCustomerLoyalty = (
    customerId: string,
    purchaseAmount: number,
  ) => {
    if (!settings.loyaltyProgramEnabled) return;

    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;

    const newTotalSpent = customer.totalSpent + purchaseAmount;
    const newTier = calculateTier(newTotalSpent);
    const pointsEarned = calculateLoyaltyPoints(purchaseAmount, customer.tier);

    setCustomers(
      customers.map((c) =>
        c.id === customerId
          ? {
              ...c,
              totalSpent: newTotalSpent,
              tier: newTier,
              loyaltyPoints: c.loyaltyPoints + pointsEarned,
              lastVisit: new Date().toISOString(),
            }
          : c,
      ),
    );

    // Show tier upgrade notification
    if (newTier !== customer.tier) {
      showAlert(
        "Tier Upgrade! 🎉",
        `${customer.name} naik ke tier ${newTier}! Selamat!`,
        "success",
      );
    }
  };

  // Expense Management Functions
  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!expenseForm.description || expenseForm.amount <= 0) {
      showAlert(
        "Input Tidak Valid",
        "Deskripsi dan jumlah expense harus diisi dengan benar.",
        "error",
      );
      return;
    }

    if (editingExpense) {
      // Edit existing expense
      setExpenses(
        expenses.map((exp) =>
          exp.id === editingExpense.id
            ? { ...exp, ...expenseForm, date: exp.date } // Preserve original date
            : exp,
        ),
      );
      showAlert("Berhasil", "Data expense berhasil diperbarui.", "success");
    } else {
      // Add new expense
      const newExpense: Expense = {
        id: generateUniqueId(),
        date: new Date().toISOString(),
        ...expenseForm,
        createdBy: currentUser?.id || "unknown",
      };
      setExpenses([...expenses, newExpense]);
      showAlert("Berhasil", "Expense baru berhasil ditambahkan.", "success");
    }

    setShowExpenseModal(false);
    setEditingExpense(null);
    setExpenseForm({
      category: "other",
      description: "",
      amount: 0,
      supplier: "",
      paymentMethod: "cash",
      receiptNumber: "",
      notes: "",
      isRecurring: false,
      recurringPeriod: "monthly",
      tags: [],
    });
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      supplier: expense.supplier || "",
      paymentMethod: expense.paymentMethod,
      receiptNumber: expense.receiptNumber || "",
      notes: expense.notes || "",
      isRecurring: expense.isRecurring || false,
      recurringPeriod: expense.recurringPeriod || "monthly",
      tags: expense.tags || [],
    });
    setShowExpenseModal(true);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    const confirmed = await showConfirm(
      "Konfirmasi Hapus",
      "Apakah Anda yakin ingin menghapus expense ini?",
      "danger",
    );
    if (confirmed) {
      setExpenses(expenses.filter((exp) => exp.id !== expenseId));
      showAlert("Berhasil", "Expense berhasil dihapus.", "success");
    }
  };

  const getExpenseAnalytics = () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentExpenses = expenses.filter(
      (exp) => new Date(exp.date) >= thirtyDaysAgo,
    );

    const categoryTotals = recentExpenses.reduce(
      (acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalExpenses = recentExpenses.reduce(
      (sum, exp) => sum + exp.amount,
      0,
    );

    return {
      totalExpenses,
      categoryTotals,
      expenseCount: recentExpenses.length,
      avgExpense:
        recentExpenses.length > 0 ? totalExpenses / recentExpenses.length : 0,
    };
  };

  const getFilteredExpenses = () => {
    return expenses.filter(
      (expense) =>
        expense.description
          .toLowerCase()
          .includes(customerSearch.toLowerCase()) ||
        expense.category.toLowerCase().includes(customerSearch.toLowerCase()) ||
        (expense.supplier &&
          expense.supplier
            .toLowerCase()
            .includes(customerSearch.toLowerCase())),
    );
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

  const handleDeleteCustomer = async (customerId: string) => {
    const confirmed = await showConfirm(
      "Konfirmasi Hapus",
      "Apakah Anda yakin ingin menghapus pelanggan ini?",
      "danger",
    );
    if (confirmed) {
      setCustomers(customers.filter((c) => c.id !== customerId));
      showAlert("Berhasil", "Pelanggan berhasil dihapus.", "success");
    }
  };

  // User management
  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!userForm.username || !userForm.password) {
      showAlert(
        "Input Tidak Valid",
        "Username dan password tidak boleh kosong.",
        "error",
      );
      return;
    }

    // Check if username already exists
    const existingUser = users.find(
      (u) => u.username === userForm.username && u.id !== editingUser?.id,
    );
    if (existingUser) {
      showAlert("Duplikat Username", "Username sudah digunakan.", "error");
      return;
    }

    if (editingUser) {
      // Edit existing user
      setUsers(
        users.map((u) => (u.id === editingUser.id ? { ...u, ...userForm } : u)),
      );
      showAlert("Berhasil", "Pengguna berhasil diperbarui.", "success");
    } else {
      // Add new user
      const newUser: User = {
        id: generateUniqueId(),
        currentShiftId: null,
        ...userForm,
      };
      setUsers([...users, newUser]);
      showAlert("Berhasil", "Pengguna baru berhasil ditambahkan.", "success");
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

  const handleDeleteUser = async (userId: string) => {
    if (currentUser && currentUser.id === userId) {
      showAlert(
        "Tidak Dapat Menghapus",
        "Anda tidak dapat menghapus akun yang sedang digunakan.",
        "warning",
      );
      return;
    }

    const confirmed = await showConfirm(
      "Konfirmasi Hapus",
      "Apakah Anda yakin ingin menghapus pengguna ini?",
      "danger",
    );
    if (confirmed) {
      setUsers(users.filter((u) => u.id !== userId));
      showAlert("Berhasil", "Pengguna berhasil dihapus.", "success");
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
      showAlert(
        "Input Tidak Valid",
        "Mohon isi semua field dengan benar.",
        "error",
      );
      return;
    }

    setSettings({
      ...settings,
      storeName: settingsForm.storeName,
      taxRate: settingsForm.taxRate,
      currencySymbol: settingsForm.currencySymbol,
      logo: settingsForm.logo,
      // Financial settings
      taxType: settingsForm.taxType,
      maxDiscountPercent: settingsForm.maxDiscountPercent,
      quickDiscountAmount: settingsForm.quickDiscountAmount,
      quickDiscountPresets: settingsForm.quickDiscountPresets,
      serviceChargePercent: settingsForm.serviceChargePercent,
      enableServiceCharge: settingsForm.enableServiceCharge,
    });

    showAlert("Berhasil", "Pengaturan umum berhasil disimpan.", "success");
  };

  // Handle logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        // 2MB limit
        showAlert(
          "File Terlalu Besar",
          "Ukuran file logo maksimal 2MB.",
          "error",
        );
        return;
      }

      if (!file.type.startsWith("image/")) {
        showAlert(
          "Format File Salah",
          "Mohon pilih file gambar (PNG, JPG, atau GIF).",
          "error",
        );
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
      receiptSettings: receiptSettingsForm,
    });

    showAlert("Berhasil", "Pengaturan struk berhasil disimpan.", "success");
  };

  // Handle test print
  const handleTestPrint = async () => {
    // Create a sample sale for testing
    const testSale: Sale = {
      id: "TEST-" + Date.now(),
      date: new Date().toISOString(),
      items: [
        {
          id: "test-item-1",
          name: "Contoh Produk 1",
          price: 15000,
          quantity: 2,
          subtotal: 30000,
        },
        {
          id: "test-item-2",
          name: "Contoh Produk 2",
          price: 25000,
          quantity: 1,
          subtotal: 25000,
        },
      ],
      totalAmount: 59125, // Including tax
      paymentMethod: "cash",
      cashGiven: 60000,
      customer: "Customer Test",
      status: "completed",
      processedByUserId: currentUser?.id || "test-user",
      shiftId: "test-shift",
    };

    try {
      // Update receipt settings with current form values temporarily
      const currentReceiptSettings = settings.receiptSettings;
      setSettings({
        ...settings,
        receiptSettings: receiptSettingsForm,
      });

      // Perform the test print
      printReceipt(testSale);

      // Restore original settings
      setSettings({
        ...settings,
        receiptSettings: currentReceiptSettings,
      });

      showAlert(
        "Test Print",
        "Struk test berhasil dikirim ke printer!",
        "success",
      );
    } catch (error) {
      console.error("Test print error:", error);
      showAlert(
        "Error",
        "Gagal melakukan test print. Pastikan printer terhubung.",
        "error",
      );
    }
  };

  // Generate shift report HTML
  const generateShiftReportHTML = (shift: Shift) => {
    const user = users.find((u) => u.id === shift.userId);
    const shiftSales = sales.filter(
      (s) => shift.salesIds.includes(s.id) && s.status === "completed",
    );
    const voidedSales = sales.filter(
      (s) => shift.salesIds.includes(s.id) && s.status === "voided",
    );
    const totalSales = shiftSales.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0,
    );
    const totalVoided = voidedSales.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0,
    );
    const netSales = totalSales - totalVoided;
    const cashSales = shiftSales
      .filter((s) => s.paymentMethod === "cash")
      .reduce((sum, sale) => sum + sale.totalAmount, 0);
    const cardSales = shiftSales
      .filter((s) => s.paymentMethod === "card")
      .reduce((sum, sale) => sum + sale.totalAmount, 0);
    const ewalletSales = shiftSales
      .filter((s) => s.paymentMethod === "ewallet")
      .reduce((sum, sale) => sum + sale.totalAmount, 0);
    const expectedCash = shift.startCash + cashSales;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Shift</title>
        <style>
          body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 20px; }
          .report { width: 400px; margin: 0 auto; }
          .center { text-align: center; }
          .right { text-align: right; }
          .bold { font-weight: bold; }
          .line { border-top: 1px dashed #000; margin: 10px 0; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { padding: 4px 8px; text-align: left; }
          .header { margin-bottom: 15px; }
          .section { margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="report">
          ${
            settings.logo && settings.receiptSettings.showLogo
              ? `
            <div class="center" style="margin-bottom: 10px;">
              <img src="${settings.logo}" alt="Logo" style="max-width: 80px; max-height: 80px; object-fit: contain;">
            </div>
          `
              : ""
          }

          <div class="header center">
            <h2 class="bold">${settings.storeName}</h2>
            <h3>LAPORAN SHIFT</h3>
            <p>Dicetak: ${new Date().toLocaleString("id-ID")}</p>
          </div>
          <div class="line"></div>

          <div class="section">
            <h4 class="bold">INFORMASI SHIFT</h4>
            <table>
              <tr><td>ID Shift:</td><td class="right">${shift.id}</td></tr>
              <tr><td>Kasir:</td><td class="right">${user ? user.username : "Unknown"}</td></tr>
              <tr><td>Mulai:</td><td class="right">${new Date(shift.startTime).toLocaleString("id-ID")}</td></tr>
              <tr><td>Selesai:</td><td class="right">${shift.endTime ? new Date(shift.endTime).toLocaleString("id-ID") : "Belum selesai"}</td></tr>
              <tr><td>Status:</td><td class="right">${shift.status === "open" ? "Aktif" : "Selesai"}</td></tr>
            </table>
          </div>
          <div class="line"></div>

          <div class="section">
            <h4 class="bold">RINGKASAN PENJUALAN</h4>
            <table>
              <tr><td>Total Transaksi:</td><td class="right">${shiftSales.length}</td></tr>
              <tr><td>Transaksi Dibatalkan:</td><td class="right">${voidedSales.length}</td></tr>
              <tr><td>Gross Sales:</td><td class="right bold">${formatCurrency(totalSales)}</td></tr>
              <tr><td>Void/Refund:</td><td class="right">${formatCurrency(totalVoided)}</td></tr>
              <tr><td class="bold">Net Sales:</td><td class="right bold">${formatCurrency(netSales)}</td></tr>
            </table>
          </div>
          <div class="line"></div>

          <div class="section">
            <h4 class="bold">PEMBAYARAN</h4>
            <table>
              <tr><td>Tunai:</td><td class="right">${formatCurrency(cashSales)}</td></tr>
              <tr><td>Kartu:</td><td class="right">${formatCurrency(cardSales)}</td></tr>
              <tr><td>E-Wallet:</td><td class="right">${formatCurrency(ewalletSales)}</td></tr>
              <tr><td class="bold">Total:</td><td class="right bold">${formatCurrency(totalSales)}</td></tr>
            </table>
          </div>
          <div class="line"></div>

          <div class="section">
            <h4 class="bold">PERHITUNGAN KAS</h4>
            <table>
              <tr><td>Kas Awal:</td><td class="right">${formatCurrency(shift.startCash)}</td></tr>
              <tr><td>Penjualan Tunai:</td><td class="right">${formatCurrency(cashSales)}</td></tr>
              <tr><td class="bold">Kas Seharusnya:</td><td class="right bold">${formatCurrency(expectedCash)}</td></tr>
              ${
                shift.endCash !== null
                  ? `
                <tr><td>Kas Aktual:</td><td class="right">${formatCurrency(shift.endCash)}</td></tr>
                <tr><td class="bold">Selisih:</td><td class="right bold">${formatCurrency(shift.endCash - expectedCash)}</td></tr>
              `
                  : ""
              }
            </table>
          </div>

          ${
            shiftSales.length > 0
              ? `
            <div class="line"></div>
            <div class="section">
              <h4 class="bold">DETAIL TRANSAKSI</h4>
              <table style="font-size: 10px;">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Waktu</th>
                    <th>Total</th>
                    <th>Bayar</th>
                  </tr>
                </thead>
                <tbody>
                  ${shiftSales
                    .map(
                      (sale) => `
                    <tr>
                      <td>${sale.id}</td>
                      <td>${new Date(sale.date).toLocaleTimeString("id-ID")}</td>
                      <td class="right">${formatCurrency(sale.totalAmount)}</td>
                      <td>${sale.paymentMethod === "cash" ? "Tunai" : sale.paymentMethod === "card" ? "Kartu" : "E-Wallet"}</td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          `
              : ""
          }

          <div class="line"></div>
          <div class="center">
            <p>** LAPORAN SHIFT **</p>
            <p>Terima kasih</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Print shift report
  const printShiftReport = (shift: Shift) => {
    const reportHTML = generateShiftReportHTML(shift);
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(reportHTML);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  // Print detailed sales report for shift
  const printShiftSalesReport = (shift: Shift) => {
    const shiftSales = sales.filter(
      (sale) => shift.salesIds.includes(sale.id) && sale.status === "completed",
    );

    const user = users.find((u) => u.id === shift.userId);
    const totalSales = shiftSales.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0,
    );
    const totalItems = shiftSales.reduce(
      (sum, sale) =>
        sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0,
    );

    // Product performance analysis
    const productPerformance: Record<
      string,
      { name: string; quantity: number; revenue: number }
    > = {};
    shiftSales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!productPerformance[item.id]) {
          productPerformance[item.id] = {
            name: item.name,
            quantity: 0,
            revenue: 0,
          };
        }
        productPerformance[item.id].quantity += item.quantity;
        productPerformance[item.id].revenue += item.subtotal;
      });
    });

    const topProducts = Object.values(productPerformance)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Payment method breakdown
    const paymentMethods = shiftSales.reduce(
      (acc, sale) => {
        acc[sale.paymentMethod] =
          (acc[sale.paymentMethod] || 0) + sale.totalAmount;
        return acc;
      },
      {} as Record<string, number>,
    );

    const reportHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Penjualan Shift ${shift.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
          .section { margin-bottom: 20px; }
          .section h3 { background: #f0f0f0; padding: 8px; margin: 0 0 10px 0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .text-right { text-align: right; }
          .summary-box { background: #f9f9f9; padding: 15px; border: 1px solid #ddd; margin: 10px 0; }
          .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          @media print {
            body { margin: 0; }
            .section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${settings.storeName}</h1>
          <h2>Laporan Penjualan Shift</h2>
          <p>Shift ID: ${shift.id} | Kasir: ${user?.username || "Unknown"}</p>
          <p>Periode: ${new Date(shift.startTime).toLocaleString("id-ID")} - ${shift.endTime ? new Date(shift.endTime).toLocaleString("id-ID") : "Ongoing"}</p>
        </div>

        <div class="summary-box">
          <div class="summary-grid">
            <div>
              <strong>Ringkasan Transaksi:</strong><br>
              Total Transaksi: ${shiftSales.length}<br>
              Total Item Terjual: ${totalItems}<br>
              Total Penjualan: ${formatCurrency(totalSales)}
            </div>
            <div>
              <strong>Kas Shift:</strong><br>
              Kas Awal: ${formatCurrency(shift.startCash)}<br>
              Kas Akhir: ${formatCurrency(shift.endCash || 0)}<br>
              Selisih: ${formatCurrency((shift.endCash || 0) - shift.startCash - totalSales)}
            </div>
          </div>
        </div>

        <div class="section">
          <h3>📊 Top 10 Produk Terlaris</h3>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Produk</th>
                <th class="text-right">Qty Terjual</th>
                <th class="text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              ${topProducts
                .map(
                  (product, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${product.name}</td>
                  <td class="text-right">${product.quantity}</td>
                  <td class="text-right">${formatCurrency(product.revenue)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h3>💳 Breakdown Metode Pembayaran</h3>
          <table>
            <thead>
              <tr>
                <th>Metode Pembayaran</th>
                <th class="text-right">Jumlah</th>
                <th class="text-right">Persentase</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(paymentMethods)
                .map(
                  ([method, amount]) => `
                <tr>
                  <td>${method === "cash" ? "Tunai" : method === "card" ? "Kartu" : "E-Wallet"}</td>
                  <td class="text-right">${formatCurrency(amount)}</td>
                  <td class="text-right">${((amount / totalSales) * 100).toFixed(1)}%</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h3>📋 Detail Semua Transaksi</h3>
          <table>
            <thead>
              <tr>
                <th>Waktu</th>
                <th>ID Transaksi</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Metode Bayar</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${shiftSales
                .map(
                  (sale) => `
                <tr>
                  <td>${new Date(sale.date).toLocaleTimeString("id-ID")}</td>
                  <td>${sale.id}</td>
                  <td>${sale.customer || "-"}</td>
                  <td>${sale.items.length} item(s)</td>
                  <td>${sale.paymentMethod === "cash" ? "Tunai" : sale.paymentMethod === "card" ? "Kartu" : "E-Wallet"}</td>
                  <td class="text-right">${formatCurrency(sale.totalAmount)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <div style="margin-top: 30px; text-align: center; color: #666;">
          <p>Laporan dicetak pada: ${new Date().toLocaleString("id-ID")}</p>
          <p>Sistem POS - ${settings.storeName}</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(reportHTML);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      setTimeout(() => {
        printWindow.close();
      }, 100);
    }
  };

  // Initialize settings form when accessing settings
  useEffect(() => {
    if (activeModule === "settings") {
      setSettingsForm({
        storeName: settings.storeName,
        taxRate: settings.taxRate,
        currencySymbol: settings.currencySymbol,
        logo: settings.logo || "",
        // Financial settings
        taxType: settings.taxType || "exclusive",
        maxDiscountPercent: settings.maxDiscountPercent || 50,
        quickDiscountAmount: settings.quickDiscountAmount || 5000,
        quickDiscountPresets: settings.quickDiscountPresets || [5, 10, 15, 20],
        serviceChargePercent: settings.serviceChargePercent || 0,
        enableServiceCharge: settings.enableServiceCharge || false,
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
        showThankYouMessage:
          settings.receiptSettings.showThankYouMessage ?? true,
        customThankYouMessage:
          settings.receiptSettings.customThankYouMessage ||
          "Terima kasih atas pembelian Anda!",
        headerText: settings.receiptSettings.headerText || "",
        footerText: settings.receiptSettings.footerText || "",
        showLogo: settings.receiptSettings.showLogo ?? true,
      });
    }
  }, [activeModule, settings]);

  // Shift management
  const startShift = async () => {
    if (!currentUser) {
      showAlert(
        "Login Diperlukan",
        "Anda harus login untuk memulai shift.",
        "warning",
      );
      return;
    }

    if (currentShift && currentShift.status === "open") {
      showAlert(
        "Shift Terbuka",
        "Anda sudah memiliki shift yang sedang berjalan.",
        "warning",
      );
      return;
    }

    const initialCashStr = await showPrompt(
      "Mulai Shift",
      "Masukkan Kas Awal Shift:",
      "0",
      "number",
    );
    if (initialCashStr === null) return; // User cancelled

    const initialCash = parseFloat(initialCashStr);

    if (isNaN(initialCash) || initialCash < 0) {
      showAlert(
        "Input Tidak Valid",
        "Kas awal harus berupa angka positif.",
        "error",
      );
      return;
    }

    const newShift: Shift = {
      id: generateShiftId(),
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

    showAlert(
      "Shift Dimulai",
      `Shift dimulai dengan kas awal ${formatCurrency(initialCash)}.`,
      "success",
    );
  };

  // End shift
  const endShift = async () => {
    if (!currentShift || currentShift.status !== "open") {
      showAlert(
        "Tidak Ada Shift",
        "Tidak ada shift yang sedang berjalan untuk diakhiri.",
        "warning",
      );
      return;
    }

    const salesTotal = currentShift.salesIds.reduce((total, saleId) => {
      const sale = sales.find(
        (s) => s.id === saleId && s.status === "completed",
      );
      return total + (sale ? sale.totalAmount : 0);
    }, 0);

    const expectedCash = currentShift.startCash + salesTotal;
    const finalCashStr = await showPrompt(
      "Akhiri Shift",
      "Masukkan Kas Akhir Shift:",
      expectedCash.toString(),
      "number",
    );
    if (finalCashStr === null) return; // User cancelled

    const finalCash = parseFloat(finalCashStr);

    if (isNaN(finalCash) || finalCash < 0) {
      showAlert(
        "Input Tidak Valid",
        "Kas akhir harus berupa angka positif.",
        "error",
      );
      return;
    }

    const confirmed = await showConfirm(
      "Konfirmasi Akhiri Shift",
      "Apakah Anda yakin ingin mengakhiri shift ini?",
      "warning",
    );
    if (confirmed) {
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

      // Automatically print shift report and sales summary
      try {
        // Print shift report
        printShiftReport(updatedShift);

        // Print sales summary for the shift
        printShiftSalesReport(updatedShift);

        showAlert(
          "Shift Berakhir",
          `Shift berhasil diakhiri dan laporan telah dicetak!\n\nKas Awal: ${formatCurrency(currentShift.startCash)}\nTotal Penjualan: ${formatCurrency(salesTotal)}\nKas Diharapkan: ${formatCurrency(expectedCash)}\nKas Akhir: ${formatCurrency(finalCash)}\nSelisih: ${formatCurrency(discrepancy)}`,
          "success",
        );
      } catch (error) {
        console.error("Error printing shift reports:", error);
        showAlert(
          "Shift Berakhir",
          `Shift berhasil diakhiri namun gagal mencetak laporan.\n\nKas Awal: ${formatCurrency(currentShift.startCash)}\nTotal Penjualan: ${formatCurrency(salesTotal)}\nKas Diharapkan: ${formatCurrency(expectedCash)}\nKas Akhir: ${formatCurrency(finalCash)}\nSelisih: ${formatCurrency(discrepancy)}\n\nSilakan cetak laporan manual dari menu Laporan.`,
          "warning",
        );
      }
    }
  };

  // Get filtered sales for reports
  const getFilteredSales = () => {
    return sales.filter((sale) => {
      // Shift-based filtering: Only show current shift sales unless date filters are explicitly set
      if (!reportStartDate && !reportEndDate && currentShift) {
        // Show only current shift sales when no date filters are applied
        return sale.shiftId === currentShift.id;
      }

      // Date filtering (when explicitly requested)
      const saleDate = new Date(sale.date);
      const startDate = reportStartDate ? new Date(reportStartDate) : null;
      const endDate = reportEndDate ? new Date(reportEndDate) : null;

      if (startDate && saleDate < startDate) return false;
      if (endDate && saleDate > endDate) return false;

      // Payment method filtering
      if (reportPaymentFilter && sale.paymentMethod !== reportPaymentFilter)
        return false;

      return true;
    });
  };

  // Filter functions for search
  const getFilteredProducts = () => {
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.id.toLowerCase().includes(productSearch.toLowerCase()),
    );
  };

  // Advanced inventory analytics and forecasting
  const getInventoryAnalytics = () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get sales in the last 30 days
    const recentSales = sales.filter(
      (sale) =>
        new Date(sale.date) >= thirtyDaysAgo && sale.status === "completed",
    );

    // Calculate product velocity (items sold per day)
    const productVelocity: Record<
      string,
      {
        name: string;
        totalSold: number;
        currentStock: number;
        dailyAverage: number;
        weeklyAverage: number;
        daysUntilStockout: number;
        reorderPoint: number;
        status: "healthy" | "low" | "critical" | "stockout";
        forecast: { days: number; estimatedStock: number }[];
      }
    > = {};

    // Initialize with current products
    products.forEach((product) => {
      productVelocity[product.id] = {
        name: product.name,
        totalSold: 0,
        currentStock: product.stock,
        dailyAverage: 0,
        weeklyAverage: 0,
        daysUntilStockout: 0,
        reorderPoint: 0,
        status: "healthy",
        forecast: [],
      };
    });

    // Calculate sales velocity
    recentSales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (productVelocity[item.id]) {
          productVelocity[item.id].totalSold += item.quantity;
        }
      });
    });

    // Calculate averages and forecasts
    Object.keys(productVelocity).forEach((productId) => {
      const data = productVelocity[productId];
      data.dailyAverage = data.totalSold / 30; // 30 days average
      data.weeklyAverage = data.totalSold / 4.3; // ~4.3 weeks in 30 days

      // Calculate days until stockout
      if (data.dailyAverage > 0) {
        data.daysUntilStockout = Math.floor(
          data.currentStock / data.dailyAverage,
        );
        data.reorderPoint = Math.ceil(data.dailyAverage * 7); // 7 days worth of stock
      } else {
        data.daysUntilStockout = Infinity;
        data.reorderPoint = 5; // Default minimum stock
      }

      // Determine status
      if (data.currentStock === 0) {
        data.status = "stockout";
      } else if (data.currentStock <= data.reorderPoint * 0.5) {
        data.status = "critical";
      } else if (data.currentStock <= data.reorderPoint) {
        data.status = "low";
      } else {
        data.status = "healthy";
      }

      // Generate 14-day forecast
      for (let i = 1; i <= 14; i++) {
        const estimatedStock = Math.max(
          0,
          data.currentStock - data.dailyAverage * i,
        );
        data.forecast.push({ days: i, estimatedStock });
      }
    });

    return productVelocity;
  };

  // Get inventory alerts
  const getInventoryAlerts = () => {
    const analytics = getInventoryAnalytics();
    const alerts: Array<{
      id: string;
      type: "stockout" | "critical" | "low" | "reorder" | "overstock";
      priority: "high" | "medium" | "low";
      message: string;
      productName: string;
      actionRequired: string;
    }> = [];

    Object.entries(analytics).forEach(([productId, data]) => {
      // Stockout alert
      if (data.status === "stockout") {
        alerts.push({
          id: `stockout-${productId}`,
          type: "stockout",
          priority: "high",
          message: `${data.name} sudah habis!`,
          productName: data.name,
          actionRequired: "Segera lakukan restocking",
        });
      }

      // Critical stock alert
      else if (data.status === "critical") {
        alerts.push({
          id: `critical-${productId}`,
          type: "critical",
          priority: "high",
          message: `${data.name} stok kritis (${data.currentStock} tersisa)`,
          productName: data.name,
          actionRequired: `Restock dalam ${data.daysUntilStockout} hari`,
        });
      }

      // Low stock alert
      else if (data.status === "low") {
        alerts.push({
          id: `low-${productId}`,
          type: "low",
          priority: "medium",
          message: `${data.name} stok rendah (${data.currentStock} tersisa)`,
          productName: data.name,
          actionRequired: `Pertimbangkan restock dalam ${data.daysUntilStockout} hari`,
        });
      }

      // Reorder point reached
      if (data.currentStock <= data.reorderPoint && data.currentStock > 0) {
        alerts.push({
          id: `reorder-${productId}`,
          type: "reorder",
          priority: "medium",
          message: `${data.name} mencapai reorder point`,
          productName: data.name,
          actionRequired: `Restock hingga ${Math.ceil(data.reorderPoint * 2)} unit`,
        });
      }

      // Overstock detection (more than 60 days of inventory)
      if (data.dailyAverage > 0 && data.currentStock > data.dailyAverage * 60) {
        alerts.push({
          id: `overstock-${productId}`,
          type: "overstock",
          priority: "low",
          message: `${data.name} kemungkinan overstock`,
          productName: data.name,
          actionRequired: "Pertimbangkan promosi atau diskon",
        });
      }
    });

    // Sort by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return alerts.sort(
      (a, b) => priorityOrder[b.priority] - priorityOrder[a.priority],
    );
  };

  const getFilteredCustomers = () => {
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        (customer.email &&
          customer.email
            .toLowerCase()
            .includes(customerSearch.toLowerCase())) ||
        (customer.phone && customer.phone.includes(customerSearch)),
    );
  };

  const getFilteredUsers = () => {
    return users.filter(
      (user) =>
        user.username.toLowerCase().includes(userSearch.toLowerCase()) ||
        user.role.toLowerCase().includes(userSearch.toLowerCase()),
    );
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
            <div className="flex justify-center mb-6">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F28cc20f2e9ba46788d87899f4c0eef76%2F09d1bcebdf6041a3a87d7eb144fb87a9?format=webp&width=800"
                alt="Crema POS Logo"
                className="h-16 w-auto"
              />
            </div>
            <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">
              <p>Login</p>
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
              <div className="mt-4 text-sm text-gray-600 text-center">
                <p>Default Login:</p>
                <p>
                  Username: <strong>admin</strong>
                </p>
                <p>
                  Password: <strong>admin</strong>
                </p>
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
            <div className="flex justify-between items-center">
              {/* Left: Main Navigation */}
              <div className="flex items-center flex-wrap gap-4">
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
              </div>

              {/* Right: Notifications & User Actions */}
              <div className="flex items-center space-x-4">
                {/* Notification Icon */}
                <div className="relative p-1">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="notification-button relative p-2 rounded-full hover:bg-gray-700 transition-colors group"
                  >
                    <svg
                      className="w-6 h-6 text-gray-300 group-hover:text-white transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-3.5-3.5a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 10-3.6 7.3z"
                      />
                    </svg>
                    {getUnreadCount() > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
                        {getUnreadCount()}
                      </span>
                    )}
                  </button>

                  {/* Modern Notification Dropdown */}
                  {showNotifications && (
                    <div className="notification-dropdown absolute top-full right-0 mt-2 w-80 sm:w-96 max-w-[90vw] bg-white rounded-lg shadow-xl border border-gray-200 z-50 transform transition-all duration-200">
                      {/* Dropdown Arrow */}
                      <div className="absolute -top-2 right-4 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45"></div>

                      {/* Header */}
                      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-gray-800 flex items-center">
                            <svg
                              className="w-4 h-4 mr-2 text-gray-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 17h5l-3.5-3.5a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 10-3.6 7.3z"
                              />
                            </svg>
                            Notifikasi
                          </h3>
                          {notifications.length > 0 && (
                            <button
                              onClick={clearAllNotifications}
                              className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                            >
                              Hapus Semua
                            </button>
                          )}
                        </div>
                        {getUnreadCount() > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {getUnreadCount()} notifikasi belum dibaca
                          </p>
                        )}
                      </div>

                      {/* Notifications List */}
                      <div className="max-h-80 max-h-[60vh] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center">
                            <svg
                              className="w-12 h-12 mx-auto mb-3 text-gray-300"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 17h5l-3.5-3.5a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 10-3.6 7.3z"
                              />
                            </svg>
                            <p className="text-sm text-gray-500">
                              Tidak ada notifikasi
                            </p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              onClick={() =>
                                markNotificationAsRead(notification.id)
                              }
                              className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                                !notification.read
                                  ? "bg-blue-50 border-l-4 border-l-blue-500"
                                  : ""
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                <div
                                  className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                    notification.type === "error"
                                      ? "bg-red-500"
                                      : notification.type === "warning"
                                        ? "bg-yellow-500"
                                        : notification.type === "success"
                                          ? "bg-green-500"
                                          : "bg-blue-500"
                                  }`}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900">
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center justify-between mt-2">
                                    <p className="text-xs text-gray-400">
                                      {notification.timestamp.toLocaleTimeString(
                                        "id-ID",
                                      )}
                                    </p>
                                    {!notification.read && (
                                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                                        Baru
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Menu */}
                <div className="border-l border-gray-600 pl-4">
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm hover:bg-gray-700 hover:text-white transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span className="text-xs">Keluar</span>
                  </button>
                </div>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 p-6 bg-white m-4 rounded-lg shadow-md">
            <div className="flex items-center justify-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900">
                {settings.storeName}
              </h1>
              <span className="ml-4 text-sm text-gray-500">
                User: {currentUser.username} ({currentUser.role})
                {currentShift && ` | Shift: ${currentShift.id}`}
              </span>
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
                          Cari Produk (Nama/ID):
                        </label>
                        <input
                          type="text"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                          placeholder="Ketik nama atau ID produk..."
                        />
                      </div>

                      <h3 className="text-xl font-semibold mb-3 text-gray-800">
                        Daftar Produk
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6 max-h-96 overflow-y-auto">
                        {getFilteredProducts().map((product) => (
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
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-800 flex items-center">
                          <svg
                            className="w-6 h-6 mr-2 text-indigo-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6m0 0h.01M16 19a2 2 0 100-4 2 2 0 000 4zm-7 0a2 2 0 100-4 2 2 0 000 4z"
                            />
                          </svg>
                          Keranjang Belanja
                        </h3>
                        <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                          {cart.length} item{cart.length !== 1 ? "s" : ""}
                        </div>
                      </div>
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

                      {cart.length > 0 && (
                        <button
                          onClick={async () => {
                            const confirmed = await showConfirm(
                              "Konfirmasi",
                              "Apakah Anda yakin ingin mengosongkan keranjang?",
                              "warning",
                            );
                            if (confirmed) {
                              setCart([]);
                            }
                          }}
                          className="w-full bg-gray-600 text-white py-2 rounded-md font-semibold hover:bg-gray-700 transition duration-200 mb-4"
                        >
                          Kosongkan Keranjang
                        </button>
                      )}

                      {/* Discount Section */}
                      {cart.length > 0 && (
                        <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border-2 border-orange-200 mb-4">
                          <h4 className="text-lg font-semibold text-orange-800 mb-3 flex items-center">
                            <svg
                              className="w-5 h-5 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                              />
                            </svg>
                            Diskon
                          </h4>

                          {/* Discount Type Selector */}
                          <div className="mb-3">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setDiscountType("percentage")}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                  discountType === "percentage"
                                    ? "bg-orange-600 text-white"
                                    : "bg-white text-orange-600 border border-orange-600"
                                }`}
                              >
                                Persentase (%)
                              </button>
                              <button
                                onClick={() => setDiscountType("amount")}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                  discountType === "amount"
                                    ? "bg-orange-600 text-white"
                                    : "bg-white text-orange-600 border border-orange-600"
                                }`}
                              >
                                Nominal (Rp)
                              </button>
                            </div>
                          </div>

                          {/* Discount Preset Buttons */}
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
                            {discountType === "percentage"
                              ? (
                                  settings.quickDiscountPresets || [
                                    5, 10, 15, 20,
                                  ]
                                ).map((percent) => (
                                  <button
                                    key={percent}
                                    onClick={() => setDiscountAmount(percent)}
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                      discountAmount === percent &&
                                      discountType === "percentage"
                                        ? "bg-orange-600 text-white"
                                        : "bg-white text-orange-600 border border-orange-300 hover:bg-orange-100"
                                    }`}
                                  >
                                    {percent}%
                                  </button>
                                ))
                              : [5000, 10000, 15000, 20000, 25000, 50000].map(
                                  (amount) => (
                                    <button
                                      key={amount}
                                      onClick={() => setDiscountAmount(amount)}
                                      className={`px-2 py-2 rounded-md text-xs font-medium transition-colors ${
                                        discountAmount === amount &&
                                        discountType === "amount"
                                          ? "bg-orange-600 text-white"
                                          : "bg-white text-orange-600 border border-orange-300 hover:bg-orange-100"
                                      }`}
                                    >
                                      {formatCurrency(amount)}
                                    </button>
                                  ),
                                )}
                          </div>

                          {/* Custom Discount Input */}
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              min="0"
                              value={discountAmount}
                              onChange={(e) =>
                                setDiscountAmount(
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              className="flex-1 px-3 py-2 border border-orange-300 rounded-md focus:outline-none focus:border-orange-500 text-sm"
                              placeholder={
                                discountType === "percentage" ? "0%" : "0"
                              }
                            />
                            <button
                              onClick={() => {
                                setDiscountAmount(0);
                              }}
                              className="px-3 py-2 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600 transition-colors"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Payment Section */}
                      <div className="bg-gray-50 p-4 rounded-lg shadow-inner">
                        {(() => {
                          const {
                            subtotal,
                            discountValue,
                            subtotalAfterDiscount,
                            taxAmount,
                            finalTotal,
                          } = getCartTotals();
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
                                {discountValue > 0 && (
                                  <>
                                    <div className="flex justify-between font-semibold text-orange-600">
                                      <span>
                                        Diskon (
                                        {discountType === "percentage"
                                          ? `${discountAmount}%`
                                          : "Nominal"}
                                        ):
                                      </span>
                                      <span>
                                        -{formatCurrency(discountValue)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between font-semibold text-gray-700">
                                      <span>Subtotal setelah diskon:</span>
                                      <span>
                                        {formatCurrency(subtotalAfterDiscount)}
                                      </span>
                                    </div>
                                  </>
                                )}
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

                                  {/* Quick Money Amount Buttons */}
                                  <div className="mt-3 mb-3">
                                    <label className="block text-gray-600 font-medium mb-2 text-sm">
                                      Jumlah Cepat:
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setCashGiven(finalTotal)}
                                        className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-2 rounded-md font-medium text-sm transition-colors"
                                      >
                                        💰 Uang Pas
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setCashGiven(20000)}
                                        className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-2 rounded-md font-medium text-sm transition-colors"
                                      >
                                        20k
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setCashGiven(50000)}
                                        className="bg-purple-100 hover:bg-purple-200 text-purple-800 px-3 py-2 rounded-md font-medium text-sm transition-colors"
                                      >
                                        50k
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setCashGiven(100000)}
                                        className="bg-orange-100 hover:bg-orange-200 text-orange-800 px-3 py-2 rounded-md font-medium text-sm transition-colors"
                                      >
                                        100k
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setCashGiven(200000)}
                                        className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-2 rounded-md font-medium text-sm transition-colors"
                                      >
                                        200k
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setCashGiven(500000)}
                                        className="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 px-3 py-2 rounded-md font-medium text-sm transition-colors"
                                      >
                                        500k
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setCashGiven(finalTotal + 50000)
                                        }
                                        className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-2 rounded-md font-medium text-sm transition-colors"
                                      >
                                        +50k
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setCashGiven(finalTotal + 100000)
                                        }
                                        className="bg-pink-100 hover:bg-pink-200 text-pink-800 px-3 py-2 rounded-md font-medium text-sm transition-colors"
                                      >
                                        +100k
                                      </button>
                                    </div>
                                  </div>

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

                              {/* Open Bill Actions */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                <button
                                  onClick={holdCurrentBill}
                                  disabled={cart.length === 0}
                                  className="bg-yellow-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center"
                                >
                                  <svg
                                    className="w-4 h-4 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 8h14M5 8a2 2 0 110-4h1.586a1 1 0 01.707.293l1.414 1.414a1 1 0 00.707.293H14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                                    />
                                  </svg>
                                  Hold Bill
                                </button>
                                <button
                                  onClick={() => setShowOpenBillModal(true)}
                                  className="bg-orange-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-orange-700 transition duration-200 flex items-center justify-center"
                                >
                                  <svg
                                    className="w-4 h-4 mr-2"
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
                                  Open Bills (
                                  {
                                    openBills.filter((b) => b.status === "held")
                                      .length
                                  }
                                  )
                                </button>
                              </div>

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

                  {/* Inventory Insights Dashboard */}
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
                    {/* Quick Stats */}
                    <div className="lg:col-span-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                          <h3 className="text-sm font-medium text-gray-600">
                            Total Produk
                          </h3>
                          <p className="text-2xl font-bold text-blue-600">
                            {products.length}
                          </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
                          <h3 className="text-sm font-medium text-gray-600">
                            Stok Sehat
                          </h3>
                          <p className="text-2xl font-bold text-green-600">
                            {
                              Object.values(getInventoryAnalytics()).filter(
                                (p) => p.status === "healthy",
                              ).length
                            }
                          </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
                          <h3 className="text-sm font-medium text-gray-600">
                            Stok Rendah
                          </h3>
                          <p className="text-2xl font-bold text-yellow-600">
                            {
                              Object.values(getInventoryAnalytics()).filter(
                                (p) => p.status === "low",
                              ).length
                            }
                          </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
                          <h3 className="text-sm font-medium text-gray-600">
                            Stok Kritis
                          </h3>
                          <p className="text-2xl font-bold text-red-600">
                            {
                              Object.values(getInventoryAnalytics()).filter(
                                (p) =>
                                  p.status === "critical" ||
                                  p.status === "stockout",
                              ).length
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Inventory Alerts */}
                    <div className="lg:col-span-2">
                      <div className="bg-white p-4 rounded-lg shadow h-64 overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-3 flex items-center">
                          <svg
                            className="w-5 h-5 mr-2 text-yellow-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                          </svg>
                          Alert Inventory
                        </h3>
                        <div className="space-y-2">
                          {getInventoryAlerts()
                            .slice(0, 5)
                            .map((alert) => (
                              <div
                                key={alert.id}
                                className={`p-2 rounded border-l-4 text-sm ${
                                  alert.priority === "high"
                                    ? "border-red-500 bg-red-50"
                                    : alert.priority === "medium"
                                      ? "border-yellow-500 bg-yellow-50"
                                      : "border-blue-500 bg-blue-50"
                                }`}
                              >
                                <p className="font-medium">{alert.message}</p>
                                <p className="text-gray-600 text-xs mt-1">
                                  {alert.actionRequired}
                                </p>
                              </div>
                            ))}
                          {getInventoryAlerts().length === 0 && (
                            <p className="text-gray-500 text-center py-4">
                              ✅ Tidak ada alert inventory
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Top Moving Products */}
                    <div className="lg:col-span-2">
                      <div className="bg-white p-4 rounded-lg shadow h-64 overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-3 flex items-center">
                          <svg
                            className="w-5 h-5 mr-2 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                            />
                          </svg>
                          Produk Terlaris (30 hari)
                        </h3>
                        <div className="space-y-2">
                          {Object.values(getInventoryAnalytics())
                            .sort((a, b) => b.totalSold - a.totalSold)
                            .slice(0, 5)
                            .map((product, index) => (
                              <div
                                key={product.name}
                                className="flex justify-between items-center p-2 bg-gray-50 rounded"
                              >
                                <div>
                                  <p className="font-medium text-sm">
                                    {index + 1}. {product.name}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {product.totalSold} terjual |{" "}
                                    {product.dailyAverage.toFixed(1)}/hari
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium">
                                    Stok: {product.currentStock}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {product.daysUntilStockout === Infinity
                                      ? "∞"
                                      : product.daysUntilStockout}{" "}
                                    hari lagi
                                  </p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    {hasSubmenuAccess("stock-management", "add") && (
                      <button
                        onClick={() => setShowProductModal(true)}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-indigo-700 transition duration-200"
                      >
                        Tambah Produk Baru
                      </button>
                    )}
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
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Gambar
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Nama Produk
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Harga
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Stok & Status
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Velocity (30d)
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Estimasi Habis
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredProducts().length === 0 ? (
                          <tr>
                            <td
                              colSpan={7}
                              className="border border-gray-200 py-4 text-center text-gray-500"
                            >
                              Tidak ada produk ditemukan.
                            </td>
                          </tr>
                        ) : (
                          getFilteredProducts().map((product) => {
                            const analytics =
                              getInventoryAnalytics()[product.id];
                            return (
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
                                  {formatCurrency(product.price)}
                                </td>
                                <td className="border border-gray-200 px-3 py-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={
                                        analytics?.status === "stockout"
                                          ? "text-red-600 font-bold"
                                          : analytics?.status === "critical"
                                            ? "text-red-500 font-bold"
                                            : analytics?.status === "low"
                                              ? "text-yellow-600 font-bold"
                                              : "text-gray-600"
                                      }
                                    >
                                      {product.stock}
                                    </span>
                                    <span
                                      className={`text-xs px-2 py-1 rounded-full ${
                                        analytics?.status === "stockout"
                                          ? "bg-red-100 text-red-600"
                                          : analytics?.status === "critical"
                                            ? "bg-red-100 text-red-600"
                                            : analytics?.status === "low"
                                              ? "bg-yellow-100 text-yellow-600"
                                              : "bg-green-100 text-green-600"
                                      }`}
                                    >
                                      {analytics?.status === "stockout"
                                        ? "Habis"
                                        : analytics?.status === "critical"
                                          ? "Kritis"
                                          : analytics?.status === "low"
                                            ? "Rendah"
                                            : "Sehat"}
                                    </span>
                                  </div>
                                </td>
                                <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500">
                                  <div>
                                    <div>
                                      Terjual: {analytics?.totalSold || 0}
                                    </div>
                                    <div className="text-xs">
                                      {analytics?.dailyAverage?.toFixed(1) || 0}
                                      /hari
                                    </div>
                                  </div>
                                </td>
                                <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500">
                                  <div>
                                    {analytics?.daysUntilStockout ===
                                    Infinity ? (
                                      <span className="text-gray-400">
                                        ∞ hari
                                      </span>
                                    ) : analytics?.daysUntilStockout === 0 ? (
                                      <span className="text-red-600 font-bold">
                                        Habis
                                      </span>
                                    ) : (
                                      <span
                                        className={
                                          (analytics?.daysUntilStockout || 0) <=
                                          7
                                            ? "text-red-600 font-bold"
                                            : (analytics?.daysUntilStockout ||
                                                  0) <= 14
                                              ? "text-yellow-600"
                                              : "text-gray-600"
                                        }
                                      >
                                        {analytics?.daysUntilStockout} hari
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="border border-gray-200 px-3 py-2 text-sm">
                                  {hasSubmenuAccess(
                                    "stock-management",
                                    "edit",
                                  ) && (
                                    <button
                                      onClick={() => handleEditProduct(product)}
                                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                                    >
                                      Edit
                                    </button>
                                  )}
                                  {hasSubmenuAccess(
                                    "stock-management",
                                    "delete",
                                  ) && (
                                    <button
                                      onClick={() =>
                                        handleDeleteProduct(product.id)
                                      }
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      Hapus
                                    </button>
                                  )}
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

            {/* Customer Management Module */}
            {activeModule === "customer-management" &&
              hasModuleAccess("customer-management") && (
                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                    Manajemen Pelanggan
                  </h2>
                  <div className="flex justify-between items-center mb-4">
                    {hasSubmenuAccess("customer-management", "add") && (
                      <button
                        onClick={() => setShowCustomerModal(true)}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-indigo-700 transition duration-200"
                      >
                        Tambah Pelanggan Baru
                      </button>
                    )}
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
                            Tier & Points
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Total Spent
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredCustomers().length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="border border-gray-200 py-4 text-center text-gray-500"
                            >
                              Tidak ada pelanggan ditemukan.
                            </td>
                          </tr>
                        ) : (
                          getFilteredCustomers().map((customer) => (
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
                                <div className="flex items-center space-x-2">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      customer.tier === "Platinum"
                                        ? "bg-purple-100 text-purple-800"
                                        : customer.tier === "Gold"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : customer.tier === "Silver"
                                            ? "bg-gray-100 text-gray-800"
                                            : "bg-orange-100 text-orange-800"
                                    }`}
                                  >
                                    {customer.tier || "Bronze"}
                                  </span>
                                  <span className="text-xs text-gray-600">
                                    {customer.loyaltyPoints || 0} pts
                                  </span>
                                </div>
                              </td>
                              <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500">
                                {formatCurrency(customer.totalSpent || 0)}
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

            {/* Expense Management Module */}
            {activeModule === "expense-management" &&
              hasModuleAccess("expense-management") && (
                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                    Manajemen Pengeluaran
                  </h2>

                  <div className="flex justify-between items-center mb-4">
                    {hasSubmenuAccess("expense-management", "add") && (
                      <button
                        onClick={() => setShowExpenseModal(true)}
                        className="bg-red-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-red-700 transition duration-200"
                      >
                        Tambah Pengeluaran Baru
                      </button>
                    )}
                    <input
                      type="text"
                      placeholder="Cari pengeluaran..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-500"
                    />
                  </div>

                  {/* Expense Analytics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    {(() => {
                      const analytics = getExpenseAnalytics();
                      return (
                        <>
                          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-red-600">
                              Total Pengeluaran (30d)
                            </h3>
                            <p className="text-2xl font-bold text-red-700">
                              {formatCurrency(analytics.totalExpenses)}
                            </p>
                          </div>
                          <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-orange-600">
                              Jumlah Transaksi
                            </h3>
                            <p className="text-2xl font-bold text-orange-700">
                              {analytics.expenseCount}
                            </p>
                          </div>
                          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-yellow-600">
                              Rata-rata Pengeluaran
                            </h3>
                            <p className="text-2xl font-bold text-yellow-700">
                              {formatCurrency(analytics.avgExpense)}
                            </p>
                          </div>
                          <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-purple-600">
                              Kategori Terbanyak
                            </h3>
                            <p className="text-lg font-bold text-purple-700">
                              {Object.keys(analytics.categoryTotals).length > 0
                                ? Object.entries(analytics.categoryTotals).sort(
                                    ([, a], [, b]) => b - a,
                                  )[0]?.[0] || "N/A"
                                : "N/A"}
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg shadow-inner overflow-x-auto">
                    <table className="min-w-full border-collapse">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Tanggal
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Kategori
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Deskripsi
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Supplier
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Jumlah
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Metode Bayar
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredExpenses().length === 0 ? (
                          <tr>
                            <td
                              colSpan={7}
                              className="border border-gray-200 py-4 text-center text-gray-500"
                            >
                              Tidak ada data pengeluaran ditemukan.
                            </td>
                          </tr>
                        ) : (
                          getFilteredExpenses()
                            .sort(
                              (a, b) =>
                                new Date(b.date).getTime() -
                                new Date(a.date).getTime(),
                            )
                            .map((expense) => (
                              <tr key={expense.id} className="even:bg-gray-50">
                                <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500">
                                  {new Date(expense.date).toLocaleDateString(
                                    "id-ID",
                                  )}
                                </td>
                                <td className="border border-gray-200 px-3 py-2 text-sm">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      expense.category === "inventory"
                                        ? "bg-blue-100 text-blue-800"
                                        : expense.category === "operations"
                                          ? "bg-green-100 text-green-800"
                                          : expense.category === "marketing"
                                            ? "bg-purple-100 text-purple-800"
                                            : expense.category === "utilities"
                                              ? "bg-yellow-100 text-yellow-800"
                                              : expense.category === "salaries"
                                                ? "bg-indigo-100 text-indigo-800"
                                                : expense.category === "rent"
                                                  ? "bg-red-100 text-red-800"
                                                  : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {expense.category === "inventory"
                                      ? "Inventori"
                                      : expense.category === "operations"
                                        ? "Operasional"
                                        : expense.category === "marketing"
                                          ? "Marketing"
                                          : expense.category === "utilities"
                                            ? "Utilitas"
                                            : expense.category === "salaries"
                                              ? "Gaji"
                                              : expense.category === "rent"
                                                ? "Sewa"
                                                : "Lainnya"}
                                  </span>
                                </td>
                                <td className="border border-gray-200 px-3 py-2 text-sm font-medium text-gray-900">
                                  {expense.description}
                                  {expense.isRecurring && (
                                    <span className="ml-2 text-xs text-blue-600">
                                      🔄 Recurring
                                    </span>
                                  )}
                                </td>
                                <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500">
                                  {expense.supplier || "-"}
                                </td>
                                <td className="border border-gray-200 px-3 py-2 text-sm font-bold text-red-600">
                                  {formatCurrency(expense.amount)}
                                </td>
                                <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500 capitalize">
                                  {expense.paymentMethod === "cash"
                                    ? "Tunai"
                                    : expense.paymentMethod === "card"
                                      ? "Kartu"
                                      : expense.paymentMethod === "transfer"
                                        ? "Transfer"
                                        : "Cek"}
                                </td>
                                <td className="border border-gray-200 px-3 py-2 text-sm">
                                  {hasSubmenuAccess(
                                    "expense-management",
                                    "edit",
                                  ) && (
                                    <button
                                      onClick={() => handleEditExpense(expense)}
                                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                                    >
                                      Edit
                                    </button>
                                  )}
                                  {hasSubmenuAccess(
                                    "expense-management",
                                    "delete",
                                  ) && (
                                    <button
                                      onClick={() =>
                                        handleDeleteExpense(expense.id)
                                      }
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      Hapus
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
              )}

            {/* Reports Module */}
            {activeModule === "reports" && hasModuleAccess("reports") && (
              <div>
                <h2 className="text-2xl font-semibold mb-6 text-gray-800">
                  Laporan
                </h2>

                {/* Reports Tabs */}
                <div className="mb-6">
                  <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                      <button
                        onClick={() => setActiveReportsTab("sales")}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeReportsTab === "sales"
                            ? "border-indigo-500 text-indigo-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        📊 Laporan Penjualan
                      </button>
                      <button
                        onClick={() => setActiveReportsTab("shifts")}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeReportsTab === "shifts"
                            ? "border-indigo-500 text-indigo-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        �� Laporan Shift
                      </button>
                      <button
                        onClick={() => setActiveReportsTab("stock")}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeReportsTab === "stock"
                            ? "border-indigo-500 text-indigo-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        📦 Laporan Stok
                      </button>
                      <button
                        onClick={() => setActiveReportsTab("analytics")}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeReportsTab === "analytics"
                            ? "border-indigo-500 text-indigo-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        📈 Analytics Dashboard
                      </button>
                    </nav>
                  </div>
                </div>

                {activeReportsTab === "sales" && (
                  <div className="mb-6 p-4 bg-white rounded-lg shadow">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-gray-800">
                        📊 Laporan Penjualan
                      </h3>
                      {currentShift && (
                        <div className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                          Shift Aktif: {currentShift.id}
                        </div>
                      )}
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                      <p className="text-sm text-yellow-800">
                        💡 <strong>Tampilan Default:</strong> Hanya menampilkan transaksi shift saat ini.
                        Gunakan filter tanggal untuk melihat data historis.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
                      <div>
                        <label className="block text-gray-700 font-bold mb-2">
                          Metode Pembayaran:
                        </label>
                        <select
                          value={reportPaymentFilter || ""}
                          onChange={(e) =>
                            setReportPaymentFilter(e.target.value || null)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                        >
                          <option value="">Semua Metode</option>
                          <option value="cash">Tunai</option>
                          <option value="card">Kartu</option>
                          <option value="digital">Digital</option>
                        </select>
                      </div>
                      <div className="flex items-end space-x-2">
                        <button
                          onClick={() => {
                            const salesData = getFilteredSales().map(
                              (sale) => ({
                                "ID Transaksi": sale.id,
                                Tanggal: new Date(sale.date).toLocaleDateString(
                                  "id-ID",
                                ),
                                Waktu: new Date(sale.date).toLocaleTimeString(
                                  "id-ID",
                                ),
                                Total: `Rp ${sale.totalAmount.toLocaleString("id-ID")}`,
                                "Metode Pembayaran":
                                  sale.paymentMethod === "cash"
                                    ? "Tunai"
                                    : sale.paymentMethod === "card"
                                      ? "Kartu"
                                      : "E-Wallet",
                                Status:
                                  sale.status === "completed"
                                    ? "Selesai"
                                    : sale.status === "voided"
                                      ? "Dibatalkan"
                                      : sale.status,
                                Items: sale.items
                                  .map(
                                    (item) =>
                                      `${item.name} (${item.quantity}x @ ${formatCurrency(item.price)})`,
                                  )
                                  .join("; "),
                                Kasir:
                                  users.find(
                                    (u) => u.id === sale.processedByUserId,
                                  )?.username || "Unknown",
                              }),
                            );
                            if (salesData.length > 0) {
                              const headers = [
                                "ID Transaksi",
                                "Tanggal",
                                "Waktu",
                                "Total",
                                "Metode Pembayaran",
                                "Status",
                                "Items",
                                "Kasir",
                              ];
                              exportToCSV(
                                salesData,
                                "laporan_penjualan.csv",
                                headers,
                              );
                            } else {
                              showAlert(
                                "Tidak Ada Data",
                                "Tidak ada data untuk diekspor.",
                                "warning",
                              );
                            }
                          }}
                          className="bg-green-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-green-700 transition duration-200"
                        >
                          📊 Ekspor Transaksi
                        </button>

                        <button
                          onClick={() => {
                            const completedSales = getFilteredSales().filter(
                              (s) => s.status === "completed",
                            );
                            const productSales: {
                              [key: string]: {
                                quantity: number;
                                revenue: number;
                                name: string;
                                category: string;
                              };
                            } = {};

                            completedSales.forEach((sale) => {
                              sale.items.forEach((item) => {
                                if (!productSales[item.id]) {
                                  const product = products.find(
                                    (p) => p.id === item.id,
                                  );
                                  productSales[item.id] = {
                                    quantity: 0,
                                    revenue: 0,
                                    name: item.name,
                                    category:
                                      product?.category || "Tidak Diketahui",
                                  };
                                }
                                productSales[item.id].quantity += item.quantity;
                                productSales[item.id].revenue +=
                                  item.price * item.quantity;
                              });
                            });

                            const productData = Object.entries(
                              productSales,
                            ).map(([id, data]) => ({
                              "Nama Produk": data.name,
                              Kategori: data.category || "Umum",
                              "Jumlah Terjual": data.quantity,
                              "Total Pendapatan": `Rp ${data.revenue.toLocaleString("id-ID")}`,
                            }));

                            if (productData.length > 0) {
                              const headers = [
                                "Nama Produk",
                                "Kategori",
                                "Jumlah Terjual",
                                "Total Pendapatan",
                              ];
                              exportToCSV(
                                productData,
                                "laporan_produk.csv",
                                headers,
                              );
                            } else {
                              showAlert(
                                "Tidak Ada Data",
                                "Tidak ada data produk untuk diekspor.",
                                "warning",
                              );
                            }
                          }}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 transition duration-200"
                        >
                          ��� Ekspor Produk
                        </button>
                      </div>
                    </div>

                    {(() => {
                      const filteredSales = getFilteredSales();
                      const completedSales = filteredSales.filter(
                        (s) => s.status === "completed",
                      );
                      const voidedSales = filteredSales.filter(
                        (s) => s.status === "voided",
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
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm text-gray-500">
                                Total Pendapatan
                              </p>
                              <p className="font-bold text-green-600 text-lg">
                                {formatCurrency(totalRevenue)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">
                                Transaksi Selesai
                              </p>
                              <p className="font-bold text-blue-600 text-lg">
                                {totalTransactions}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">
                                Transaksi Dibatalkan
                              </p>
                              <p className="font-bold text-red-600 text-lg">
                                {voidedSales.length}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">
                                Rata-rata per Transaksi
                              </p>
                              <p className="font-bold text-purple-600 text-lg">
                                {formatCurrency(
                                  totalTransactions > 0
                                    ? totalRevenue / totalTransactions
                                    : 0,
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Enhanced Analytics */}
                          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Payment Method Breakdown */}
                            <div>
                              <h5 className="font-semibold mb-3 text-gray-700">
                                Breakdown Metode Pembayaran
                              </h5>
                              <div className="space-y-2">
                                {["cash", "card", "digital"].map((method) => {
                                  const methodSales = completedSales.filter(
                                    (s) => s.paymentMethod === method,
                                  );
                                  const methodRevenue = methodSales.reduce(
                                    (sum, s) => sum + s.totalAmount,
                                    0,
                                  );
                                  const percentage =
                                    totalRevenue > 0
                                      ? (
                                          (methodRevenue / totalRevenue) *
                                          100
                                        ).toFixed(1)
                                      : "0";
                                  const methodName =
                                    method === "cash"
                                      ? "Tunai"
                                      : method === "card"
                                        ? "Kartu"
                                        : "Digital";

                                  return (
                                    <div
                                      key={method}
                                      className="flex justify-between items-center"
                                    >
                                      <span className="text-sm text-gray-600">
                                        {methodName}
                                      </span>
                                      <div className="text-right">
                                        <span className="text-sm font-medium">
                                          {formatCurrency(methodRevenue)}
                                        </span>
                                        <span className="text-xs text-gray-500 ml-2">
                                          ({percentage}%)
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Top Products */}
                            <div>
                              <h5 className="font-semibold mb-3 text-gray-700">
                                Produk Terlaris
                              </h5>
                              <div className="space-y-2">
                                {(() => {
                                  const productSales: {
                                    [key: string]: {
                                      quantity: number;
                                      revenue: number;
                                      name: string;
                                    };
                                  } = {};

                                  completedSales.forEach((sale) => {
                                    sale.items.forEach((item) => {
                                      if (!productSales[item.id]) {
                                        productSales[item.id] = {
                                          quantity: 0,
                                          revenue: 0,
                                          name: item.name,
                                        };
                                      }
                                      productSales[item.id].quantity +=
                                        item.quantity;
                                      productSales[item.id].revenue +=
                                        item.price * item.quantity;
                                    });
                                  });

                                  return Object.entries(productSales)
                                    .sort(
                                      (a, b) => b[1].quantity - a[1].quantity,
                                    )
                                    .slice(0, 5)
                                    .map(([id, data]) => (
                                      <div
                                        key={id}
                                        className="flex justify-between items-center"
                                      >
                                        <span className="text-sm text-gray-600 truncate">
                                          {data.name}
                                        </span>
                                        <div className="text-right">
                                          <span className="text-sm font-medium">
                                            {data.quantity}x
                                          </span>
                                          <span className="text-xs text-gray-500 ml-2">
                                            {formatCurrency(data.revenue)}
                                          </span>
                                        </div>
                                      </div>
                                    ));
                                })()}
                              </div>
                            </div>
                          </div>

                          {/* Additional Analytics */}
                          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Hourly Sales Pattern */}
                            <div>
                              <h5 className="font-semibold mb-3 text-gray-700">
                                Pola Penjualan per Jam
                              </h5>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {(() => {
                                  const hourlyData: {
                                    [key: number]: {
                                      count: number;
                                      revenue: number;
                                    };
                                  } = {};

                                  completedSales.forEach((sale) => {
                                    const hour = new Date(sale.date).getHours();
                                    if (!hourlyData[hour]) {
                                      hourlyData[hour] = {
                                        count: 0,
                                        revenue: 0,
                                      };
                                    }
                                    hourlyData[hour].count++;
                                    hourlyData[hour].revenue +=
                                      sale.totalAmount;
                                  });

                                  return Array.from(
                                    { length: 24 },
                                    (_, hour) => {
                                      const data = hourlyData[hour] || {
                                        count: 0,
                                        revenue: 0,
                                      };
                                      return (
                                        <div
                                          key={hour}
                                          className="flex justify-between items-center text-sm"
                                        >
                                          <span className="text-gray-600">
                                            {hour.toString().padStart(2, "0")}
                                            :00
                                          </span>
                                          <div className="text-right">
                                            <span className="font-medium">
                                              {data.count} trans
                                            </span>
                                            <span className="text-xs text-gray-500 ml-2">
                                              {formatCurrency(data.revenue)}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    },
                                  ).filter(
                                    (_, hour) => hourlyData[hour]?.count > 0,
                                  );
                                })()}
                              </div>
                            </div>

                            {/* Daily Comparison */}
                            <div>
                              <h5 className="font-semibold mb-3 text-gray-700">
                                Perbandingan Harian
                              </h5>
                              <div className="space-y-2">
                                {(() => {
                                  const dailyData: {
                                    [key: string]: {
                                      count: number;
                                      revenue: number;
                                    };
                                  } = {};

                                  completedSales.forEach((sale) => {
                                    const day = new Date(
                                      sale.date,
                                    ).toLocaleDateString("id-ID");
                                    if (!dailyData[day]) {
                                      dailyData[day] = { count: 0, revenue: 0 };
                                    }
                                    dailyData[day].count++;
                                    dailyData[day].revenue += sale.totalAmount;
                                  });

                                  return Object.entries(dailyData)
                                    .sort(
                                      (a, b) =>
                                        new Date(a[0]).getTime() -
                                        new Date(b[0]).getTime(),
                                    )
                                    .slice(-7) // Last 7 days
                                    .map(([day, data]) => (
                                      <div
                                        key={day}
                                        className="flex justify-between items-center text-sm"
                                      >
                                        <span className="text-gray-600">
                                          {day}
                                        </span>
                                        <div className="text-right">
                                          <span className="font-medium">
                                            {data.count}
                                          </span>
                                          <span className="text-xs text-gray-500 ml-2">
                                            {formatCurrency(data.revenue)}
                                          </span>
                                        </div>
                                      </div>
                                    ));
                                })()}
                              </div>
                            </div>

                            {/* Transaction Size Analysis */}
                            <div>
                              <h5 className="font-semibold mb-3 text-gray-700">
                                Analisis Ukuran Transaksi
                              </h5>
                              <div className="space-y-3">
                                {(() => {
                                  const amounts = completedSales
                                    .map((s) => s.totalAmount)
                                    .sort((a, b) => a - b);
                                  const median =
                                    amounts.length > 0
                                      ? amounts[Math.floor(amounts.length / 2)]
                                      : 0;
                                  const min =
                                    amounts.length > 0
                                      ? Math.min(...amounts)
                                      : 0;
                                  const max =
                                    amounts.length > 0
                                      ? Math.max(...amounts)
                                      : 0;

                                  const ranges = [
                                    {
                                      label: "Kecil (< 50k)",
                                      min: 0,
                                      max: 50000,
                                    },
                                    {
                                      label: "Sedang (50k-200k)",
                                      min: 50000,
                                      max: 200000,
                                    },
                                    {
                                      label: "Besar (> 200k)",
                                      min: 200000,
                                      max: Infinity,
                                    },
                                  ];

                                  return (
                                    <div className="space-y-2">
                                      <div className="text-xs space-y-1">
                                        <div className="flex justify-between">
                                          <span className="text-gray-500">
                                            Minimum:
                                          </span>
                                          <span className="font-medium">
                                            {formatCurrency(min)}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-500">
                                            Median:
                                          </span>
                                          <span className="font-medium">
                                            {formatCurrency(median)}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-500">
                                            Maksimum:
                                          </span>
                                          <span className="font-medium">
                                            {formatCurrency(max)}
                                          </span>
                                        </div>
                                      </div>
                                      {ranges.map((range) => {
                                        const count = amounts.filter(
                                          (a) =>
                                            a >= range.min && a < range.max,
                                        ).length;
                                        const percentage =
                                          amounts.length > 0
                                            ? (
                                                (count / amounts.length) *
                                                100
                                              ).toFixed(1)
                                            : "0";

                                        return (
                                          <div
                                            key={range.label}
                                            className="flex justify-between items-center text-xs"
                                          >
                                            <span className="text-gray-600">
                                              {range.label}
                                            </span>
                                            <span className="font-medium">
                                              {count} ({percentage}%)
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
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
                              .sort(
                                (a, b) =>
                                  new Date(b.date).getTime() -
                                  new Date(a.date).getTime(),
                              )
                              .map((sale) => (
                                <tr key={sale.id} className="even:bg-gray-50">
                                  <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500">
                                    {sale.id}
                                  </td>
                                  <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500">
                                    {new Date(sale.date).toLocaleString(
                                      "id-ID",
                                    )}
                                  </td>
                                  <td className="border border-gray-200 px-3 py-2 text-sm font-medium text-gray-900 ${sale.status === 'voided' ? 'line-through' : ''}">
                                    {formatCurrency(sale.totalAmount)}
                                  </td>
                                  <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500">
                                    {sale.paymentMethod === "cash"
                                      ? "Tunai"
                                      : sale.paymentMethod === "card"
                                        ? "Kartu"
                                        : "E-Wallet"}
                                  </td>
                                  <td className="border border-gray-200 px-3 py-2 text-sm">
                                    <div className="flex flex-col">
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
                                      {sale.status === "voided" &&
                                        sale.voidReason && (
                                          <div className="mt-1">
                                            <span className="text-xs text-gray-500">
                                              Alasan: {sale.voidReason}
                                            </span>
                                            {sale.voidedBy && (
                                              <div className="text-xs text-gray-400">
                                                Oleh: {sale.voidedBy}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                    </div>
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
                                    {sale.status === "completed" && (
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
                )}

                {activeReportsTab === "stock" && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg shadow-inner">
                    <h3 className="text-xl font-semibold mb-3 text-gray-800">
                      Laporan Stok
                    </h3>

                    {/* Stock Export Button */}
                    <div className="mb-4">
                      <button
                        onClick={() => {
                          const stockData = products.map((product) => ({
                            "Nama Produk": product.name,
                            Kategori: "Umum", // Since product doesn't have category field
                            "Stok Saat Ini": product.stock,
                            Harga: `Rp ${product.price.toLocaleString("id-ID")}`,
                            "Nilai Stok": `Rp ${(product.stock * product.price).toLocaleString("id-ID")}`,
                            Status:
                              product.stock === 0
                                ? "Habis"
                                : product.stock <= 5
                                  ? "Rendah"
                                  : "Normal",
                          }));

                          if (stockData.length > 0) {
                            const headers = [
                              "Nama Produk",
                              "Kategori",
                              "Stok Saat Ini",
                              "Harga",
                              "Nilai Stok",
                              "Status",
                            ];
                            exportToCSV(stockData, "laporan_stok.csv", headers);
                          } else {
                            showAlert(
                              "Tidak Ada Data",
                              "Tidak ada data stok untuk diekspor.",
                              "warning",
                            );
                          }
                        }}
                        className="bg-orange-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-orange-700 transition duration-200"
                      >
                        📦 Ekspor Stok
                      </button>
                    </div>

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
                            <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Status
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
                                  {formatCurrency(
                                    product.price * product.stock,
                                  )}
                                </td>
                                <td className="border border-gray-200 px-3 py-2 text-sm">
                                  {product.stock === 0 && (
                                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                                      Habis
                                    </span>
                                  )}
                                  {product.stock > 0 && product.stock <= 5 && (
                                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                                      Rendah
                                    </span>
                                  )}
                                  {product.stock > 5 && (
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                      Normal
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Shift Reports Content */}
                {activeReportsTab === "shifts" && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg shadow-inner">
                    <h3 className="text-xl font-semibold mb-3 text-gray-800">
                      Laporan Shift
                    </h3>

                    {/* Shift Date Filter */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                      <div className="flex items-end">
                        <button
                          onClick={() => {
                            const filteredShifts = shifts.filter((shift) => {
                              if (!reportStartDate && !reportEndDate)
                                return true;
                              const shiftDate = new Date(shift.startTime);
                              const startDate = reportStartDate
                                ? new Date(reportStartDate)
                                : null;
                              const endDate = reportEndDate
                                ? new Date(reportEndDate)
                                : null;
                              if (startDate && shiftDate < startDate)
                                return false;
                              if (endDate && shiftDate > endDate) return false;
                              return true;
                            });

                            const shiftData = filteredShifts.map((shift) => {
                              const shiftSales = sales.filter(
                                (s) =>
                                  new Date(s.date).toDateString() ===
                                    new Date(shift.startTime).toDateString() &&
                                  s.status === "completed",
                              );
                              const shiftRevenue = shiftSales.reduce(
                                (sum, sale) => sum + sale.totalAmount,
                                0,
                              );

                              return {
                                Tanggal: new Date(
                                  shift.startTime,
                                ).toLocaleDateString("id-ID"),
                                Kasir:
                                  users.find((u) => u.id === shift.userId)
                                    ?.username || "Unknown",
                                "Waktu Mulai": new Date(
                                  shift.startTime,
                                ).toLocaleTimeString("id-ID"),
                                "Waktu Selesai": shift.endTime
                                  ? new Date(shift.endTime).toLocaleTimeString(
                                      "id-ID",
                                    )
                                  : "-",
                                "Total Transaksi": shiftSales.length,
                                "Total Pendapatan": `Rp ${shiftRevenue.toLocaleString("id-ID")}`,
                                Status:
                                  shift.status === "open" ? "Aktif" : "Selesai",
                              };
                            });

                            if (shiftData.length > 0) {
                              const headers = [
                                "Tanggal",
                                "Kasir",
                                "Waktu Mulai",
                                "Waktu Selesai",
                                "Total Transaksi",
                                "Total Pendapatan",
                                "Status",
                              ];
                              exportToCSV(
                                shiftData,
                                "laporan_shift.csv",
                                headers,
                              );
                            } else {
                              showAlert(
                                "Tidak Ada Data",
                                "Tidak ada data shift untuk diekspor.",
                                "warning",
                              );
                            }
                          }}
                          className="bg-purple-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-purple-700 transition duration-200"
                        >
                          🕐 Ekspor Shift
                        </button>
                      </div>
                    </div>

                    {/* Shift Summary Analytics */}
                    {(() => {
                      const filteredShifts = shifts.filter((shift) => {
                        if (!reportStartDate && !reportEndDate) return true;
                        const shiftDate = new Date(shift.startTime);
                        const startDate = reportStartDate
                          ? new Date(reportStartDate)
                          : null;
                        const endDate = reportEndDate
                          ? new Date(reportEndDate)
                          : null;
                        if (startDate && shiftDate < startDate) return false;
                        if (endDate && shiftDate > endDate) return false;
                        return true;
                      });

                      const totalShifts = filteredShifts.length;
                      const activeShifts = filteredShifts.filter(
                        (s) => s.status === "open",
                      ).length;
                      const totalRevenue = filteredShifts.reduce(
                        (sum, shift) => {
                          const shiftSales = sales.filter(
                            (s) =>
                              new Date(s.date).toDateString() ===
                                new Date(shift.startTime).toDateString() &&
                              s.status === "completed",
                          );
                          return (
                            sum +
                            shiftSales.reduce(
                              (saleSum, sale) => saleSum + sale.totalAmount,
                              0,
                            )
                          );
                        },
                        0,
                      );

                      return (
                        <div className="bg-white p-4 rounded-md shadow-sm text-gray-700 mb-4">
                          <h4 className="font-semibold mb-2">
                            Ringkasan Shift
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                              <p className="text-sm text-gray-500">
                                Total Shift
                              </p>
                              <p className="font-bold text-blue-600 text-lg">
                                {totalShifts}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-gray-500">
                                Shift Aktif
                              </p>
                              <p className="font-bold text-green-600 text-lg">
                                {activeShifts}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-gray-500">
                                Shift Selesai
                              </p>
                              <p className="font-bold text-gray-600 text-lg">
                                {totalShifts - activeShifts}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-gray-500">
                                Total Pendapatan
                              </p>
                              <p className="font-bold text-purple-600 text-lg">
                                {formatCurrency(totalRevenue)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="bg-white p-4 rounded-lg shadow-inner overflow-x-auto">
                      <button
                        onClick={() => {
                          const shiftData = shifts.map((shift) => {
                            const shiftSales = sales.filter(
                              (s) =>
                                new Date(s.date).toDateString() ===
                                  new Date(shift.startTime).toDateString() &&
                                s.status === "completed",
                            );
                            const shiftRevenue = shiftSales.reduce(
                              (sum, sale) => sum + sale.totalAmount,
                              0,
                            );

                            return {
                              Tanggal: new Date(
                                shift.startTime,
                              ).toLocaleDateString("id-ID"),
                              Kasir:
                                users.find((u) => u.id === shift.userId)
                                  ?.username || "Unknown",
                              "Waktu Mulai": new Date(
                                shift.startTime,
                              ).toLocaleTimeString("id-ID"),
                              "Waktu Selesai": shift.endTime
                                ? new Date(shift.endTime).toLocaleTimeString(
                                    "id-ID",
                                  )
                                : "-",
                              "Total Transaksi": shiftSales.length,
                              "Total Pendapatan": `Rp ${shiftRevenue.toLocaleString("id-ID")}`,
                              Status:
                                shift.status === "open" ? "Aktif" : "Selesai",
                            };
                          });

                          if (shiftData.length > 0) {
                            const headers = [
                              "Tanggal",
                              "Kasir",
                              "Waktu Mulai",
                              "Waktu Selesai",
                              "Total Transaksi",
                              "Total Pendapatan",
                              "Status",
                            ];
                            exportToCSV(
                              shiftData,
                              "laporan_shift.csv",
                              headers,
                            );
                          } else {
                            showAlert(
                              "Tidak Ada Data",
                              "Tidak ada data shift untuk diekspor.",
                              "warning",
                            );
                          }
                        }}
                        className="bg-purple-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-purple-700 transition duration-200"
                      >
                        🕐 Ekspor Shift
                      </button>
                    </div>

                    {/* Stock Analytics Summary */}
                    <div className="bg-white p-4 rounded-md shadow-sm text-gray-700 mb-4">
                      <h4 className="font-semibold mb-3">
                        Ringkasan Inventori
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Total Produk</p>
                          <p className="font-bold text-blue-600 text-lg">
                            {products.length}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Stok Rendah</p>
                          <p className="font-bold text-red-600 text-lg">
                            {
                              products.filter(
                                (p) => p.stock <= 5 && p.stock > 0,
                              ).length
                            }
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Stok Habis</p>
                          <p className="font-bold text-orange-600 text-lg">
                            {products.filter((p) => p.stock === 0).length}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">
                            Nilai Total Stok
                          </p>
                          <p className="font-bold text-green-600 text-lg">
                            {formatCurrency(
                              products.reduce(
                                (sum, p) => sum + p.stock * p.price,
                                0,
                              ),
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Category Breakdown */}
                      <div className="mt-6">
                        <h5 className="font-semibold mb-3 text-gray-700">
                          Breakdown per Kategori
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(() => {
                            const categoryStats: {
                              [key: string]: {
                                count: number;
                                totalValue: number;
                                lowStock: number;
                              };
                            } = {};

                            products.forEach((product) => {
                              const category =
                                product.category || "Tidak Berkategori";
                              if (!categoryStats[category]) {
                                categoryStats[category] = {
                                  count: 0,
                                  totalValue: 0,
                                  lowStock: 0,
                                };
                              }
                              categoryStats[category].count++;
                              categoryStats[category].totalValue +=
                                product.stock * product.price;
                              if (product.stock <= 5)
                                categoryStats[category].lowStock++;
                            });

                            return Object.entries(categoryStats).map(
                              ([category, stats]) => (
                                <div
                                  key={category}
                                  className="bg-gray-50 p-3 rounded-lg"
                                >
                                  <div className="font-medium text-gray-800 mb-2">
                                    {category}
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 text-sm">
                                    <div>
                                      <span className="text-gray-500">
                                        Produk:
                                      </span>
                                      <div className="font-medium">
                                        {stats.count}
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">
                                        Nilai:
                                      </span>
                                      <div className="font-medium">
                                        {formatCurrency(stats.totalValue)}
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">
                                        Stok Rendah:
                                      </span>
                                      <div className="font-medium text-red-600">
                                        {stats.lowStock}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ),
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-inner overflow-x-auto">
                      <table className="min-w-full border-collapse">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Tanggal
                            </th>
                            <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Kasir
                            </th>
                            <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Waktu Mulai
                            </th>
                            <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Waktu Selesai
                            </th>
                            <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Total Transaksi
                            </th>
                            <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Total Pendapatan
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
                          {shifts.length === 0 ? (
                            <tr>
                              <td
                                colSpan={8}
                                className="border border-gray-200 py-4 text-center text-gray-500"
                              >
                                Tidak ada data shift.
                              </td>
                            </tr>
                          ) : (
                            shifts
                              .filter((shift) => {
                                if (!reportStartDate && !reportEndDate)
                                  return true;
                                const shiftDate = new Date(shift.startTime);
                                const startDate = reportStartDate
                                  ? new Date(reportStartDate)
                                  : null;
                                const endDate = reportEndDate
                                  ? new Date(reportEndDate)
                                  : null;
                                if (startDate && shiftDate < startDate)
                                  return false;
                                if (endDate && shiftDate > endDate)
                                  return false;
                                return true;
                              })
                              .sort(
                                (a, b) =>
                                  new Date(b.startTime).getTime() -
                                  new Date(a.startTime).getTime(),
                              )
                              .map((shift) => {
                                const shiftSales = sales.filter(
                                  (s) =>
                                    new Date(s.date).toDateString() ===
                                      new Date(
                                        shift.startTime,
                                      ).toDateString() &&
                                    s.status === "completed",
                                );
                                const shiftRevenue = shiftSales.reduce(
                                  (sum, sale) => sum + sale.totalAmount,
                                  0,
                                );

                                return (
                                  <tr
                                    key={shift.id}
                                    className="even:bg-gray-50"
                                  >
                                    <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500">
                                      {new Date(
                                        shift.startTime,
                                      ).toLocaleDateString("id-ID")}
                                    </td>
                                    <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500">
                                      {shift.cashierName}
                                    </td>
                                    <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500">
                                      {new Date(
                                        shift.startTime,
                                      ).toLocaleTimeString("id-ID")}
                                    </td>
                                    <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500">
                                      {shift.endTime
                                        ? new Date(
                                            shift.endTime,
                                          ).toLocaleTimeString("id-ID")
                                        : "-"}
                                    </td>
                                    <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500">
                                      {shiftSales.length}
                                    </td>
                                    <td className="border border-gray-200 px-3 py-2 text-sm font-medium text-gray-900">
                                      {formatCurrency(shiftRevenue)}
                                    </td>
                                    <td className="border border-gray-200 px-3 py-2 text-sm">
                                      <span
                                        className={
                                          shift.status === "open"
                                            ? "text-green-600 font-semibold"
                                            : "text-blue-600 font-semibold"
                                        }
                                      >
                                        {shift.status === "open"
                                          ? "Aktif"
                                          : "Selesai"}
                                      </span>
                                    </td>
                                    <td className="border border-gray-200 px-3 py-2 text-sm">
                                      <button
                                        onClick={() => printShiftReport(shift)}
                                        className="text-green-600 hover:text-green-900"
                                      >
                                        Cetak
                                      </button>
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
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm">ID Shift:</p>
                            <p className="font-semibold">{currentShift.id}</p>
                          </div>
                          <div>
                            <p className="text-sm">Waktu Mulai:</p>
                            <p className="font-semibold">
                              {new Date(currentShift.startTime).toLocaleString(
                                "id-ID",
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm">Kas Awal:</p>
                            <p className="font-semibold">
                              {formatCurrency(currentShift.startCash)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm">Transaksi:</p>
                            <p className="font-semibold">
                              {currentShift.salesIds.length}
                            </p>
                          </div>
                        </div>
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
                            <div className="mt-2">
                              <p className="text-sm">Total Pendapatan:</p>
                              <p className="font-bold text-lg">
                                {formatCurrency(salesTotal)}
                              </p>
                            </div>
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
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {shifts.length === 0 ? (
                          <tr>
                            <td
                              colSpan={7}
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
                                          ? "bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                                          : "bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs"
                                      }
                                    >
                                      {shift.status === "open"
                                        ? "Terbuka"
                                        : "Ditutup"}
                                    </span>
                                  </td>
                                  <td className="border border-gray-200 px-3 py-2 text-sm">
                                    {shift.status === "closed" && (
                                      <button
                                        onClick={() => printShiftReport(shift)}
                                        className="text-green-600 hover:text-green-900 flex items-center"
                                        title="Cetak Laporan Shift"
                                      >
                                        <svg
                                          className="w-4 h-4 mr-1"
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
                                        Cetak
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Analytics Dashboard Tab */}
                  {activeReportsTab === "analytics" && (
                    <div className="mt-6 space-y-6">
                      <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                          <svg
                            className="w-6 h-6 mr-2 text-blue-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                          </svg>
                          Analytics Dashboard
                        </h3>

                        {/* Key Performance Indicators */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg text-white">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-blue-100 text-sm">
                                  Total Sales (30d)
                                </p>
                                <p className="text-2xl font-bold">
                                  {formatCurrency(
                                    sales
                                      .filter((sale) => {
                                        try {
                                          return (
                                            new Date(sale.date) >=
                                              new Date(
                                                Date.now() -
                                                  30 * 24 * 60 * 60 * 1000,
                                              ) && sale.status === "completed"
                                          );
                                        } catch (e) {
                                          return false;
                                        }
                                      })
                                      .reduce(
                                        (sum, sale) =>
                                          sum + (sale.totalAmount || 0),
                                        0,
                                      ),
                                  )}
                                </p>
                              </div>
                              <svg
                                className="w-8 h-8 text-blue-200"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                                />
                              </svg>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg text-white">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-green-100 text-sm">
                                  Transactions (30d)
                                </p>
                                <p className="text-2xl font-bold">
                                  {
                                    sales.filter((sale) => {
                                      try {
                                        return (
                                          new Date(sale.date) >=
                                            new Date(
                                              Date.now() -
                                                30 * 24 * 60 * 60 * 1000,
                                            ) && sale.status === "completed"
                                        );
                                      } catch (e) {
                                        return false;
                                      }
                                    }).length
                                  }
                                </p>
                              </div>
                              <svg
                                className="w-8 h-8 text-green-200"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                                />
                              </svg>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg text-white">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-purple-100 text-sm">
                                  Avg Transaction
                                </p>
                                <p className="text-2xl font-bold">
                                  {(() => {
                                    try {
                                      const recentSales = sales.filter(
                                        (sale) =>
                                          new Date(sale.date) >=
                                            new Date(
                                              Date.now() -
                                                30 * 24 * 60 * 60 * 1000,
                                            ) && sale.status === "completed",
                                      );
                                      const avgAmount =
                                        recentSales.length > 0
                                          ? recentSales.reduce(
                                              (sum, sale) =>
                                                sum + (sale.totalAmount || 0),
                                              0,
                                            ) / recentSales.length
                                          : 0;
                                      return formatCurrency(avgAmount);
                                    } catch (e) {
                                      return formatCurrency(0);
                                    }
                                  })()}
                                </p>
                              </div>
                              <svg
                                className="w-8 h-8 text-purple-200"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                />
                              </svg>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-lg text-white">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-orange-100 text-sm">
                                  Active Products
                                </p>
                                <p className="text-2xl font-bold">
                                  {
                                    products.filter((p) => (p.stock || 0) > 0)
                                      .length
                                  }
                                </p>
                                <p className="text-orange-100 text-xs">
                                  of {products.length} total
                                </p>
                              </div>
                              <svg
                                className="w-8 h-8 text-orange-200"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* No Data Message */}
                        {products.length === 0 && sales.length === 0 && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                            <div className="text-yellow-600 mb-2">
                              <svg
                                className="w-12 h-12 mx-auto mb-4"
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
                            </div>
                            <h4 className="text-lg font-medium text-yellow-800 mb-2">
                              Belum Ada Data
                            </h4>
                            <p className="text-yellow-700">
                              Mulai dengan menambahkan produk dan melakukan
                              transaksi untuk melihat analytics yang lebih
                              detail.
                            </p>
                          </div>
                        )}

                        {/* Enhanced Analytics Charts */}
                        {sales.length > 0 && (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                            {/* Sales Trend */}
                            <div className="bg-white p-6 rounded-lg shadow">
                              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                                📈 Tren Penjualan (7 Hari Terakhir)
                              </h4>
                              {(() => {
                                try {
                                  const last7Days = Array.from({ length: 7 }, (_, i) => {
                                    const date = new Date();
                                    date.setDate(date.getDate() - i);
                                    return date.toISOString().split('T')[0];
                                  }).reverse();

                                  const dailySales = last7Days.map(date => {
                                    const dayStart = new Date(date + 'T00:00:00');
                                    const dayEnd = new Date(date + 'T23:59:59');
                                    const daySales = sales.filter(sale => {
                                      const saleDate = new Date(sale.date);
                                      return saleDate >= dayStart && saleDate <= dayEnd && sale.status === 'completed';
                                    });
                                    const total = daySales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
                                    return {
                                      date: new Date(date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }),
                                      total,
                                      count: daySales.length
                                    };
                                  });

                                  const maxTotal = Math.max(...dailySales.map(d => d.total));

                                  return (
                                    <div className="space-y-3">
                                      {dailySales.map((day, index) => (
                                        <div key={index} className="flex items-center space-x-3">
                                          <div className="w-12 text-xs text-gray-600">{day.date}</div>
                                          <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                                            <div
                                              className="bg-gradient-to-r from-blue-500 to-blue-600 h-6 rounded-full flex items-center justify-end pr-2"
                                              style={{ width: maxTotal > 0 ? `${(day.total / maxTotal) * 100}%` : '0%' }}
                                            >
                                              {day.total > 0 && (
                                                <span className="text-xs text-white font-medium">
                                                  {formatCurrency(day.total)}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          <div className="w-8 text-xs text-gray-600">{day.count}</div>
                                        </div>
                                      ))}
                                    </div>
                                  );
                                } catch (error) {
                                  return (
                                    <div className="text-center text-gray-500 py-8">
                                      <p>Error memuat data tren penjualan</p>
                                    </div>
                                  );
                                }
                              })()}
                            </div>

                            {/* Top Products */}
                            <div className="bg-white p-6 rounded-lg shadow">
                              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                                🏆 Produk Terlaris (30 Hari)
                              </h4>
                              {(() => {
                                try {
                                  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                                  const recentSales = sales.filter(sale =>
                                    new Date(sale.date) >= thirtyDaysAgo && sale.status === 'completed'
                                  );

                                  const productSales: { [key: string]: { name: string; quantity: number; revenue: number } } = {};

                                  recentSales.forEach(sale => {
                                    sale.items.forEach(item => {
                                      if (!productSales[item.productId]) {
                                        productSales[item.productId] = {
                                          name: item.name,
                                          quantity: 0,
                                          revenue: 0
                                        };
                                      }
                                      productSales[item.productId].quantity += item.quantity;
                                      productSales[item.productId].revenue += item.price * item.quantity;
                                    });
                                  });

                                  const topProducts = Object.values(productSales)
                                    .sort((a, b) => b.quantity - a.quantity)
                                    .slice(0, 5);

                                  const maxQuantity = Math.max(...topProducts.map(p => p.quantity));

                                  return topProducts.length > 0 ? (
                                    <div className="space-y-3">
                                      {topProducts.map((product, index) => (
                                        <div key={index} className="flex items-center space-x-3">
                                          <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                                            {index + 1}
                                          </div>
                                          <div className="flex-1">
                                            <div className="font-medium text-gray-800 text-sm">{product.name}</div>
                                            <div className="bg-gray-200 rounded-full h-3 mt-1">
                                              <div
                                                className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full"
                                                style={{ width: `${(product.quantity / maxQuantity) * 100}%` }}
                                              />
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <div className="text-sm font-bold text-gray-800">{product.quantity}</div>
                                            <div className="text-xs text-gray-500">{formatCurrency(product.revenue)}</div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-center text-gray-500 py-8">
                                      <p>Belum ada data penjualan produk</p>
                                    </div>
                                  );
                                } catch (error) {
                                  return (
                                    <div className="text-center text-gray-500 py-8">
                                      <p>Error memuat data produk terlaris</p>
                                    </div>
                                  );
                                }
                              })()}
                            </div>
                          </div>
                        )}

                        {/* Data Notice */}
                        {(products.length > 0 || sales.length > 0) && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                            <div className="flex items-center">
                              <svg
                                className="w-5 h-5 text-blue-500 mr-2"
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
                              <p className="text-blue-700 text-sm">
                                Dashboard menampilkan data dari{" "}
                                {products.length} produk dan {sales.length}{" "}
                                transaksi.
                                {sales.length < 5 &&
                                  " Lakukan lebih banyak transaksi untuk analytics yang lebih akurat."}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Key Performance Indicators */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-blue-100 text-sm">
                                Total Sales (30d)
                              </p>
                              <p className="text-2xl font-bold">
                                {formatCurrency(
                                  sales
                                    .filter(
                                      (sale) =>
                                        new Date(sale.date) >=
                                          new Date(
                                            Date.now() -
                                              30 * 24 * 60 * 60 * 1000,
                                          ) && sale.status === "completed",
                                    )
                                    .reduce(
                                      (sum, sale) => sum + sale.totalAmount,
                                      0,
                                    ),
                                )}
                              </p>
                            </div>
                            <svg
                              className="w-8 h-8 text-blue-200"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                              />
                            </svg>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-green-100 text-sm">
                                Transactions (30d)
                              </p>
                              <p className="text-2xl font-bold">
                                {
                                  sales.filter(
                                    (sale) =>
                                      new Date(sale.date) >=
                                        new Date(
                                          Date.now() - 30 * 24 * 60 * 60 * 1000,
                                        ) && sale.status === "completed",
                                  ).length
                                }
                              </p>
                            </div>
                            <svg
                              className="w-8 h-8 text-green-200"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                              />
                            </svg>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-purple-100 text-sm">
                                Avg Transaction
                              </p>
                              <p className="text-2xl font-bold">
                                {(() => {
                                  const recentSales = sales.filter(
                                    (sale) =>
                                      new Date(sale.date) >=
                                        new Date(
                                          Date.now() - 30 * 24 * 60 * 60 * 1000,
                                        ) && sale.status === "completed",
                                  );
                                  const avgAmount =
                                    recentSales.length > 0
                                      ? recentSales.reduce(
                                          (sum, sale) => sum + sale.totalAmount,
                                          0,
                                        ) / recentSales.length
                                      : 0;
                                  return formatCurrency(avgAmount);
                                })()}
                              </p>
                            </div>
                            <svg
                              className="w-8 h-8 text-purple-200"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                              />
                            </svg>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-lg text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-orange-100 text-sm">
                                Active Products
                              </p>
                              <p className="text-2xl font-bold">
                                {products.filter((p) => p.stock > 0).length}
                              </p>
                              <p className="text-orange-100 text-xs">
                                of {products.length} total
                              </p>
                            </div>
                            <svg
                              className="w-8 h-8 text-orange-200"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Sales Trend Chart (Text-based) */}
                      <div className="bg-white p-6 rounded-lg shadow">
                        <h4 className="text-lg font-semibold mb-4 flex items-center">
                          <svg
                            className="w-5 h-5 mr-2 text-blue-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                          </svg>
                          Sales Trend (Last 7 Days)
                        </h4>
                        <div className="space-y-3">
                          {(() => {
                            const last7Days = Array.from(
                              { length: 7 },
                              (_, i) => {
                                const date = new Date();
                                date.setDate(date.getDate() - (6 - i));
                                return date;
                              },
                            );

                            const dailySales = last7Days.map((date) => {
                              const dayStart = new Date(date);
                              dayStart.setHours(0, 0, 0, 0);
                              const dayEnd = new Date(date);
                              dayEnd.setHours(23, 59, 59, 999);

                              const daySales = sales.filter((sale) => {
                                const saleDate = new Date(sale.date);
                                return (
                                  saleDate >= dayStart &&
                                  saleDate <= dayEnd &&
                                  sale.status === "completed"
                                );
                              });

                              return {
                                date: date.toLocaleDateString("id-ID", {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                }),
                                sales: daySales.length,
                                amount: daySales.reduce(
                                  (sum, sale) => sum + sale.totalAmount,
                                  0,
                                ),
                              };
                            });

                            const maxAmount = Math.max(
                              ...dailySales.map((d) => d.amount),
                            );

                            return dailySales.map((day, index) => (
                              <div
                                key={index}
                                className="flex items-center space-x-4"
                              >
                                <div className="w-16 text-sm text-gray-600">
                                  {day.date}
                                </div>
                                <div className="flex-1 bg-gray-100 rounded-full h-6 relative">
                                  <div
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-6 rounded-full flex items-center justify-end pr-2"
                                    style={{
                                      width:
                                        maxAmount > 0
                                          ? `${(day.amount / maxAmount) * 100}%`
                                          : "2%",
                                    }}
                                  >
                                    <span className="text-white text-xs font-medium">
                                      {day.sales > 0 ? `${day.sales}tx` : ""}
                                    </span>
                                  </div>
                                </div>
                                <div className="w-24 text-sm text-gray-700 text-right">
                                  {formatCurrency(day.amount)}
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>

                      {/* Top Products & Payment Methods */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Products */}
                        <div className="bg-white p-6 rounded-lg shadow">
                          <h4 className="text-lg font-semibold mb-4 flex items-center">
                            <svg
                              className="w-5 h-5 mr-2 text-green-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                              />
                            </svg>
                            Top Selling Products (30d)
                          </h4>
                          <div className="space-y-3">
                            {Object.values(getInventoryAnalytics())
                              .sort((a, b) => b.totalSold - a.totalSold)
                              .slice(0, 5)
                              .map((product, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 bg-gray-50 rounded"
                                >
                                  <div>
                                    <p className="font-medium text-gray-800">
                                      {index + 1}. {product.name}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {product.totalSold} sold •{" "}
                                      {product.dailyAverage.toFixed(1)}/day avg
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-lg font-bold text-green-600">
                                      {formatCurrency(
                                        product.totalSold *
                                          (products.find(
                                            (p) => p.name === product.name,
                                          )?.price || 0),
                                      )}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      revenue
                                    </p>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>

                        {/* Payment Methods Analysis */}
                        <div className="bg-white p-6 rounded-lg shadow">
                          <h4 className="text-lg font-semibold mb-4 flex items-center">
                            <svg
                              className="w-5 h-5 mr-2 text-purple-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                              />
                            </svg>
                            Payment Methods (30d)
                          </h4>
                          <div className="space-y-3">
                            {(() => {
                              const recentSales = sales.filter(
                                (sale) =>
                                  new Date(sale.date) >=
                                    new Date(
                                      Date.now() - 30 * 24 * 60 * 60 * 1000,
                                    ) && sale.status === "completed",
                              );

                              const paymentStats = recentSales.reduce(
                                (acc, sale) => {
                                  acc[sale.paymentMethod] =
                                    (acc[sale.paymentMethod] || 0) +
                                    sale.totalAmount;
                                  return acc;
                                },
                                {} as Record<string, number>,
                              );

                              const total = Object.values(paymentStats).reduce(
                                (sum, amount) => sum + amount,
                                0,
                              );

                              const paymentMethods = [
                                {
                                  key: "cash",
                                  name: "Tunai",
                                  color: "bg-green-500",
                                },
                                {
                                  key: "card",
                                  name: "Kartu",
                                  color: "bg-blue-500",
                                },
                                {
                                  key: "ewallet",
                                  name: "E-Wallet",
                                  color: "bg-purple-500",
                                },
                              ];

                              return paymentMethods.map((method) => {
                                const amount = paymentStats[method.key] || 0;
                                const percentage =
                                  total > 0 ? (amount / total) * 100 : 0;

                                return (
                                  <div key={method.key}>
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-sm font-medium text-gray-700">
                                        {method.name}
                                      </span>
                                      <span className="text-sm text-gray-600">
                                        {percentage.toFixed(1)}%
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                                        <div
                                          className={`${method.color} h-2 rounded-full`}
                                          style={{ width: `${percentage}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-sm font-medium text-gray-800 min-w-20">
                                        {formatCurrency(amount)}
                                      </span>
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Inventory Status Overview */}
                      <div className="bg-white p-6 rounded-lg shadow">
                        <h4 className="text-lg font-semibold mb-4 flex items-center">
                          <svg
                            className="w-5 h-5 mr-2 text-yellow-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                            />
                          </svg>
                          Inventory Health Status
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          {(() => {
                            const analytics = getInventoryAnalytics();
                            const statusCounts = {
                              healthy: Object.values(analytics).filter(
                                (p) => p.status === "healthy",
                              ).length,
                              low: Object.values(analytics).filter(
                                (p) => p.status === "low",
                              ).length,
                              critical: Object.values(analytics).filter(
                                (p) => p.status === "critical",
                              ).length,
                              stockout: Object.values(analytics).filter(
                                (p) => p.status === "stockout",
                              ).length,
                            };

                            const statuses = [
                              {
                                key: "healthy",
                                name: "Healthy",
                                color: "bg-green-500",
                                icon: "✅",
                              },
                              {
                                key: "low",
                                name: "Low Stock",
                                color: "bg-yellow-500",
                                icon: "⚠️",
                              },
                              {
                                key: "critical",
                                name: "Critical",
                                color: "bg-orange-500",
                                icon: "🔥",
                              },
                              {
                                key: "stockout",
                                name: "Out of Stock",
                                color: "bg-red-500",
                                icon: "❌",
                              },
                            ];

                            return statuses.map((status) => (
                              <div
                                key={status.key}
                                className="text-center p-4 bg-gray-50 rounded-lg"
                              >
                                <div className="text-2xl mb-2">
                                  {status.icon}
                                </div>
                                <div className="text-2xl font-bold text-gray-800">
                                  {
                                    statusCounts[
                                      status.key as keyof typeof statusCounts
                                    ]
                                  }
                                </div>
                                <div className="text-sm text-gray-600">
                                  {status.name}
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

            {/* Settings Module */}
            {activeModule === "settings" && hasModuleAccess("settings") && (
              <div>
                <h2 className="text-2xl font-semibold mb-6 text-gray-800">
                  Pengaturan
                </h2>

                {/* Settings Tabs */}
                <div className="mb-6">
                  <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                      <button
                        onClick={() => setActiveSettingsTab("general")}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeSettingsTab === "general"
                            ? "border-indigo-500 text-indigo-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        <span className="flex items-center">
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          Pengaturan Umum
                        </span>
                      </button>
                      <button
                        onClick={() => setActiveSettingsTab("receipt")}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeSettingsTab === "receipt"
                            ? "border-indigo-500 text-indigo-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        <span className="flex items-center">
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          Pengaturan Struk
                        </span>
                      </button>
                      <button
                        onClick={() => setActiveSettingsTab("shortcuts")}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeSettingsTab === "shortcuts"
                            ? "border-indigo-500 text-indigo-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        <span className="flex items-center">
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 011-1h1a2 2 0 100-4H7a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                            />
                          </svg>
                          Keyboard Shortcuts
                        </span>
                      </button>
                      <button
                        onClick={() => setActiveSettingsTab("financial")}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeSettingsTab === "financial"
                            ? "border-indigo-500 text-indigo-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        <span className="flex items-center">
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                            />
                          </svg>
                          Keuangan & Pajak
                        </span>
                      </button>
                      <button
                        onClick={() => setActiveSettingsTab("backup")}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeSettingsTab === "backup"
                            ? "border-indigo-500 text-indigo-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        <span className="flex items-center">
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                          Backup Data
                        </span>
                      </button>
                      <button
                        onClick={() => setActiveSettingsTab("printer")}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeSettingsTab === "printer"
                            ? "border-indigo-500 text-indigo-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        <span className="flex items-center">
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a1 1 0 001-1v-4a1 1 0 00-1-1H9a1 1 0 00-1 1v4a1 1 0 001 1z"
                            />
                          </svg>
                          Printer
                        </span>
                      </button>
                      <button
                        onClick={() => setActiveSettingsTab("loyalty")}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeSettingsTab === "loyalty"
                            ? "border-indigo-500 text-indigo-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        <span className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                            />
                          </svg>
                          Loyalty Program
                        </span>
                      </button>
                    </nav>
                  </div>
                </div>

                {/* General Settings Tab */}
                {activeSettingsTab === "general" && (
                  <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                    <form onSubmit={handleSettingsSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-gray-700 font-bold mb-2">
                              Nama Toko:
                            </label>
                            <input
                              type="text"
                              value={settingsForm.storeName || ""}
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
                              Simbol Mata Uang:
                            </label>
                            <input
                              type="text"
                              maxLength={5}
                              value={settingsForm.currencySymbol || ""}
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
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-gray-700 font-bold mb-2">
                              Logo Toko:
                            </label>
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
                {activeSettingsTab === "receipt" && (
                  <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                    <form
                      onSubmit={handleReceiptSettingsSubmit}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Konten Struk
                          </h3>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-gray-700 font-bold mb-2">
                                Teks Header (Opsional):
                              </label>
                              <textarea
                                value={receiptSettingsForm.headerText || ""}
                                onChange={(e) =>
                                  setReceiptSettingsForm({
                                    ...receiptSettingsForm,
                                    headerText: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                                rows={2}
                                placeholder="Teks yang ditampilkan di atas struk"
                              />
                            </div>

                            <div>
                              <label className="block text-gray-700 font-bold mb-2">
                                Pesan Terima Kasih:
                              </label>
                              <textarea
                                value={
                                  receiptSettingsForm.customThankYouMessage ||
                                  "Terima kasih atas pembelian Anda!"
                                }
                                onChange={(e) =>
                                  setReceiptSettingsForm({
                                    ...receiptSettingsForm,
                                    customThankYouMessage: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                                rows={2}
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-gray-700 font-bold mb-2">
                                Teks Footer (Opsional):
                              </label>
                              <textarea
                                value={receiptSettingsForm.footerText || ""}
                                onChange={(e) =>
                                  setReceiptSettingsForm({
                                    ...receiptSettingsForm,
                                    footerText: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                                rows={2}
                                placeholder="Teks yang ditampilkan di bawah struk"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Elemen yang Ditampilkan
                          </h3>

                          <div className="grid grid-cols-1 gap-3">
                            {[
                              { key: "showLogo", label: "Tampilkan Logo" },
                              { key: "showStoreName", label: "Nama Toko" },
                              { key: "showDateTime", label: "Tanggal & Waktu" },
                              {
                                key: "showTransactionId",
                                label: "ID Transaksi",
                              },
                              { key: "showItemTotals", label: "Detail Item" },
                              { key: "showSubtotal", label: "Subtotal" },
                              { key: "showTax", label: "Pajak" },
                              {
                                key: "showPaymentMethod",
                                label: "Metode Pembayaran",
                              },
                              { key: "showChange", label: "Kembalian" },
                              {
                                key: "showThankYouMessage",
                                label: "Pesan Terima Kasih",
                              },
                            ].map((item) => (
                              <label
                                key={item.key}
                                className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                              >
                                <input
                                  type="checkbox"
                                  checked={Boolean(
                                    receiptSettingsForm[
                                      item.key as keyof typeof receiptSettingsForm
                                    ],
                                  )}
                                  onChange={(e) =>
                                    setReceiptSettingsForm({
                                      ...receiptSettingsForm,
                                      [item.key]: e.target.checked,
                                    })
                                  }
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <span className="text-sm font-medium text-gray-700">
                                  {item.label}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex flex-col sm:flex-row gap-4">
                          <button
                            type="submit"
                            className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-3 rounded-md font-semibold hover:from-green-700 hover:to-blue-700 transition duration-200"
                          >
                            Simpan Pengaturan Struk
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowReceiptModal(true)}
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-md font-semibold hover:from-purple-700 hover:to-indigo-700 transition duration-200 flex items-center gap-2"
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
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                            Preview Struk
                          </button>
                        </div>
                      </div>
                    </form>

                    {/* Receipt Preview Section */}
                    <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2 text-purple-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        Preview & Test Print
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Lihat bagaimana struk akan terlihat dengan pengaturan
                        saat ini
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <button
                          onClick={() => setShowReceiptModal(true)}
                          className="bg-blue-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-blue-700 transition duration-200 flex items-center justify-center gap-2"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          Preview Struk
                        </button>
                        <button
                          onClick={handleTestPrint}
                          className="bg-green-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-green-700 transition duration-200 flex items-center justify-center gap-2"
                        >
                          <svg
                            className="w-4 h-4"
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
                          Test Print
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Financial Settings Tab */}
                {activeSettingsTab === "financial" && (
                  <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                    <h3 className="text-xl font-semibold mb-6 text-gray-800">
                      Pengaturan Keuangan & Pajak
                    </h3>

                    <form onSubmit={handleSettingsSubmit} className="space-y-6">
                      {/* Tax Settings */}
                      <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h4 className="text-lg font-semibold mb-4 text-gray-700 flex items-center">
                          <svg
                            className="w-5 h-5 mr-2 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          </svg>
                          Pengaturan Pajak
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-gray-700 font-bold mb-2">
                              Persentase Pajak (%):
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={settingsForm.taxRate || 0}
                              onChange={(e) =>
                                setSettingsForm({
                                  ...settingsForm,
                                  taxRate: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                              placeholder="0.00"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                              Masukkan persentase pajak (contoh: 10 untuk 10%)
                            </p>
                          </div>
                          <div>
                            <label className="block text-gray-700 font-bold mb-2">
                              Jenis Pajak:
                            </label>
                            <select
                              value={settingsForm.taxType || "inclusive"}
                              onChange={(e) =>
                                setSettingsForm({
                                  ...settingsForm,
                                  taxType: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                            >
                              <option value="inclusive">
                                Inclusive (Sudah termasuk dalam harga)
                              </option>
                              <option value="exclusive">
                                Exclusive (Ditambahkan ke harga)
                              </option>
                            </select>
                            <p className="text-sm text-gray-500 mt-1">
                              Pilih apakah pajak sudah termasuk atau ditambahkan
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Discount Settings */}
                      <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h4 className="text-lg font-semibold mb-4 text-gray-700 flex items-center">
                          <svg
                            className="w-5 h-5 mr-2 text-orange-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                            />
                          </svg>
                          Pengaturan Diskon
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-gray-700 font-bold mb-2">
                              Diskon Maksimal (%):
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={settingsForm.maxDiscountPercent || 0}
                              onChange={(e) =>
                                setSettingsForm({
                                  ...settingsForm,
                                  maxDiscountPercent:
                                    parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                              placeholder="0.00"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                              Batas maksimal diskon yang bisa diberikan
                            </p>
                          </div>
                          <div>
                            <label className="block text-gray-700 font-bold mb-2">
                              Diskon Cepat (Rp):
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={settingsForm.quickDiscountAmount || 0}
                              onChange={(e) =>
                                setSettingsForm({
                                  ...settingsForm,
                                  quickDiscountAmount:
                                    parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                              placeholder="0"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                              Jumlah diskon tetap untuk tombol diskon cepat
                            </p>
                          </div>
                        </div>

                        {/* Quick Discount Presets */}
                        <div className="mt-6">
                          <label className="block text-gray-700 font-bold mb-3">
                            Preset Diskon Cepat:
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[5, 10, 15, 20, 25, 30, 50, 100].map((percent) => (
                              <div
                                key={percent}
                                className="flex items-center space-x-2"
                              >
                                <input
                                  type="checkbox"
                                  id={`discount-${percent}`}
                                  checked={
                                    settingsForm.quickDiscountPresets?.includes(
                                      percent,
                                    ) || false
                                  }
                                  onChange={(e) => {
                                    const currentPresets =
                                      settingsForm.quickDiscountPresets || [];
                                    if (e.target.checked) {
                                      setSettingsForm({
                                        ...settingsForm,
                                        quickDiscountPresets: [
                                          ...currentPresets,
                                          percent,
                                        ],
                                      });
                                    } else {
                                      setSettingsForm({
                                        ...settingsForm,
                                        quickDiscountPresets:
                                          currentPresets.filter(
                                            (p) => p !== percent,
                                          ),
                                      });
                                    }
                                  }}
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label
                                  htmlFor={`discount-${percent}`}
                                  className="text-sm text-gray-700"
                                >
                                  {percent}%
                                </label>
                              </div>
                            ))}
                          </div>
                          <p className="text-sm text-gray-500 mt-2">
                            Pilih preset diskon yang akan ditampilkan sebagai
                            tombol cepat
                          </p>
                        </div>
                      </div>

                      {/* Service Charge Settings */}
                      <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h4 className="text-lg font-semibold mb-4 text-gray-700 flex items-center">
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
                              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                          Biaya Layanan
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-gray-700 font-bold mb-2">
                              Biaya Layanan (%):
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={settingsForm.serviceChargePercent || 0}
                              onChange={(e) =>
                                setSettingsForm({
                                  ...settingsForm,
                                  serviceChargePercent:
                                    parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                              placeholder="0.00"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                              Persentase biaya layanan (opsional)
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id="enableServiceCharge"
                              checked={
                                settingsForm.enableServiceCharge || false
                              }
                              onChange={(e) =>
                                setSettingsForm({
                                  ...settingsForm,
                                  enableServiceCharge: e.target.checked,
                                })
                              }
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label
                              htmlFor="enableServiceCharge"
                              className="text-sm font-medium text-gray-700"
                            >
                              Aktifkan Biaya Layanan
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-md font-semibold hover:from-indigo-700 hover:to-purple-700 transition duration-200"
                        >
                          Simpan Pengaturan Keuangan
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Keyboard Shortcuts Tab */}
                {activeSettingsTab === "shortcuts" && (
                  <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                    <KeyboardShortcutsHelp />
                  </div>
                )}

                {/* Backup Data Tab */}
                {activeSettingsTab === "backup" && (
                  <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                    <h3 className="text-xl font-semibold mb-6 text-gray-800">
                      Backup & Restore Data
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Export Data Section */}
                      <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h4 className="text-lg font-semibold mb-4 text-gray-700 flex items-center">
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
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                            />
                          </svg>
                          Export Data (Backup)
                        </h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Ekspor semua data POS ke file JSON untuk backup
                        </p>
                        <div className="space-y-3">
                          <button
                            onClick={() => {
                              const backupData = {
                                timestamp: new Date().toISOString(),
                                version: "1.0",
                                data: {
                                  users,
                                  products,
                                  customers,
                                  sales,
                                  shifts,
                                  settings,
                                },
                              };

                              const dataStr = JSON.stringify(
                                backupData,
                                null,
                                2,
                              );
                              const blob = new Blob([dataStr], {
                                type: "application/json",
                              });
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement("a");
                              link.href = url;
                              link.download = `crema-pos-backup-${new Date().toISOString().split("T")[0]}.json`;
                              link.click();
                              URL.revokeObjectURL(url);

                              showAlert(
                                "Backup Berhasil",
                                "Data berhasil diekspor ke file JSON.",
                                "success",
                              );
                            }}
                            className="w-full bg-blue-600 text-white px-4 py-3 rounded-md font-semibold hover:bg-blue-700 transition duration-200 flex items-center justify-center"
                          >
                            <svg
                              className="w-5 h-5 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            Export Semua Data
                          </button>

                          <button
                            onClick={() => {
                              const backupData = {
                                timestamp: new Date().toISOString(),
                                version: "1.0",
                                data: {
                                  products,
                                  customers,
                                  settings: {
                                    ...settings,
                                    rolePermissions: undefined,
                                  },
                                },
                              };

                              const dataStr = JSON.stringify(
                                backupData,
                                null,
                                2,
                              );
                              const blob = new Blob([dataStr], {
                                type: "application/json",
                              });
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement("a");
                              link.href = url;
                              link.download = `crema-pos-master-data-${new Date().toISOString().split("T")[0]}.json`;
                              link.click();
                              URL.revokeObjectURL(url);

                              showAlert(
                                "Export Berhasil",
                                "Data master berhasil diekspor.",
                                "success",
                              );
                            }}
                            className="w-full bg-green-600 text-white px-4 py-3 rounded-md font-semibold hover:bg-green-700 transition duration-200 flex items-center justify-center"
                          >
                            <svg
                              className="w-5 h-5 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                              />
                            </svg>
                            Export Data Master
                          </button>
                        </div>
                      </div>

                      {/* Import Data Section */}
                      <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h4 className="text-lg font-semibold mb-4 text-gray-700 flex items-center">
                          <svg
                            className="w-5 h-5 mr-2 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                          Import Data (Restore)
                        </h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Import data dari file backup JSON
                        </p>
                        <div className="space-y-3">
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                            <input
                              type="file"
                              accept=".json"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = async (event) => {
                                    try {
                                      const backupData = JSON.parse(
                                        event.target?.result as string,
                                      );

                                      const confirmed = await showConfirm(
                                        "Konfirmasi Import",
                                        "Import data akan mengganti data yang ada. Pastikan Anda sudah backup data sebelumnya. Lanjutkan?",
                                        "warning",
                                      );

                                      if (confirmed) {
                                        if (backupData.data) {
                                          if (backupData.data.users)
                                            setUsers(backupData.data.users);
                                          if (backupData.data.products)
                                            setProducts(
                                              backupData.data.products,
                                            );
                                          if (backupData.data.customers)
                                            setCustomers(
                                              backupData.data.customers,
                                            );
                                          if (backupData.data.sales)
                                            setSales(backupData.data.sales);
                                          if (backupData.data.shifts)
                                            setShifts(backupData.data.shifts);
                                          if (backupData.data.settings)
                                            setSettings({
                                              ...settings,
                                              ...backupData.data.settings,
                                            });

                                          showAlert(
                                            "Import Berhasil",
                                            "Data berhasil diimport dari file backup.",
                                            "success",
                                          );
                                        } else {
                                          showAlert(
                                            "Format Tidak Valid",
                                            "File backup tidak memiliki format yang benar.",
                                            "error",
                                          );
                                        }
                                      }
                                    } catch (error) {
                                      showAlert(
                                        "Error Import",
                                        "Gagal membaca file backup. Pastikan file valid.",
                                        "error",
                                      );
                                    }
                                  };
                                  reader.readAsText(file);
                                }
                              }}
                              className="w-full"
                            />
                            <p className="text-sm text-gray-500 mt-2">
                              Pilih file JSON backup untuk restore data
                            </p>
                          </div>

                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <div className="flex">
                              <svg
                                className="w-5 h-5 text-yellow-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                />
                              </svg>
                              <div className="ml-3">
                                <h3 className="text-sm font-medium text-yellow-800">
                                  Peringatan
                                </h3>
                                <p className="text-sm text-yellow-700 mt-1">
                                  Import data akan mengganti semua data yang
                                  ada. Pastikan backup data saat ini sebelum
                                  melakukan import.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Auto Backup Settings */}
                    <div className="mt-6 bg-white p-6 rounded-lg shadow-sm">
                      <h4 className="text-lg font-semibold mb-4 text-gray-700 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2 text-purple-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Pengaturan Auto Backup
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="autoBackup"
                            checked={settings.autoBackupEnabled || false}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                autoBackupEnabled: e.target.checked,
                              })
                            }
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor="autoBackup"
                            className="text-sm font-medium text-gray-700"
                          >
                            Aktifkan Auto Backup Harian
                          </label>
                        </div>
                        <div>
                          <label className="block text-gray-700 font-medium mb-1 text-sm">
                            Maksimal File Backup:
                          </label>
                          <select
                            value={settings.maxBackupFiles || 7}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                maxBackupFiles: parseInt(e.target.value),
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-purple-500 text-sm"
                          >
                            <option value={3}>3 file</option>
                            <option value={7}>7 file</option>
                            <option value={14}>14 file</option>
                            <option value={30}>30 file</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Printer Settings Tab */}
                {activeSettingsTab === "printer" && (
                  <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                    <h3 className="text-xl font-semibold mb-6 text-gray-800">
                      Pengaturan Thermal Printer
                    </h3>

                    <div className="bg-white p-6 rounded-lg shadow-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Enable Thermal Printer */}
                        <div className="md:col-span-2">
                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={settings.thermalPrinterEnabled || false}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  thermalPrinterEnabled: e.target.checked,
                                })
                              }
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <span className="text-lg font-medium text-gray-700">
                              Aktifkan Thermal Printer
                            </span>
                          </label>
                          <p className="text-sm text-gray-500 mt-2">
                            Mengaktifkan pencetakan otomatis ke thermal printer
                            untuk struk
                          </p>
                        </div>

                        {/* Connection Type */}
                        <div>
                          <label className="block text-gray-700 font-bold mb-2">
                            Jenis Koneksi:
                          </label>
                          <select
                            value={
                              settings.thermalPrinterConnection || "network"
                            }
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                thermalPrinterConnection: e.target.value as
                                  | "network"
                                  | "bluetooth",
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                          >
                            <option value="network">Network/USB</option>
                            <option value="bluetooth">Bluetooth</option>
                          </select>
                        </div>

                        {/* Printer Width */}
                        <div>
                          <label className="block text-gray-700 font-bold mb-2">
                            Lebar Kertas (mm):
                          </label>
                          <select
                            value={settings.thermalPrinterWidth || 58}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                thermalPrinterWidth: parseInt(e.target.value),
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                          >
                            <option value={58}>58mm (Umum)</option>
                            <option value={80}>80mm (Lebar)</option>
                          </select>
                        </div>

                        {/* Network Printer Settings */}
                        {settings.thermalPrinterConnection === "network" && (
                          <div className="md:col-span-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-gray-700 font-bold mb-2">
                                  IP Address Printer:
                                </label>
                                <input
                                  type="text"
                                  value={settings.thermalPrinterIP || ""}
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      thermalPrinterIP: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                                  placeholder="192.168.1.100"
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                  IP address printer thermal di jaringan
                                </p>
                              </div>
                              <div>
                                <label className="block text-gray-700 font-bold mb-2">
                                  Port:
                                </label>
                                <input
                                  type="number"
                                  value={settings.thermalPrinterPort || 9100}
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      thermalPrinterPort: parseInt(
                                        e.target.value,
                                      ),
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                                  placeholder="9100"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Bluetooth Printer Settings */}
                        {settings.thermalPrinterConnection === "bluetooth" && (
                          <div className="md:col-span-2">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                              <h4 className="text-lg font-semibold mb-3 text-blue-800">
                                Pengaturan Bluetooth Printer
                              </h4>

                              <div className="space-y-4">
                                {/* Connection Status */}
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="font-medium text-gray-700">
                                      Status Koneksi:
                                    </span>
                                    <span
                                      className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                                        isBluetoothConnected
                                          ? "bg-green-100 text-green-800"
                                          : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {isBluetoothConnected
                                        ? "Terhubung"
                                        : "Terputus"}
                                    </span>
                                  </div>
                                  {isBluetoothConnected && bluetoothDevice && (
                                    <div className="text-sm text-gray-600">
                                      Device:{" "}
                                      {bluetoothDevice.name || "Unknown"}
                                    </div>
                                  )}
                                </div>

                                {/* Connection Buttons */}
                                <div className="flex space-x-3">
                                  {!isBluetoothConnected ? (
                                    <button
                                      onClick={connectBluetoothPrinter}
                                      disabled={!settings.thermalPrinterEnabled}
                                      className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
                                    >
                                      Hubungkan Bluetooth
                                    </button>
                                  ) : (
                                    <button
                                      onClick={disconnectBluetoothPrinter}
                                      className="bg-red-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-red-700 transition duration-200"
                                    >
                                      Putuskan Koneksi
                                    </button>
                                  )}

                                  {isBluetoothConnected && (
                                    <button
                                      onClick={testBluetoothPrint}
                                      className="bg-green-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-green-700 transition duration-200"
                                    >
                                      Test Print
                                    </button>
                                  )}
                                </div>

                                {/* Instructions */}
                                <div className="bg-white p-3 rounded border">
                                  <h5 className="font-medium text-gray-700 mb-2">
                                    Petunjuk Koneksi Bluetooth:
                                  </h5>
                                  <ul className="text-sm text-gray-600 space-y-1">
                                    <li>
                                      ��� Pastikan printer Bluetooth sudah dalam
                                      mode pairing
                                    </li>
                                    <li>
                                      • Gunakan browser Chrome atau Edge terbaru
                                    </li>
                                    <li>
                                      • Klik "Hubungkan Bluetooth" dan pilih
                                      printer dari daftar
                                    </li>
                                    <li>
                                      • Test print untuk memastikan koneksi
                                      berhasil
                                    </li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Test Print Button for Network Printers */}
                        {settings.thermalPrinterConnection === "network" && (
                          <div className="md:col-span-2">
                            <h4 className="text-lg font-semibold mb-3 text-gray-700">
                              Test Printer
                            </h4>
                            <button
                              onClick={() => {
                                // Create a test sale
                                const testSale: Sale = {
                                  id: "TEST-" + Date.now(),
                                  date: new Date().toISOString(),
                                  items: [
                                    {
                                      productId: "test",
                                      name: "Test Item",
                                      price: 10000,
                                      quantity: 1,
                                    },
                                  ],
                                  totalAmount: 10000,
                                  paymentMethod: "cash",
                                  cashGiven: 15000,
                                  customer: null,
                                  status: "completed",
                                  processedByUserId: currentUser?.id || "test",
                                  shiftId: currentShift?.id || "test",
                                };

                                // Print test receipt
                                printReceipt(testSale);

                                addNotification(
                                  "info",
                                  "Test Print",
                                  "Test receipt telah dikirim untuk dicetak",
                                );
                              }}
                              disabled={!settings.thermalPrinterEnabled}
                              className="bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
                            >
                              🖨️ Test Print Struk
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Instructions */}
                      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-blue-800 mb-2">
                          Petunjuk Penggunaan:
                        </h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>
                            • Pastikan thermal printer sudah terhubung via USB
                            atau jaringan
                          </li>
                          <li>
                            • Untuk printer USB, browser akan meminta izin akses
                            serial port
                          </li>
                          <li>
                            • Untuk printer jaringan, masukkan IP address yang
                            benar
                          </li>
                          <li>
                            • Gunakan "Test Print" untuk memastikan printer
                            berfungsi
                          </li>
                          <li>
                            • Printer thermal mendukung kertas 58mm dan 80mm
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Loyalty Program Settings Tab */}
                {activeSettingsTab === "loyalty" && (
                  <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                    <h3 className="text-xl font-semibold mb-6 text-gray-800">
                      Pengaturan Program Loyalitas
                    </h3>

                    <form onSubmit={handleSettingsSubmit} className="space-y-6">
                      {/* Enable/Disable Loyalty Program */}
                      <div className="bg-white p-6 rounded-lg shadow-sm">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={settings.loyaltyProgramEnabled || false}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                loyaltyProgramEnabled: e.target.checked,
                              })
                            }
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <div>
                            <span className="text-lg font-medium text-gray-700">
                              Aktifkan Program Loyalitas
                            </span>
                            <p className="text-sm text-gray-500">
                              Customer akan mendapat points dari setiap
                              pembelian
                            </p>
                          </div>
                        </label>
                      </div>

                      {settings.loyaltyProgramEnabled && (
                        <>
                          {/* Points Configuration */}
                          <div className="bg-white p-6 rounded-lg shadow-sm">
                            <h4 className="text-lg font-semibold mb-4 text-gray-700">
                              Konfigurasi Points
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label className="block text-gray-700 font-bold mb-2">
                                  Points per 1000 Rupiah:
                                </label>
                                <input
                                  type="number"
                                  min="0.1"
                                  step="0.1"
                                  value={settings.pointsPerPurchase || 1}
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      pointsPerPurchase:
                                        parseFloat(e.target.value) || 1,
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                  Customer mendapat berapa point per 1000 rupiah
                                  belanja
                                </p>
                              </div>
                              <div>
                                <label className="block text-gray-700 font-bold mb-2">
                                  Nilai Tukar Point (Rupiah):
                                </label>
                                <input
                                  type="number"
                                  min="100"
                                  step="100"
                                  value={settings.pointsRedemptionValue || 1000}
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      pointsRedemptionValue:
                                        parseFloat(e.target.value) || 1000,
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                  1 point = berapa rupiah saat ditukar
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Tier Configuration */}
                          <div className="bg-white p-6 rounded-lg shadow-sm">
                            <h4 className="text-lg font-semibold mb-4 text-gray-700">
                              Tier Customer & Benefit
                            </h4>

                            {/* Tier Thresholds */}
                            <div className="mb-6">
                              <h5 className="font-medium text-gray-700 mb-3">
                                Syarat Naik Tier (Total Belanja):
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-gray-600 font-medium mb-1">
                                    Silver:
                                  </label>
                                  <input
                                    type="number"
                                    min="10000"
                                    step="10000"
                                    value={
                                      settings.tierThresholds?.silver || 100000
                                    }
                                    onChange={(e) =>
                                      setSettings({
                                        ...settings,
                                        tierThresholds: {
                                          ...settings.tierThresholds,
                                          silver:
                                            parseFloat(e.target.value) ||
                                            100000,
                                          gold:
                                            settings.tierThresholds?.gold ||
                                            500000,
                                          platinum:
                                            settings.tierThresholds?.platinum ||
                                            1500000,
                                        },
                                      })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-600 font-medium mb-1">
                                    Gold:
                                  </label>
                                  <input
                                    type="number"
                                    min="100000"
                                    step="10000"
                                    value={
                                      settings.tierThresholds?.gold || 500000
                                    }
                                    onChange={(e) =>
                                      setSettings({
                                        ...settings,
                                        tierThresholds: {
                                          ...settings.tierThresholds,
                                          silver:
                                            settings.tierThresholds?.silver ||
                                            100000,
                                          gold:
                                            parseFloat(e.target.value) ||
                                            500000,
                                          platinum:
                                            settings.tierThresholds?.platinum ||
                                            1500000,
                                        },
                                      })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-600 font-medium mb-1">
                                    Platinum:
                                  </label>
                                  <input
                                    type="number"
                                    min="500000"
                                    step="100000"
                                    value={
                                      settings.tierThresholds?.platinum ||
                                      1500000
                                    }
                                    onChange={(e) =>
                                      setSettings({
                                        ...settings,
                                        tierThresholds: {
                                          ...settings.tierThresholds,
                                          silver:
                                            settings.tierThresholds?.silver ||
                                            100000,
                                          gold:
                                            settings.tierThresholds?.gold ||
                                            500000,
                                          platinum:
                                            parseFloat(e.target.value) ||
                                            1500000,
                                        },
                                      })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Tier Benefits */}
                            <div>
                              <h5 className="font-medium text-gray-700 mb-3">
                                Benefit per Tier:
                              </h5>
                              <div className="space-y-4">
                                {[
                                  {
                                    tier: "bronze",
                                    name: "Bronze",
                                    color: "bg-orange-100 border-orange-300",
                                  },
                                  {
                                    tier: "silver",
                                    name: "Silver",
                                    color: "bg-gray-100 border-gray-300",
                                  },
                                  {
                                    tier: "gold",
                                    name: "Gold",
                                    color: "bg-yellow-100 border-yellow-300",
                                  },
                                  {
                                    tier: "platinum",
                                    name: "Platinum",
                                    color: "bg-purple-100 border-purple-300",
                                  },
                                ].map(({ tier, name, color }) => (
                                  <div
                                    key={tier}
                                    className={`p-4 rounded-lg border ${color}`}
                                  >
                                    <h6 className="font-medium text-gray-700 mb-2">
                                      {name} Tier
                                    </h6>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-gray-600 text-sm mb-1">
                                          Points Multiplier:
                                        </label>
                                        <input
                                          type="number"
                                          min="1"
                                          step="0.1"
                                          value={
                                            settings.tierBenefits?.[
                                              tier as keyof typeof settings.tierBenefits
                                            ]?.pointsMultiplier || 1
                                          }
                                          onChange={(e) =>
                                            setSettings({
                                              ...settings,
                                              tierBenefits: {
                                                ...settings.tierBenefits,
                                                [tier]: {
                                                  ...settings.tierBenefits?.[
                                                    tier as keyof typeof settings.tierBenefits
                                                  ],
                                                  pointsMultiplier:
                                                    parseFloat(
                                                      e.target.value,
                                                    ) || 1,
                                                  discountPercent:
                                                    settings.tierBenefits?.[
                                                      tier as keyof typeof settings.tierBenefits
                                                    ]?.discountPercent || 0,
                                                },
                                              },
                                            })
                                          }
                                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-indigo-500 text-sm"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-gray-600 text-sm mb-1">
                                          Discount (%):
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          max="50"
                                          step="1"
                                          value={
                                            settings.tierBenefits?.[
                                              tier as keyof typeof settings.tierBenefits
                                            ]?.discountPercent || 0
                                          }
                                          onChange={(e) =>
                                            setSettings({
                                              ...settings,
                                              tierBenefits: {
                                                ...settings.tierBenefits,
                                                [tier]: {
                                                  ...settings.tierBenefits?.[
                                                    tier as keyof typeof settings.tierBenefits
                                                  ],
                                                  pointsMultiplier:
                                                    settings.tierBenefits?.[
                                                      tier as keyof typeof settings.tierBenefits
                                                    ]?.pointsMultiplier || 1,
                                                  discountPercent:
                                                    parseFloat(
                                                      e.target.value,
                                                    ) || 0,
                                                },
                                              },
                                            })
                                          }
                                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-indigo-500 text-sm"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Loyalty Program Statistics */}
                          <div className="bg-white p-6 rounded-lg shadow-sm">
                            <h4 className="text-lg font-semibold mb-4 text-gray-700">
                              Statistik Program Loyalitas
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600">
                                  {
                                    customers.filter((c) => c.loyaltyPoints > 0)
                                      .length
                                  }
                                </p>
                                <p className="text-sm text-gray-600">
                                  Active Members
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">
                                  {customers
                                    .reduce(
                                      (sum, c) => sum + c.loyaltyPoints,
                                      0,
                                    )
                                    .toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Total Points
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-2xl font-bold text-purple-600">
                                  {
                                    customers.filter(
                                      (c) => c.tier === "Platinum",
                                    ).length
                                  }
                                </p>
                                <p className="text-sm text-gray-600">
                                  Platinum Members
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-2xl font-bold text-yellow-600">
                                  {formatCurrency(
                                    customers.reduce(
                                      (sum, c) => sum + c.totalSpent,
                                      0,
                                    ),
                                  )}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Total Spent
                                </p>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      <div className="pt-4 border-t border-gray-200">
                        <button
                          type="submit"
                          className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-3 rounded-md font-semibold hover:from-green-700 hover:to-blue-700 transition duration-200"
                        >
                          Simpan Pengaturan Loyalitas
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* User Management Module */}
            {activeModule === "user-management" &&
              hasModuleAccess("user-management") && (
                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                    Manajemen Akun Pengguna
                  </h2>
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
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Username
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Peran
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Izin Akses
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredUsers().length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="border border-gray-200 py-4 text-center text-gray-500"
                            >
                              Tidak ada pengguna ditemukan.
                            </td>
                          </tr>
                        ) : (
                          getFilteredUsers().map((user) => (
                            <tr key={user.id} className="even:bg-gray-50">
                              <td className="border border-gray-200 px-3 py-2 text-sm font-medium text-gray-900">
                                {user.username}
                              </td>
                              <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500 capitalize">
                                {user.role}
                              </td>
                              <td className="border border-gray-200 px-3 py-2 text-sm">
                                {currentUser?.id === user.id ? (
                                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                    Online
                                  </span>
                                ) : (
                                  <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                                    Offline
                                  </span>
                                )}
                              </td>
                              <td className="border border-gray-200 px-3 py-2 text-sm">
                                <button
                                  onClick={() => {
                                    setSelectedUserForPermissions(user);
                                    setShowPermissionsModal(true);
                                  }}
                                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs hover:bg-blue-200 transition-colors"
                                >
                                  {settings.rolePermissions[user.role]
                                    ?.length || 0}{" "}
                                  modul
                                </button>
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
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all border border-gray-100">
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">📦</div>
                <h3 className="text-xl font-bold">
                  {editingProduct ? "Edit Produk" : "Tambah Produk Baru"}
                </h3>
              </div>
            </div>
            <form onSubmit={handleProductSubmit} className="p-6 space-y-4">
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
                  Gambar Produk:
                </label>

                {/* Image Preview */}
                <div className="mb-4">
                  {productForm.imageUrl ? (
                    <div className="relative w-32 h-32 mx-auto">
                      <img
                        src={productForm.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg border border-gray-300"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://placehold.co/128x128/cccccc/333333?text=No+Image";
                        }}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setProductForm({ ...productForm, imageUrl: "" })
                        }
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 mx-auto bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Upload Options */}
                <div className="space-y-3">
                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Gambar:
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            showAlert(
                              "File Terlalu Besar",
                              "Ukuran file maksimal 5MB.",
                              "error",
                            );
                            return;
                          }

                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const result = event.target?.result as string;
                            setProductForm({
                              ...productForm,
                              imageUrl: result,
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500 text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Format: JPG, PNG, GIF (maksimal 5MB)
                    </p>
                  </div>

                  {/* URL Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Atau URL Gambar:
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="url"
                        value={
                          productForm.imageUrl &&
                          !productForm.imageUrl.startsWith("data:")
                            ? productForm.imageUrl
                            : ""
                        }
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            imageUrl: e.target.value,
                          })
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500 text-sm"
                        placeholder="https://example.com/image.jpg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const url = (
                            document.querySelector(
                              'input[type="url"]',
                            ) as HTMLInputElement
                          )?.value;
                          if (url) {
                            setProductForm({ ...productForm, imageUrl: url });
                          }
                        }}
                        className="px-3 py-2 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600 transition-colors"
                      >
                        Load
                      </button>
                    </div>
                  </div>

                  {/* Quick Image Options */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Atau pilih gambar cepat:
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        {
                          name: "Kopi",
                          url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=300&fit=crop",
                        },
                        {
                          name: "Makanan",
                          url: "https://images.unsplash.com/photo-1555507036-ab794f575e8c?w=300&h=300&fit=crop",
                        },
                        {
                          name: "Minuman",
                          url: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=300&h=300&fit=crop",
                        },
                        {
                          name: "Dessert",
                          url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&h=300&fit=crop",
                        },
                      ].map((item) => (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() =>
                            setProductForm({
                              ...productForm,
                              imageUrl: item.url,
                            })
                          }
                          className="flex flex-col items-center p-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          <img
                            src={item.url}
                            alt={item.name}
                            className="w-8 h-8 object-cover rounded mb-1"
                          />
                          <span className="text-xs text-gray-600">
                            {item.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
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
              <div className="flex space-x-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowProductModal(false);
                    setEditingProduct(null);
                    setProductForm({
                      name: "",
                      price: 0,
                      stock: 0,
                      imageUrl: "",
                    });
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all border border-gray-100">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">��</div>
                <h3 className="text-xl font-bold">
                  {editingCustomer ? "Edit Pelanggan" : "Tambah Pelanggan Baru"}
                </h3>
              </div>
            </div>
            <form onSubmit={handleCustomerSubmit} className="p-6 space-y-4">
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
              <div className="flex space-x-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomerModal(false);
                    setEditingCustomer(null);
                    setCustomerForm({ name: "", email: "", phone: "" });
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all border border-gray-100">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">����‍💼</div>
                <h3 className="text-xl font-bold">
                  {editingUser ? "Edit Pengguna" : "Tambah Pengguna Baru"}
                </h3>
              </div>
            </div>
            <form onSubmit={handleUserSubmit} className="p-6 space-y-4">
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
              <div className="flex space-x-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserModal(false);
                    setEditingUser(null);
                    setUserForm({ username: "", password: "", role: "kasir" });
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

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all border border-gray-100">
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">💰</div>
                <h3 className="text-xl font-bold">
                  {editingExpense ? "Edit Pengeluaran" : "Tambah Pengeluaran Baru"}
                </h3>
              </div>
            </div>
            <form onSubmit={handleExpenseSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-bold mb-2">
                    Kategori:
                  </label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) =>
                      setExpenseForm({
                        ...expenseForm,
                        category: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-500"
                    required
                  >
                    <option value="inventory">Inventori</option>
                    <option value="operations">Operasional</option>
                    <option value="marketing">Marketing</option>
                    <option value="utilities">Utilitas</option>
                    <option value="salaries">Gaji</option>
                    <option value="rent">Sewa</option>
                    <option value="other">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-2">
                    Metode Pembayaran:
                  </label>
                  <select
                    value={expenseForm.paymentMethod}
                    onChange={(e) =>
                      setExpenseForm({
                        ...expenseForm,
                        paymentMethod: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-500"
                    required
                  >
                    <option value="cash">Tunai</option>
                    <option value="card">Kartu</option>
                    <option value="transfer">Transfer</option>
                    <option value="check">Cek</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Deskripsi:
                </label>
                <input
                  type="text"
                  value={expenseForm.description}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-500"
                  placeholder="Deskripsi pengeluaran..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-bold mb-2">
                    Jumlah (Rp):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={expenseForm.amount || ""}
                    onChange={(e) =>
                      setExpenseForm({
                        ...expenseForm,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-500"
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-2">
                    Supplier/Vendor:
                  </label>
                  <input
                    type="text"
                    value={expenseForm.supplier}
                    onChange={(e) =>
                      setExpenseForm({
                        ...expenseForm,
                        supplier: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-500"
                    placeholder="Nama supplier/vendor..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Nomor Kwitansi/Invoice:
                </label>
                <input
                  type="text"
                  value={expenseForm.receiptNumber}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      receiptNumber: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-500"
                  placeholder="Nomor kwitansi atau invoice..."
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Catatan:
                </label>
                <textarea
                  value={expenseForm.notes}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      notes: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-500"
                  rows={3}
                  placeholder="Catatan tambahan..."
                />
              </div>

              {/* Recurring Options */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3 mb-3">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    checked={expenseForm.isRecurring}
                    onChange={(e) =>
                      setExpenseForm({
                        ...expenseForm,
                        isRecurring: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isRecurring" className="text-gray-700 font-medium">
                    Pengeluaran Berulang
                  </label>
                </div>
                {expenseForm.isRecurring && (
                  <div>
                    <label className="block text-gray-700 font-bold mb-2">
                      Periode:
                    </label>
                    <select
                      value={expenseForm.recurringPeriod}
                      onChange={(e) =>
                        setExpenseForm({
                          ...expenseForm,
                          recurringPeriod: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-500"
                    >
                      <option value="daily">Harian</option>
                      <option value="weekly">Mingguan</option>
                      <option value="monthly">Bulanan</option>
                      <option value="quarterly">Triwulan</option>
                      <option value="yearly">Tahunan</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Tags (pisahkan dengan koma):
                </label>
                <input
                  type="text"
                  value={expenseForm.tags?.join(", ") || ""}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      tags: e.target.value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter((tag) => tag),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-500"
                  placeholder="operasional, bulanan, listrik..."
                />
              </div>

              <div className="flex space-x-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowExpenseModal(false);
                    setEditingExpense(null);
                    setExpenseForm({
                      category: "other",
                      description: "",
                      amount: 0,
                      supplier: "",
                      paymentMethod: "cash",
                      receiptNumber: "",
                      notes: "",
                      isRecurring: false,
                      recurringPeriod: "monthly",
                      tags: [],
                    });
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition duration-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition duration-200 shadow-md"
                >
                  💰 {editingExpense ? "Update" : "Simpan"} Pengeluaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sale Detail Modal */}
      {showSaleDetailModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
              <h3 className="text-xl font-bold flex items-center">
                <svg
                  className="w-6 h-6 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Detail Penjualan
              </h3>
            </div>
            <div className="p-6">
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

                {selectedSale.status === "voided" &&
                  selectedSale.voidReason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                      <p className="text-sm">
                        <strong className="text-red-800">
                          Alasan Pembatalan:
                        </strong>
                      </p>
                      <p className="text-red-700 mt-1">
                        {selectedSale.voidReason}
                      </p>
                      {selectedSale.voidedBy && selectedSale.voidedAt && (
                        <div className="text-xs text-red-600 mt-2">
                          <p>Dibatalkan oleh: {selectedSale.voidedBy}</p>
                          <p>
                            Tanggal:{" "}
                            {new Date(selectedSale.voidedAt).toLocaleString(
                              "id-ID",
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

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
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => printReceipt(selectedSale)}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition duration-200 flex items-center justify-center"
                >
                  <svg
                    className="w-4 h-4 mr-2"
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
                  Cetak Struk
                </button>
                <button
                  onClick={() => {
                    setShowSaleDetailModal(false);
                    setSelectedSale(null);
                  }}
                  className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 rounded-lg font-semibold hover:from-gray-700 hover:to-gray-800 transition duration-200 flex items-center justify-center"
                >
                  <svg
                    className="w-4 h-4 mr-2"
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
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Management Modal */}
      {showPermissionsModal && selectedUserForPermissions && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all border border-gray-100">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">🔐</div>
                <h3 className="text-xl font-bold">
                  Kelola Izin Akses - {selectedUserForPermissions.username}
                </h3>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-6">
                Pilih modul yang dapat diakses oleh user{" "}
                <strong>{selectedUserForPermissions.username}</strong> dengan
                role <strong>{selectedUserForPermissions.role}</strong>:
              </p>

              <div className="space-y-6 mb-6">
                {allModules.map((module) => {
                  const isModuleChecked =
                    settings.rolePermissions[
                      selectedUserForPermissions.role
                    ]?.includes(module.id) || false;

                  // Define submenu options for each module
                  const moduleSubmenus: Record<
                    string,
                    Array<{ id: string; name: string }>
                  > = {
                    "stock-management": [
                      { id: "add", name: "Tambah Produk" },
                      { id: "edit", name: "Edit Produk" },
                      { id: "delete", name: "Hapus Produk" },
                    ],
                    "customer-management": [
                      { id: "add", name: "Tambah Customer" },
                      { id: "edit", name: "Edit Customer" },
                      { id: "delete", name: "Hapus Customer" },
                    ],
                    reports: [
                      { id: "sales", name: "Laporan Penjualan" },
                      { id: "shifts", name: "Laporan Shift" },
                      { id: "stock", name: "Laporan Stok" },
                    ],
                    "shift-management": [
                      { id: "start", name: "Mulai Shift" },
                      { id: "end", name: "Akhiri Shift" },
                    ],
                    "user-management": [
                      { id: "add", name: "Tambah User" },
                      { id: "edit", name: "Edit User" },
                      { id: "delete", name: "Hapus User" },
                      { id: "permissions", name: "Kelola Izin" },
                    ],
                    settings: [
                      { id: "general", name: "Pengaturan Umum" },
                      { id: "receipt", name: "Pengaturan Struk" },
                      { id: "printer", name: "Pengaturan Printer" },
                      { id: "backup", name: "Backup & Restore" },
                    ],
                  };

                  const submenus = moduleSubmenus[module.id] || [];

                  const toggleModulePermission = (checked: boolean) => {
                    const newPermissions = {
                      ...settings.rolePermissions,
                    };
                    if (!newPermissions[selectedUserForPermissions.role]) {
                      newPermissions[selectedUserForPermissions.role] = [];
                    }

                    if (checked) {
                      if (
                        !newPermissions[
                          selectedUserForPermissions.role
                        ].includes(module.id)
                      ) {
                        newPermissions[selectedUserForPermissions.role].push(
                          module.id,
                        );
                      }
                    } else {
                      // Remove main module and all submenus
                      newPermissions[selectedUserForPermissions.role] =
                        newPermissions[selectedUserForPermissions.role].filter(
                          (id) =>
                            id !== module.id && !id.startsWith(`${module.id}.`),
                        );
                    }

                    setSettings({
                      ...settings,
                      rolePermissions: newPermissions,
                    });
                  };

                  const toggleSubmenuPermission = (
                    submenuId: string,
                    checked: boolean,
                  ) => {
                    const newPermissions = {
                      ...settings.rolePermissions,
                    };
                    if (!newPermissions[selectedUserForPermissions.role]) {
                      newPermissions[selectedUserForPermissions.role] = [];
                    }

                    const fullPermission = `${module.id}.${submenuId}`;

                    if (checked) {
                      // Add submenu permission
                      if (
                        !newPermissions[
                          selectedUserForPermissions.role
                        ].includes(fullPermission)
                      ) {
                        newPermissions[selectedUserForPermissions.role].push(
                          fullPermission,
                        );
                      }
                      // Also ensure main module is enabled
                      if (
                        !newPermissions[
                          selectedUserForPermissions.role
                        ].includes(module.id)
                      ) {
                        newPermissions[selectedUserForPermissions.role].push(
                          module.id,
                        );
                      }
                    } else {
                      // Remove submenu permission
                      newPermissions[selectedUserForPermissions.role] =
                        newPermissions[selectedUserForPermissions.role].filter(
                          (id) => id !== fullPermission,
                        );
                    }

                    setSettings({
                      ...settings,
                      rolePermissions: newPermissions,
                    });
                  };

                  return (
                    <div
                      key={module.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      {/* Main Module Checkbox */}
                      <label className="flex items-center space-x-3 mb-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isModuleChecked}
                          onChange={(e) =>
                            toggleModulePermission(e.target.checked)
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{module.icon}</span>
                          <span className="font-semibold text-gray-800">
                            {module.name}
                          </span>
                        </div>
                      </label>

                      {/* Submenu Options */}
                      {submenus.length > 0 && isModuleChecked && (
                        <div className="ml-7 space-y-2 bg-gray-50 p-3 rounded-md">
                          <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">
                            Izin Detail:
                          </p>
                          {submenus.map((submenu) => {
                            const fullPermission = `${module.id}.${submenu.id}`;
                            const isSubmenuChecked =
                              settings.rolePermissions[
                                selectedUserForPermissions.role
                              ]?.includes(fullPermission) || false;

                            return (
                              <label
                                key={submenu.id}
                                className="flex items-center space-x-2 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={isSubmenuChecked}
                                  onChange={(e) =>
                                    toggleSubmenuPermission(
                                      submenu.id,
                                      e.target.checked,
                                    )
                                  }
                                  className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="text-sm text-gray-700">
                                  {submenu.name}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-blue-400 text-lg">ℹ️</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      <strong>Catatan:</strong> Perubahan izin akan diterapkan
                      segera. User perlu login ulang jika sedang aktif untuk
                      melihat perubahan.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPermissionsModal(false);
                    setSelectedUserForPermissions(null);
                  }}
                  className="px-6 py-3 bg-gray-500 text-white rounded-md font-semibold hover:bg-gray-600 transition duration-200"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    showAlert(
                      "Berhasil",
                      `Izin akses untuk ${selectedUserForPermissions.username} telah diperbarui.`,
                      "success",
                    );
                    setShowPermissionsModal(false);
                    setSelectedUserForPermissions(null);
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition duration-200"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hold Bill Modal */}
      {showHoldBillModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              Hold Bill
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Nama Customer (opsional):
                </label>
                <input
                  type="text"
                  value={openBillForm.customerName}
                  onChange={(e) =>
                    setOpenBillForm({
                      ...openBillForm,
                      customerName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                  placeholder="Masukkan nama customer"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Nomor Telepon (opsional):
                </label>
                <input
                  type="text"
                  value={openBillForm.customerPhone}
                  onChange={(e) =>
                    setOpenBillForm({
                      ...openBillForm,
                      customerPhone: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                  placeholder="08xxxxxxxxxx"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Nomor Meja (opsional):
                </label>
                <input
                  type="text"
                  value={openBillForm.tableNumber}
                  onChange={(e) =>
                    setOpenBillForm({
                      ...openBillForm,
                      tableNumber: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                  placeholder="Contoh: Meja 5"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Catatan (opsional):
                </label>
                <textarea
                  value={openBillForm.notes}
                  onChange={(e) =>
                    setOpenBillForm({ ...openBillForm, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500 resize-none"
                  rows={3}
                  placeholder="Catatan tambahan..."
                />
              </div>
            </div>
            <div className="flex space-x-4 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowHoldBillModal(false);
                  setOpenBillForm({
                    customerName: "",
                    customerPhone: "",
                    tableNumber: "",
                    notes: "",
                  });
                }}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md font-semibold hover:bg-gray-600 transition duration-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={saveHeldBill}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md font-semibold hover:bg-yellow-700 transition duration-200"
              >
                Simpan Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Open Bills Modal */}
      {showOpenBillModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                Open Bills
              </h3>
              <button
                onClick={() => setShowOpenBillModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
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
              </button>
            </div>

            {openBills.filter((b) => b.status === "held").length === 0 ? (
              <div className="text-center py-8">
                <svg
                  className="w-16 h-16 mx-auto text-gray-300 mb-4"
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
                <p className="text-gray-500">Tidak ada bill yang disimpan</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {openBills
                  .filter((b) => b.status === "held")
                  .map((bill) => {
                    const { finalTotal } = getOpenBillTotal(bill);
                    const createdDate = new Date(bill.createdAt);

                    return (
                      <div
                        key={bill.id}
                        className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-800">
                              {bill.customerName || "Customer"}
                            </h4>
                            {bill.tableNumber && (
                              <p className="text-sm text-gray-600">
                                {bill.tableNumber}
                              </p>
                            )}
                            {bill.customerPhone && (
                              <p className="text-sm text-gray-600">
                                {bill.customerPhone}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">
                              {createdDate.toLocaleDateString("id-ID")}
                            </p>
                            <p className="text-xs text-gray-400">
                              {createdDate.toLocaleTimeString("id-ID")}
                            </p>
                          </div>
                        </div>

                        <div className="mb-3">
                          <p className="text-sm text-gray-600 mb-2">
                            {bill.items.length} item(s)
                          </p>
                          <div className="space-y-1">
                            {bill.items.slice(0, 3).map((item, index) => (
                              <div
                                key={index}
                                className="flex justify-between text-xs"
                              >
                                <span className="text-gray-600">
                                  {item.name} x {item.quantity}
                                </span>
                                <span className="text-gray-800">
                                  {formatCurrency(item.price * item.quantity)}
                                </span>
                              </div>
                            ))}
                            {bill.items.length > 3 && (
                              <p className="text-xs text-gray-500">
                                +{bill.items.length - 3} item lainnya
                              </p>
                            )}
                          </div>
                        </div>

                        {bill.notes && (
                          <div className="mb-3">
                            <p className="text-xs text-gray-500 italic">
                              "{bill.notes}"
                            </p>
                          </div>
                        )}

                        <div className="border-t pt-3">
                          <div className="flex justify-between items-center mb-3">
                            <span className="font-semibold text-gray-800">
                              Total:
                            </span>
                            <span className="font-bold text-lg text-indigo-600">
                              {formatCurrency(finalTotal)}
                            </span>
                          </div>

                          <div className="flex space-x-2">
                            <button
                              onClick={() => resumeOpenBill(bill.id)}
                              className="flex-1 bg-indigo-600 text-white py-2 px-3 rounded-md text-sm font-semibold hover:bg-indigo-700 transition duration-200"
                            >
                              Buka
                            </button>
                            <button
                              onClick={() => deleteOpenBill(bill.id)}
                              className="bg-red-600 text-white py-2 px-3 rounded-md text-sm font-semibold hover:bg-red-700 transition duration-200"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                {selectedSale ? "Struk Pembayaran" : "Preview Struk"}
              </h3>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
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
              </button>
            </div>

            <div
              className="receipt-preview border p-4 bg-gray-50 rounded text-sm font-mono whitespace-pre-line max-h-96 overflow-y-auto"
              dangerouslySetInnerHTML={{
                __html: selectedSale
                  ? generateReceiptHTML(selectedSale)
                  : generateReceiptHTML(
                      {
                        id: "PREVIEW-" + Date.now(),
                        date: new Date().toISOString(),
                        items: [
                          {
                            id: "preview-item-1",
                            name: "Contoh Produk 1",
                            price: 15000,
                            quantity: 2,
                            subtotal: 30000,
                          },
                          {
                            id: "preview-item-2",
                            name: "Contoh Produk 2",
                            price: 25000,
                            quantity: 1,
                            subtotal: 25000,
                          },
                        ],
                        totalAmount: 59125,
                        paymentMethod: "cash",
                        cashGiven: 60000,
                        customer: "Customer Preview",
                        status: "completed",
                        processedByUserId: currentUser?.id || "preview-user",
                        shiftId: "preview-shift",
                      },
                      true,
                    ),
              }}
            />

            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Tutup
              </button>
              {selectedSale ? (
                <button
                  onClick={() => printReceipt(selectedSale)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Print
                </button>
              ) : (
                <button
                  onClick={handleTestPrint}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
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
                  Test Print
                </button>
              )}
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
