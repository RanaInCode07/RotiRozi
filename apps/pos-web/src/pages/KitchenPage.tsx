import React, { useEffect, useState } from 'react';
import api from '../api/client';

interface KotItem {
  id: string;
  quantity: number;
  status: string;
  orderItem: {
    menuItem: { name: string; shortcode: string };
    notes?: string;
  };
}

interface Kot {
  id: string;
  kotNumber: number;
  status: string;
  createdAt: string;
  order: { id: string; orderType: string; table?: { name: string } };
  kotItems: KotItem[];
}

export default function KitchenPage() {
  const [kots, setKots] = useState<Kot[]>([]);
  const [filter, setFilter] = useState('OPEN');

  const fetchKots = async () => {
    const res = await api.get('/kots', { params: { status: filter || undefined } });
    setKots(res.data);
  };

  useEffect(() => {
    fetchKots();
    const interval = setInterval(fetchKots, 5000);
    return () => clearInterval(interval);
  }, [filter]);

  const markComplete = async (kotId: string) => {
    await api.patch(`/kots/${kotId}/status`, { status: 'COMPLETED' });
    fetchKots();
  };

  const markItemDone = async (itemId: string) => {
    await api.patch(`/kots/items/${itemId}/status`, { status: 'PREPARED' });
    fetchKots();
  };

  return (
    <div className="p-6 overflow-y-auto h-full bg-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Kitchen Display</h1>
        <div className="flex gap-2">
          {['OPEN', 'PREPARING', 'COMPLETED'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded-full text-xs ${
                filter === s ? 'bg-orange-500 text-white' : 'bg-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kots.map((kot) => (
          <div key={kot.id} className="bg-white rounded-xl border p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-lg font-bold text-orange-600">KOT #{kot.kotNumber}</span>
                <span className="ml-2 text-xs text-gray-500">
                  {kot.order?.table?.name || kot.order?.orderType}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(kot.createdAt).toLocaleTimeString()}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              {kot.kotItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-2 rounded ${
                    item.status === 'PREPARED' ? 'bg-green-50 line-through opacity-60' : 'bg-gray-50'
                  }`}
                >
                  <div>
                    <span className="text-sm font-medium">
                      {item.orderItem.menuItem.name}
                    </span>
                    <span className="ml-2 text-sm text-orange-600 font-bold">
                      × {item.quantity}
                    </span>
                  </div>
                  {item.status !== 'PREPARED' && (
                    <button
                      onClick={() => markItemDone(item.id)}
                      className="text-xs bg-green-500 text-white px-2 py-1 rounded"
                    >
                      Done
                    </button>
                  )}
                </div>
              ))}
            </div>

            {kot.status !== 'COMPLETED' && (
              <button
                onClick={() => markComplete(kot.id)}
                className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-medium"
              >
                Complete KOT
              </button>
            )}
          </div>
        ))}
        {kots.length === 0 && (
          <p className="col-span-full text-center text-gray-400 py-12">
            No KOTs to display
          </p>
        )}
      </div>
    </div>
  );
}
