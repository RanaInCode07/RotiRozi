import React, { useEffect, useState } from 'react';
import api from '../api/client';

export default function MenuPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCat, setNewCat] = useState('');
  const [newItem, setNewItem] = useState({ name: '', shortcode: '', price: '', categoryId: '', isVeg: true });

  const fetchData = async () => {
    const [catRes, itemRes] = await Promise.all([
      api.get('/categories'),
      api.get('/menu-items'),
    ]);
    setCategories(catRes.data);
    setItems(itemRes.data);
  };

  useEffect(() => { fetchData(); }, []);

  const addCategory = async () => {
    if (!newCat.trim()) return;
    await api.post('/categories', { name: newCat });
    setNewCat('');
    setShowAddCat(false);
    fetchData();
  };

  const addItem = async () => {
    if (!newItem.name || !newItem.shortcode || !newItem.price || !newItem.categoryId) return;
    await api.post('/menu-items', {
      ...newItem,
      price: parseFloat(newItem.price),
    });
    setNewItem({ name: '', shortcode: '', price: '', categoryId: '', isVeg: true });
    setShowAddItem(false);
    fetchData();
  };

  const toggleAvailability = async (id: string) => {
    await api.patch(`/menu-items/${id}/toggle-availability`);
    fetchData();
  };

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Menu Management</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddCat(true)}
            className="px-4 py-2 text-sm bg-gray-800 text-white rounded-lg"
          >
            + Category
          </button>
          <button
            onClick={() => setShowAddItem(true)}
            className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg"
          >
            + Menu Item
          </button>
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddCat && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="font-bold mb-4">Add Category</h3>
            <input
              className="w-full border rounded-lg px-3 py-2 mb-4"
              placeholder="Category name"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowAddCat(false)} className="px-4 py-2 text-sm">Cancel</button>
              <button onClick={addCategory} className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg">Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="font-bold mb-4">Add Menu Item</h3>
            <div className="space-y-3">
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={newItem.categoryId}
                onChange={(e) => setNewItem({ ...newItem, categoryId: e.target.value })}
              >
                <option value="">Select Category</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <input
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Item name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              />
              <div className="flex gap-2">
                <input
                  className="flex-1 border rounded-lg px-3 py-2"
                  placeholder="Shortcode (e.g. BRG1)"
                  value={newItem.shortcode}
                  onChange={(e) => setNewItem({ ...newItem, shortcode: e.target.value.toUpperCase() })}
                />
                <input
                  className="w-28 border rounded-lg px-3 py-2"
                  placeholder="Price"
                  type="number"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newItem.isVeg}
                  onChange={(e) => setNewItem({ ...newItem, isVeg: e.target.checked })}
                />
                Vegetarian
              </label>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setShowAddItem(false)} className="px-4 py-2 text-sm">Cancel</button>
              <button onClick={addItem} className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg">Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Items table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Item</th>
              <th className="text-left px-4 py-3 font-medium">Category</th>
              <th className="text-left px-4 py-3 font-medium">Code</th>
              <th className="text-right px-4 py-3 font-medium">Price</th>
              <th className="text-center px-4 py-3 font-medium">Available</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item: any) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                  {item.name}
                </td>
                <td className="px-4 py-3 text-gray-500">{item.category?.name}</td>
                <td className="px-4 py-3 font-mono text-xs">{item.shortcode}</td>
                <td className="px-4 py-3 text-right font-medium">₹{Number(item.price)}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleAvailability(item.id)}
                    className={`w-10 h-5 rounded-full transition-colors ${
                      item.isAvailable ? 'bg-green-500' : 'bg-gray-300'
                    } relative`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        item.isAvailable ? 'left-5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
