import { create } from 'zustand';

type ScanStore = {
  barcode: string | null;
  setBarcode: (barcode: string) => void;
  clear: () => void;
};

export const useScanStore = create<ScanStore>((set) => ({
  barcode: null,
  setBarcode: (barcode) => set({ barcode }),
  clear: () => set({ barcode: null }),
}));
