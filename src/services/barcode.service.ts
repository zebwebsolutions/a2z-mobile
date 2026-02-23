import { api } from './api';

export type ScanResult = {
  type: 'product' | 'spare_part';
  id: number;
  name: string;
  barcode: string;
  price: number;
  stock: number;
};

export async function findProductByBarcode(
  barcode: string
): Promise<ScanResult | null> {
  try {
    const res = await api.get(`/products/barcode/${barcode}`);

    const data = res.data;

    return {
      type: data.type,
      id: data.id,
      name: data.name,
      barcode: barcode,
      price: Number(data.price),
      stock: Number(data.stock),
    };
  } catch (err: any) {
    if (err.response?.status === 404) {
      return null;
    }

    throw new Error('Network error');
  }
}