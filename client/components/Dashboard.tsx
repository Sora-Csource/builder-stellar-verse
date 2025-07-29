import React from 'react';

interface DashboardProps {
  sales: any[];
  products: any[];
  customers: any[];
  shifts: any[];
  currentShift: any;
  formatCurrency: (amount: number) => string;
}

const Dashboard: React.FC<DashboardProps> = ({
  sales,
  products,
  customers,
  shifts,
  currentShift,
  formatCurrency
}) => {
  // Calculate today's sales
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaySales = sales.filter(sale => {
    const saleDate = new Date(sale.date);
    return saleDate >= today && sale.status === 'completed';
  });

  // Calculate this month's sales
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthSales = sales.filter(sale => {
    const saleDate = new Date(sale.date);
    return saleDate >= thisMonth && sale.status === 'completed';
  });

  // Calculate statistics
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const monthRevenue = monthSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalRevenue = sales.filter(s => s.status === 'completed').reduce((sum, sale) => sum + sale.totalAmount, 0);
  
  const lowStockProducts = products.filter(p => p.stock <= 5 && p.stock > 0);
  const outOfStockProducts = products.filter(p => p.stock === 0);
  
  const totalProducts = products.length;
  const totalCustomers = customers.length;
  
  // Top selling products (by quantity sold)
  const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
  sales.filter(s => s.status === 'completed').forEach(sale => {
    sale.items.forEach((item: any) => {
      if (!productSales[item.productId]) {
        productSales[item.productId] = {
          name: item.name,
          quantity: 0,
          revenue: 0
        };
      }
      productSales[item.productId].quantity += item.quantity;
      productSales[item.productId].revenue += item.quantity * item.price;
    });
  });
  
  const topProducts = Object.entries(productSales)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Recent sales
  const recentSales = sales
    .filter(s => s.status === 'completed')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Revenue */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Pendapatan Hari Ini</p>
              <p className="text-2xl font-bold">{formatCurrency(todayRevenue)}</p>
              <p className="text-blue-100 text-sm">{todaySales.length} transaksi</p>
            </div>
            <div className="text-3xl opacity-80">
              📈
            </div>
          </div>
        </div>

        {/* This Month's Revenue */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Pendapatan Bulan Ini</p>
              <p className="text-2xl font-bold">{formatCurrency(monthRevenue)}</p>
              <p className="text-green-100 text-sm">{monthSales.length} transaksi</p>
            </div>
            <div className="text-3xl opacity-80">
              💰
            </div>
          </div>
        </div>

        {/* Products Status */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Status Produk</p>
              <p className="text-2xl font-bold">{totalProducts}</p>
              <p className="text-purple-100 text-sm">
                {lowStockProducts.length} rendah, {outOfStockProducts.length} habis
              </p>
            </div>
            <div className="text-3xl opacity-80">
              📦
            </div>
          </div>
        </div>

        {/* Current Shift */}
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm">Shift Saat Ini</p>
              {currentShift ? (
                <>
                  <p className="text-2xl font-bold">Aktif</p>
                  <p className="text-indigo-100 text-sm">{currentShift.salesIds.length} penjualan</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold">Tutup</p>
                  <p className="text-indigo-100 text-sm">Tidak ada shift aktif</p>
                </>
              )}
            </div>
            <div className="text-3xl opacity-80">
              ⏰
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white p-6 rounded-lg shadow-lg border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Produk Terlaris</h3>
          {topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="bg-indigo-100 text-indigo-800 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.quantity} terjual</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(product.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Belum ada data penjualan produk</p>
          )}
        </div>

        {/* Recent Sales */}
        <div className="bg-white p-6 rounded-lg shadow-lg border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Penjualan Terbaru</h3>
          {recentSales.length > 0 ? (
            <div className="space-y-3">
              {recentSales
                .filter((sale, index, self) =>
                  self.findIndex(s => s.id === sale.id) === index
                )
                .map((sale, index) => (
                <div key={`dashboard-sale-${sale.id}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">#{sale.id.slice(-8)}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(sale.date).toLocaleString('id-ID')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {sale.items.length} item - {sale.paymentMethod === 'cash' ? 'Tunai' : sale.paymentMethod === 'card' ? 'Kartu' : 'E-Wallet'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(sale.totalAmount)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Belum ada penjualan</p>
          )}
        </div>
      </div>

      {/* Alerts Section */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low Stock Alert */}
          {lowStockProducts.length > 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-800 mb-4">⚠️ Stok Rendah</h3>
              <div className="space-y-2">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex justify-between items-center">
                    <span className="text-yellow-700">{product.name}</span>
                    <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-sm font-semibold">
                      {product.stock} tersisa
                    </span>
                  </div>
                ))}
                {lowStockProducts.length > 5 && (
                  <p className="text-yellow-600 text-sm">+{lowStockProducts.length - 5} produk lainnya</p>
                )}
              </div>
            </div>
          )}

          {/* Out of Stock Alert */}
          {outOfStockProducts.length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-red-800 mb-4">🚫 Stok Habis</h3>
              <div className="space-y-2">
                {outOfStockProducts.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex justify-between items-center">
                    <span className="text-red-700">{product.name}</span>
                    <span className="bg-red-200 text-red-800 px-2 py-1 rounded text-sm font-semibold">
                      Habis
                    </span>
                  </div>
                ))}
                {outOfStockProducts.length > 5 && (
                  <p className="text-red-600 text-sm">+{outOfStockProducts.length - 5} produk lainnya</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Aksi Cepat</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
              <div className="text-2xl mb-2">🛒</div>
              <p className="text-sm font-medium text-gray-700">Entri Pesanan</p>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
              <div className="text-2xl mb-2">📦</div>
              <p className="text-sm font-medium text-gray-700">Kelola Stok</p>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
              <div className="text-2xl mb-2">👥</div>
              <p className="text-sm font-medium text-gray-700">Kelola Pelanggan</p>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
              <div className="text-2xl mb-2">📊</div>
              <p className="text-sm font-medium text-gray-700">Lihat Laporan</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
