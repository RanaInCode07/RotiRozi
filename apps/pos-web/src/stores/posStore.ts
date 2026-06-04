import { create } from 'zustand';
import api from '../api/client';

interface MenuItem {
  id: string;
  name: string;
  shortcode: string;
  price: number;
  isVeg: boolean;
  isAvailable: boolean;
  category: { id: string; name: string };
}

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

interface Table {
  id: string;
  name: string;
  capacity: number;
  status: string;
  floor: string | null;
  orders: any[];
}

interface Category {
  id: string;
  name: string;
  sortOrder: number;
}

interface PosState {
  categories: Category[];
  menuItems: MenuItem[];
  tables: Table[];
  cart: CartItem[];
  selectedTable: Table | null;
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  activeOrders: any[];

  fetchMenu: (outletId?: string) => Promise<void>;
  fetchCategories: (outletId?: string) => Promise<void>;
  fetchTables: (outletId?: string) => Promise<void>;
  fetchActiveOrders: (outletId?: string) => Promise<void>;

  addToCart: (item: MenuItem) => void;
  removeFromCart: (menuItemId: string) => void;
  updateCartQty: (menuItemId: string, qty: number) => void;
  clearCart: () => void;
  setSelectedTable: (table: Table | null) => void;
  setOrderType: (type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY') => void;

  placeOrder: () => Promise<any>;
  updateOrderStatus: (orderId: string, status: string) => Promise<void>;
  recordPayment: (orderId: string, mode: string, amount: number) => Promise<void>;
}

export const usePosStore = create<PosState>((set, get) => ({
  categories: [],
  menuItems: [],
  tables: [],
  cart: [],
  selectedTable: null,
  orderType: 'DINE_IN',
  activeOrders: [],

  fetchCategories: async (outletId) => {
    const params = outletId ? { outletId } : {};
    const res = await api.get('/categories', { params });
    set({ categories: res.data });
  },

  fetchMenu: async (outletId) => {
    const params = outletId ? { outletId } : {};
    const res = await api.get('/menu-items', { params });
    set({ menuItems: res.data });
  },

  fetchTables: async (outletId) => {
    const params = outletId ? { outletId } : {};
    const res = await api.get('/tables', { params });
    set({ tables: res.data });
  },

  fetchActiveOrders: async (outletId) => {
    const params: any = {};
    if (outletId) params.outletId = outletId;
    const res = await api.get('/orders', { params });
    set({ activeOrders: res.data });
  },

  addToCart: (item) => {
    const cart = [...get().cart];
    const existing = cart.find((c) => c.menuItem.id === item.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ menuItem: item, quantity: 1 });
    }
    set({ cart });
  },

  removeFromCart: (menuItemId) => {
    set({ cart: get().cart.filter((c) => c.menuItem.id !== menuItemId) });
  },

  updateCartQty: (menuItemId, qty) => {
    if (qty <= 0) {
      get().removeFromCart(menuItemId);
      return;
    }
    const cart = get().cart.map((c) =>
      c.menuItem.id === menuItemId ? { ...c, quantity: qty } : c,
    );
    set({ cart });
  },

  clearCart: () => set({ cart: [], selectedTable: null }),

  setSelectedTable: (table) => set({ selectedTable: table }),

  setOrderType: (type) => set({ orderType: type }),

  placeOrder: async () => {
    const { cart, selectedTable, orderType } = get();
    if (cart.length === 0) throw new Error('Cart is empty');

    const res = await api.post('/orders', {
      tableId: selectedTable?.id,
      orderType,
      items: cart.map((c) => ({
        menuItemId: c.menuItem.id,
        quantity: c.quantity,
        notes: c.notes,
      })),
    });

    get().clearCart();
    get().fetchActiveOrders();
    get().fetchTables();
    return res.data;
  },

  updateOrderStatus: async (orderId, status) => {
    await api.patch(`/orders/${orderId}/status`, { status });
    get().fetchActiveOrders();
    get().fetchTables();
  },

  recordPayment: async (orderId, mode, amount) => {
    await api.post(`/orders/${orderId}/payments`, { mode, amount });
    get().fetchActiveOrders();
    get().fetchTables();
  },
}));
