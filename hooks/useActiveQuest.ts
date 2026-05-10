import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export type QuestStatus = 'open' | 'completed' | 'rejected';

export interface QuestAssignee {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  difficulty_score: number;
  status: QuestStatus;
  assigned_to: QuestAssignee | null;
}

interface QuestRow {
  id: string;
  title: string;
  description: string;
  difficulty_score: number;
  status: QuestStatus;
  assigned: QuestAssignee | QuestAssignee[] | null;
}

export function useActiveQuest() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveQuest = useCallback(
    async (groupId: string | null, status: QuestStatus = 'open') => {
      if (!groupId) {
        setQuests([]);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('quests')
          .select(
            `
              id,
              title,
              description,
              difficulty_score,
              status,
              assigned:profiles!quests_assigned_to_fkey (
                id,
                username,
                avatar_url
              )
            `,
          )
          .eq('status', status)
          .eq('group_id', groupId)
          .order('created_at', { ascending: false });

        if (fetchError) {
          throw fetchError;
        } else {
          const rows = (data as QuestRow[] | null) ?? [];
          const mapped: Quest[] = rows.map((row) => {
            const assigned = Array.isArray(row.assigned) ? (row.assigned[0] ?? null) : row.assigned;
            return {
              id: row.id,
              title: row.title,
              description: row.description,
              difficulty_score: row.difficulty_score,
              status: row.status,
              assigned_to: assigned ?? null,
            };
          });
          setQuests(mapped);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Nepavyko gauti užduočių');
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { quests, isLoading, error, fetchActiveQuest };
}
