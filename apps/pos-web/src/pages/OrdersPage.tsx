import React, { useEffect, useState } from 'react';
import { usePosStore } from '../stores/posStore';

const statusBadge: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PREPARING: 'bg-yellow-100 text-yellow-700',
  READY: 'bg-green-100 text-green-700',
  SERVED: 'bg-purple-100 text-purple-700',
  BILLED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function OrdersPage() {
  const { activeOrders, fetchActiveOrders, updateOrderStatus, recordPayment } = usePosStore();
  const [filter, setFilter] = useState('');
  const [payingOrder, setPayingOrder] = useState<string | null>(null);
  const [payMode, setPayMode] = useState('CASH');

  useEffect(() => {
    fetchActiveOrders();
    const interval = setInterval(fetchActiveOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const filtered = activeOrders.filter((o: any) =>
    filter ? o.status === filter : true,
  );

  const handlePay = async (order: any) => {
    const remaining =
      Number(order.netAmount) -
      (order.payments || []).reduce((s: number, p: any) => s + Number(p.amount), 0);
    await recordPayment(order.id, payMode, remaining);
    setPayingOrder(null);
  };

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <div className="flex gap-2">
          {['', 'DRAFT', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded-full text-xs ${
                filter === s ? 'bg-orange-500 text-white' : 'bg-gray-100'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((order: any) => {
          const totalPaid = (order.payments || []).reduce(
            (s: number, p: any) => s + Number(p.amount), 0,
          );
          return (
            <div key={order.id} className="bg-white rounded-xl border p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadge[order.status]}`}>
                    {order.status}
                  </span>
                  <span className="text-sm text-gray-500">
                    {order.table?.name || order.orderType}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <span className="font-bold text-lg">₹{Number(order.netAmount).toFixed(0)}</span>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {order.orderItems?.map((oi: any) => (
                  <span key={oi.id} className="text-xs bg-gray-50 px-2 py-1 rounded">
                    {oi.menuItem?.name || oi.menuItem?.shortcode} × {oi.quantity}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {order.status === 'DRAFT' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'CONFIRMED')}
                    className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded-lg"
                  >
                    Confirm
                  </button>
                )}
                {order.status === 'CONFIRMED' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                    className="px-3 py-1.5 text-xs bg-yellow-500 text-white rounded-lg"
                  >
                    Start Preparing
                  </button>
                )}
                {order.status === 'PREPARING' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'READY')}
                    className="px-3 py-1.5 text-xs bg-green-500 text-white rounded-lg"
                  >
                    Mark Ready
                  </button>
                )}
                {order.status === 'READY' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'SERVED')}
                    className="px-3 py-1.5 text-xs bg-purple-500 text-white rounded-lg"
                  >
                    Mark Served
                  </button>
                )}
                {['SERVED', 'DRAFT', 'CONFIRMED'].includes(order.status) && totalPaid < Number(order.netAmount) && (
                  payingOrder === order.id ? (
                    <div className="flex items-center gap-2">
                      <select
                        className="text-xs border rounded px-2 py-1"
                        value={payMode}
                        onChange={(e) => setPayMode(e.target.value)}
                      >
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="CARD">Card</option>
                      </select>
                      <button
                        onClick={() => handlePay(order)}
                        className="px-3 py-1.5 text-xs bg-emerald-500 text-white rounded-lg"
                      >
                        Pay ₹{(Number(order.netAmount) - totalPaid).toFixed(0)}
                      </button>
                      <button
                        onClick={() => setPayingOrder(null)}
                        className="text-xs text-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setPayingOrder(order.id)}
                      className="px-3 py-1.5 text-xs bg-emerald-500 text-white rounded-lg"
                    >
                      Settle Bill
                    </button>
                  )
                )}
                {['DRAFT', 'CONFIRMED', 'PREPARING'].includes(order.status) && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                    className="px-3 py-1.5 text-xs bg-red-500 text-white rounded-lg"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 py-12">No orders</p>
        )}
      </div>
    </div>
  );
}
