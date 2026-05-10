import { useState, useEffect, useCallback } from 'react';
import { getStoreItems, purchaseStoreItem } from '@/lib/api';

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
}

export const useShop = () => {
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStoreItems();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Klaida');
    } finally {
      setLoading(false);
    }
  }, []);

  const purchaseItem = async (itemId: string, price: number) => {
    try {
      // server-side purchase (validacijos ir verslo logika vienoje vietoje)
      await purchaseStoreItem(itemId);

      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Pirkimo klaida' };
    }
  };

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return { items, loading, error, refresh: fetchItems, purchaseItem };
};
