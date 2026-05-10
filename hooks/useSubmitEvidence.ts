import { useCallback, useState } from 'react';
import { submitEvidence, SubmitEvidenceResult } from '@/lib/api';

interface UseSubmitEvidenceState {
  isLoading: boolean;
  result: SubmitEvidenceResult | null;
  error: string | null;
}

export function useSubmitEvidence() {
  const [state, setState] = useState<UseSubmitEvidenceState>({
    isLoading: false,
    result: null,
    error: null,
  });

  const submit = useCallback(
    async (taskId: string, photoUri: string): Promise<SubmitEvidenceResult | null> => {
      setState({ isLoading: true, result: null, error: null });
      try {
        const result = await submitEvidence(taskId, photoUri);
        setState({ isLoading: false, result, error: null });
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Tinklo klaida įkeliant įrodymą';
        setState({ isLoading: false, result: null, error: message });
        return null;
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setState({ isLoading: false, result: null, error: null });
  }, []);

  return { submit, reset, ...state };
}
