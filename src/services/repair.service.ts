import { api } from './api';

export type Repair = {
  id: number;
  customer_name: string;
  customer_phone: string;
  device_model: string;
  problem_description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled';
  total_cost: number;
  created_at: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
};

export async function fetchRepairs(params?: {
  page?: number;
  search?: string;
  status?: Repair['status'];
}): Promise<PaginatedResponse<Repair>> {
  const res = await api.get('/repairs', { params });
  return res.data;
}

export async function createRepair(payload: {
  customer_name: string;
  customer_phone: string;
  device_model: string;
  imei?: string;
  problem_description: string;
  total_cost?: number;
  status?: 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled';
  parts?: {
    part_name: string;
    quantity: number;
    cost: number;
  }[];
}) {
  const res = await api.post('/repairs', payload);
  return res.data;
}

export async function fetchRepair(id: number) {
  const res = await api.get(`/repairs/${id}`);
  return res.data;
}

export async function updateRepair(
  id: number,
  payload: {
    status?: 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled';
    total_cost?: number;
  }
) {
  const res = await api.patch(`/repairs/${id}`, payload);
  return res.data;
}
