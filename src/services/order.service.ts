import { api } from './api';

export type SubmitOrderPayload = {
  payment_method: 'cash' | 'card';
  total: number;
  discount?: number;

  customer_name?: string;
  customer_phone?: string;
  customer_type?: 'vip' | 'good' | 'normal' | 'bad';
  receipt_language?: 'en' | 'ar';

  items: {
    id: number;      // product_id (backend expects this)
    price: number;
    qty: number;
  }[];
};

export async function submitOrder(payload: SubmitOrderPayload) {
  // Normalize payload (important for mobile inputs)
  const normalizedPayload = {
    payment_method: payload.payment_method,
    total: Number(payload.total) || 0,
    discount: Number(payload.discount) || 0,

    customer_name: payload.customer_name || null,
    customer_phone: payload.customer_phone || null,
    customer_type: payload.customer_type || null,
    receipt_language: payload.receipt_language || 'en',

    items: payload.items.map((item) => ({
      id: item.id,
      price: Number(item.price) || 0,
      qty: Number(item.qty) || 1,
    })),
  };

  const res = await api.post('/orders', normalizedPayload);
  return res.data;
}
