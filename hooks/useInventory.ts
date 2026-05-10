import { useState, useEffect, useCallback } from 'react';
import { getInventoryItems, useInventoryItem as callInventoryItem } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export interface InventoryItem {
  id: string;
  is_used: boolean;
  purchased_at: string;
  item: {
    id: string;
    name: string;
    description: string;
  };
}

export const useInventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getInventoryItems();
      setInventory(data as any);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Klaida');
    } finally {
      setLoading(false);
    }
  }, []);

  const useItem = async (inventoryId: string) => {
    try {
      await callInventoryItem(inventoryId);

      // Atnaujiname vietinį būvį
      setInventory((prev) => prev.filter((item) => item.id !== inventoryId));
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Klaida' };
    }
  };

  useEffect(() => {
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setup = async () => {
      await fetchInventory();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !active) return;

      channel = supabase
        .channel(`inventory_changes_${user.id}_${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_inventory',
            filter: `profile_id=eq.${user.id}`,
          },
          () => {
            fetchInventory();
          },
        )
        .subscribe();
    };

    setup();

    return () => {
      active = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchInventory]);

  return { inventory, loading, error, refresh: fetchInventory, useItem };
};
