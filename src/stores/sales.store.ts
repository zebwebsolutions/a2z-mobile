import { create } from 'zustand';

export type CartItem = {
  type: 'product' | 'spare_part';
  id: number;
  name: string;
  barcode: string;
  price: number;
  qty: number;
  stock: number;
};

type SalesStore = {
  cart: CartItem[];
  addItem: (item: Omit<CartItem, 'qty'>) => boolean;
  clearCart: () => void;
  total: () => number;
  increment: (barcode: string) => void;
  decrement: (barcode: string) => void;
};

export const useSalesStore = create<SalesStore>((set, get) => ({
  cart: [],

  addItem: (item) => {
  let added = false;

  set((state) => {
    const existing = state.cart.find(
      (c) => c.barcode === item.barcode
    );

    if (existing) {
      if (existing.qty >= existing.stock) {
        return state; // ⛔ blocked
      }

      added = true;
      return {
        cart: state.cart.map((c) =>
          c.barcode === item.barcode
            ? { ...c, qty: c.qty + 1 }
            : c
        ),
      };
    }

    if (item.stock <= 0) {
      return state; // ⛔ out of stock
    }

    added = true;
    return {
      cart: [...state.cart, { ...item, qty: 1 }],
    };
  });

  return added;
},

  clearCart: () => set({ cart: [] }),

  total: () =>
    get().cart.reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    ),

  increment: (barcode) => {
  let updated = false;

  set((state) => ({
    cart: state.cart.map((item) => {
      if (item.barcode !== barcode) return item;
      if (item.qty >= item.stock) return item; // ⛔ block

      updated = true;
      return { ...item, qty: item.qty + 1 };
    }),
  }));

  return updated;
  },



  decrement: (barcode) =>
  set((state) => ({
    cart: state.cart
      .map((item) =>
        item.barcode === barcode
          ? { ...item, qty: item.qty - 1 }
          : item
      )
      .filter((item) => item.qty > 0),
  })),
  
}));
