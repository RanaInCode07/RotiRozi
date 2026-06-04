import React, { useEffect } from 'react';
import { usePosStore } from '../stores/posStore';
import { useNavigate } from 'react-router-dom';

const statusColors: Record<string, string> = {
  FREE: 'bg-green-100 border-green-300 text-green-800',
  OCCUPIED: 'bg-orange-100 border-orange-300 text-orange-800',
  RESERVED: 'bg-blue-100 border-blue-300 text-blue-800',
  BLOCKED: 'bg-gray-200 border-gray-400 text-gray-600',
};

export default function TablesPage() {
  const { tables, fetchTables, setSelectedTable, setOrderType } = usePosStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTables();
    const interval = setInterval(fetchTables, 10000);
    return () => clearInterval(interval);
  }, []);

  const floors = [...new Set(tables.map((t) => t.floor || 'Main'))];

  const handleTableClick = (table: any) => {
    if (table.status === 'FREE') {
      setSelectedTable(table);
      setOrderType('DINE_IN');
      navigate('/pos');
    }
  };

  return (
    <div className="p-6 overflow-y-auto h-full">
      <h1 className="text-2xl font-bold mb-6">Tables</h1>

      <div className="flex gap-4 mb-6">
        {Object.entries(statusColors).map(([status, cls]) => (
          <span key={status} className={`px-3 py-1 rounded-full text-xs border ${cls}`}>
            {status} ({tables.filter((t) => t.status === status).length})
          </span>
        ))}
      </div>

      {floors.map((floor) => (
        <div key={floor} className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">{floor}</h2>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {tables
              .filter((t) => (t.floor || 'Main') === floor)
              .map((table) => (
                <button
                  key={table.id}
                  onClick={() => handleTableClick(table)}
                  className={`p-4 rounded-xl border-2 text-center transition-all hover:shadow-md ${statusColors[table.status]}`}
                >
                  <p className="text-lg font-bold">{table.name}</p>
                  <p className="text-xs mt-1">{table.capacity} seats</p>
                  {table.orders.length > 0 && (
                    <p className="text-xs mt-1 font-medium">
                      {table.orders.length} order{table.orders.length > 1 ? 's' : ''}
                    </p>
                  )}
                </button>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
