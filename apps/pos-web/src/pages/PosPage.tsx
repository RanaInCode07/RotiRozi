import React, { useEffect, useState } from 'react';
import { usePosStore } from '../stores/posStore';

export default function PosPage() {
  const {
    categories,
    menuItems,
    cart,
    selectedTable,
    tables,
    orderType,
    fetchMenu,
    fetchCategories,
    fetchTables,
    addToCart,
    removeFromCart,
    updateCartQty,
    clearCart,
    setSelectedTable,
    setOrderType,
    placeOrder,
  } = usePosStore();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchMenu();
    fetchTables();
  }, []);

  const filteredItems = menuItems.filter((item) => {
    if (!item.isAvailable) return false;
    if (selectedCategory && item.category.id !== selectedCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.shortcode.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const cartTotal = cart.reduce((sum, c) => sum + Number(c.menuItem.price) * c.quantity, 0);

  const handlePlaceOrder = async () => {
    try {
      setPlacing(true);
      await placeOrder();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setPlacing(false);
    }
  };

  const freeTables = tables.filter((t) => t.status === 'FREE');

  return (
    <div className="flex h-full">
      {/* Left: Menu */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search + Categories */}
        <div className="p-4 border-b bg-white">
          <input
            type="text"
            placeholder="Search by name or shortcode..."
            className="w-full px-3 py-2 border rounded-lg text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${
                !selectedCategory ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${
                  selectedCategory === cat.id ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 content-start">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              onClick={() => addToCart(item)}
              className="bg-white border rounded-xl p-3 text-left hover:border-orange-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between">
                <span className={`w-3 h-3 rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-xs text-gray-400 font-mono">{item.shortcode}</span>
              </div>
              <p className="mt-1 text-sm font-medium text-gray-900 line-clamp-2">{item.name}</p>
              <p className="mt-1 text-sm font-bold text-orange-600">₹{Number(item.price)}</p>
            </button>
          ))}
          {filteredItems.length === 0 && (
            <p className="col-span-full text-center text-gray-400 py-12">No items found</p>
          )}
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-80 lg:w-96 bg-white border-l flex flex-col">
        {/* Order type + table */}
        <div className="p-4 border-b space-y-3">
          <div className="flex gap-1">
            {(['DINE_IN', 'TAKEAWAY', 'DELIVERY'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setOrderType(t)}
                className={`flex-1 py-1.5 text-xs rounded ${
                  orderType === t ? 'bg-orange-500 text-white' : 'bg-gray-100'
                }`}
              >
                {t.replace('_', ' ')}
              </button>
            ))}
          </div>
          {orderType === 'DINE_IN' && (
            <select
              className="w-full px-3 py-2 border rounded text-sm"
              value={selectedTable?.id || ''}
              onChange={(e) => {
                const t = tables.find((tb) => tb.id === e.target.value);
                setSelectedTable(t || null);
              }}
            >
              <option value="">Select Table</option>
              {freeTables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.capacity} seats){t.floor ? ` - ${t.floor}` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">Cart is empty</p>
          ) : (
            cart.map((c) => (
              <div key={c.menuItem.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.menuItem.name}</p>
                  <p className="text-xs text-gray-500">₹{Number(c.menuItem.price)} each</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateCartQty(c.menuItem.id, c.quantity - 1)}
                    className="w-6 h-6 rounded bg-gray-200 text-sm font-bold"
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-sm">{c.quantity}</span>
                  <button
                    onClick={() => updateCartQty(c.menuItem.id, c.quantity + 1)}
                    className="w-6 h-6 rounded bg-gray-200 text-sm font-bold"
                  >
                    +
                  </button>
                </div>
                <p className="w-16 text-right text-sm font-medium">
                  ₹{(Number(c.menuItem.price) * c.quantity).toFixed(0)}
                </p>
                <button
                  onClick={() => removeFromCart(c.menuItem.id)}
                  className="text-red-400 hover:text-red-600 text-xs"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {/* Cart footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">₹{cartTotal.toFixed(0)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold mb-3">
            <span>Total</span>
            <span className="text-orange-600">₹{cartTotal.toFixed(0)}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              className="flex-1 py-2.5 text-sm border rounded-lg hover:bg-gray-100 disabled:opacity-40"
            >
              Clear
            </button>
            <button
              onClick={handlePlaceOrder}
              disabled={cart.length === 0 || placing || (orderType === 'DINE_IN' && !selectedTable)}
              className="flex-[2] py-2.5 text-sm bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-40"
            >
              {placing ? 'Placing...' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
