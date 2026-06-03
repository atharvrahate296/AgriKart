export default function VendorDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-4xl font-bold text-gray-900">Vendor Dashboard</h1>
      <p className="text-gray-600 mt-4">Manage your products, orders, and inventory here.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
        {/* Statistics Cards */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Total Products</h3>
          <p className="text-4xl font-bold text-green-600 mt-2">42</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Pending Orders</h3>
          <p className="text-4xl font-bold text-blue-600 mt-2">8</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Monthly Revenue</h3>
          <p className="text-4xl font-bold text-purple-600 mt-2">₹2,45,000</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Recent Orders */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="border-b pb-3 flex justify-between">
                <span className="text-gray-700">Order #{1000 + i}</span>
                <span className="text-green-600 font-semibold">₹{5000 + i * 1000}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Low Stock Items</h3>
          <div className="space-y-3">
            {['Seeds', 'Fertilizer', 'Pesticide'].map((item, i) => (
              <div key={i} className="border-b pb-3 flex justify-between">
                <span className="text-gray-700">{item}</span>
                <span className="text-red-600 font-semibold">{10 - i * 2} units</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
