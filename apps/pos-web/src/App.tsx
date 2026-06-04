import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import PosPage from './pages/PosPage';
import TablesPage from './pages/TablesPage';
import OrdersPage from './pages/OrdersPage';
import KitchenPage from './pages/KitchenPage';
import MenuPage from './pages/MenuPage';

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}

function App() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/pos"
          element={
            <ProtectedRoute>
              <AppLayout><PosPage /></AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tables"
          element={
            <ProtectedRoute>
              <AppLayout><TablesPage /></AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <AppLayout><OrdersPage /></AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/kitchen"
          element={
            <ProtectedRoute>
              <AppLayout><KitchenPage /></AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/menu"
          element={
            <ProtectedRoute>
              <AppLayout><MenuPage /></AppLayout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/pos" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
