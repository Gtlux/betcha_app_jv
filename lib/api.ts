import { supabase } from './supabase';
import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

/**
 * Pagalbinė funkcija: prideda nuotrauką į FormData taip, kad veiktų
 * tiek React Native (naudojant {uri, name, type} objektą),
 * tiek Web naršyklėje (konvertuojant URI į tikrą Blob/File objektą).
 */
async function appendPhotoToFormData(
  formData: FormData,
  fieldName: string,
  uri: string,
  fileName: string,
): Promise<void> {
  if (Platform.OS === 'web') {
    // Web: konvertuojame data:URI arba blob:URI į tikrą File objektą
    const response = await fetch(uri);
    const blob = await response.blob();
    const file = new File([blob], fileName, { type: 'image/jpeg' });
    formData.append(fieldName, file);
  } else {
    // React Native: naudojame RN-specifinį {uri, name, type} objektą
    formData.append(fieldName, {
      uri,
      name: fileName,
      type: 'image/jpeg',
    } as unknown as Blob);
  }
}

// Bendras fetch su timeout apsauga (kad UI nekabotų amžinai, kai API nepasiekiamas)
async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit & { timeoutMs?: number } = {},
) {
  const { timeoutMs = 10_000, ...rest } = init;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // @ts-ignore — RN aplinkoje RequestInfo gali būti string
    return await fetch(input as any, { ...rest, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Nėra aktyvios sesijos');
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
  };
}

export async function uploadPhoto(uri: string): Promise<{ uploadId: string }> {
  const headers = await getAuthHeaders();

  const formData = new FormData();
  await appendPhotoToFormData(formData, 'photo', uri, 'photo.jpg');

  const response = await fetch(`${API_URL}/api/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? `Serverio klaida: ${response.status}`);
  }

  return response.json();
}

export interface CreateTaskParams {
  title: string;
  description: string;
  bettingIndex: number;
  groupId: string;
  photoUrl?: string;
}

export interface CreateTaskResult {
  id: string;
  assignedTo: string | null;
  initialImageUrl: string | null;
}

export async function createTask(params: CreateTaskParams): Promise<CreateTaskResult> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_URL}/api/tasks`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? `Serverio klaida: ${response.status}`);
  }

  return response.json();
}

export interface TaskDetailProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

export interface TaskDetail {
  id: string;
  groupId: string;
  title: string;
  description: string | null;
  status: 'open' | 'completed' | 'rejected';
  difficultyScore: number | null;
  aiVerdictReason: string | null;
  initialImageUrl: string | null;
  evidenceImageUrl: string | null;
  createdAt: string;
  completedAt: string | null;
  creator: TaskDetailProfile | null;
  assignedTo: TaskDetailProfile | null;
  bets: {
    totalPool: number;
    forCount: number;
    againstCount: number;
  };
}

export async function getTaskById(taskId: string): Promise<TaskDetail> {
  const headers = await getAuthHeaders();

  const response = await fetchWithTimeout(`${API_URL}/api/tasks/${taskId}`, {
    method: 'GET',
    headers,
    timeoutMs: 10_000,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? `Serverio klaida: ${response.status}`);
  }

  return response.json();
}

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  createdById: string;
  role: string;
  memberCount: number;
}

export interface GroupMember {
  profileId: string;
  username: string | null;
  avatarUrl: string | null;
  role: string;
  joinedAt: string;
}

export interface GroupDetails {
  id: string;
  name: string;
  inviteCode: string;
  members: GroupMember[];
}

export async function createGroup(
  name: string,
): Promise<{ id: string; name: string; invite_code: string }> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_URL}/api/groups`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? `Serverio klaida: ${response.status}`);
  }

  return response.json();
}

export async function joinGroup(inviteCode: string): Promise<{ groupId: string; name: string }> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_URL}/api/groups/join`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inviteCode }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? `Serverio klaida: ${response.status}`);
  }

  return response.json();
}

export async function getMyGroups(): Promise<Group[]> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_URL}/api/groups`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? `Serverio klaida: ${response.status}`);
  }

  return response.json();
}

export interface GroupStatsQuestSummary {
  id: string;
  title: string;
  status: 'open' | 'completed' | 'rejected';
  difficultyScore: number | null;
  assignedTo: { id: string; username: string | null } | null;
  createdAt: string;
}

export interface GroupStatsResolvedQuest {
  id: string;
  title: string;
  status: 'completed' | 'rejected';
  completedAt: string | null;
}

export interface GroupStats {
  openQuests: GroupStatsQuestSummary[];
  openCount: number;
  recentResolved: GroupStatsResolvedQuest[];
  totalPrizePool: number;
}

export async function getGroupStats(groupId: string): Promise<GroupStats> {
  const headers = await getAuthHeaders();

  const response = await fetchWithTimeout(`${API_URL}/api/groups/${groupId}/stats`, {
    method: 'GET',
    headers,
    timeoutMs: 10_000,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? `Serverio klaida: ${response.status}`);
  }

  return response.json();
}

export async function getGroupMembers(groupId: string): Promise<GroupDetails> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_URL}/api/groups/${groupId}/members`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? `Serverio klaida: ${response.status}`);
  }

  return response.json();
}

export interface AnalysisResult {
  uploadId: string;
  verdict: 'mess' | 'clean' | 'unclear';
  title: string;
  description: string;
  bettingIndex: number;
  photoUrl: string;
}

export async function analyzePhoto(uri: string): Promise<AnalysisResult> {
  const headers = await getAuthHeaders();

  const formData = new FormData();
  await appendPhotoToFormData(formData, 'photo', uri, 'photo.jpg');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  let response;
  try {
    response = await fetch(`${API_URL}/api/analyze`, {
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('AI_TIMEOUT');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    if (body?.error === 'AI_UNRECOGNIZED' || body?.error === 'AI_TIMEOUT') {
      throw new Error(body.error);
    }
    throw new Error(body?.error ?? `Serverio klaida: ${response.status}`);
  }

  return response.json();
}

export interface SubmitEvidenceResult {
  verdict: 'approved' | 'rejected' | 'unclear';
  reason: string;
  status: 'open' | 'completed';
}

export async function submitEvidence(
  taskId: string,
  photoUri: string,
): Promise<SubmitEvidenceResult> {
  const headers = await getAuthHeaders();

  const formData = new FormData();
  await appendPhotoToFormData(formData, 'photo', photoUri, 'evidence.jpg');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  let response;
  try {
    response = await fetch(`${API_URL}/api/tasks/${taskId}/evidence`, {
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('AI_TIMEOUT');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  const body = await response.json().catch(() => null);

  if (response.status === 200 && body) {
    return body as SubmitEvidenceResult;
  }

  if (response.status === 502 && body?.verdict === 'unclear') {
    return body as SubmitEvidenceResult;
  }

  throw new Error(body?.error ?? `Serverio klaida: ${response.status}`);
}

// =========================
// Shop / Inventory endpoints
// =========================

export interface StoreItemDto {
  id: string;
  name: string;
  description: string;
  price: number;
}

export async function getStoreItems(): Promise<StoreItemDto[]> {
  const { data, error } = await supabase
    .from('store_items')
    .select('id, name, description, price')
    .eq('is_active', true)
    .order('price', { ascending: true });

  if (error) {
    throw new Error(error.message ?? 'Nepavyko užkrauti parduotuvės prekių');
  }

  return data ?? [];
}

export async function purchaseStoreItem(itemId: string): Promise<{ message: string }> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Vartotojas neprisijungęs');
  }

  const { data: item, error: itemError } = await supabase
    .from('store_items')
    .select('id, price, is_active')
    .eq('id', itemId)
    .eq('is_active', true)
    .single();

  if (itemError || !item) {
    throw new Error('Prekė nerasta');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error('Profilis nerastas');
  }

  if (profile.balance < item.price) {
    throw new Error('Nepakanka balanso');
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ balance: profile.balance - item.price })
    .eq('id', user.id);

  if (updateError) {
    throw new Error(updateError.message ?? 'Nepavyko atnaujinti balanso');
  }

  const { error: inventoryError } = await supabase
    .from('user_inventory')
    .insert({ profile_id: user.id, item_id: item.id });

  if (inventoryError) {
    throw new Error(inventoryError.message ?? 'Nepavyko pridėti į inventorių');
  }

  const { error: transactionError } = await supabase.from('transactions').insert({
    profile_id: user.id,
    amount: -item.price,
    type: 'purchase',
    reference_id: item.id,
  });

  if (transactionError) {
    throw new Error(transactionError.message ?? 'Nepavyko užregistruoti transakcijos');
  }

  return { message: 'Pirkimas sėkmingas' };
}

export interface InventoryItemDto {
  id: string;
  is_used: boolean;
  purchased_at: string;
  item: {
    id: string;
    name: string;
    description: string;
  };
}

export async function getInventoryItems(): Promise<InventoryItemDto[]> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Vartotojas neprisijungęs');
  }

  const { data, error } = await supabase
    .from('user_inventory')
    .select(
      `
      id,
      is_used,
      purchased_at,
      item:store_items (
        id,
        name,
        description
      )
    `,
    )
    .eq('profile_id', user.id)
    .eq('is_used', false)
    .order('purchased_at', { ascending: false });

  if (error) {
    throw new Error(error.message ?? 'Nepavyko užkrauti inventoriaus');
  }

  return (data ?? []) as unknown as InventoryItemDto[];
}

export async function useInventoryItem(inventoryId: string): Promise<{ message: string }> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Vartotojas neprisijungęs');
  }

  const { error } = await supabase
    .from('user_inventory')
    .update({ is_used: true })
    .eq('id', inventoryId)
    .eq('profile_id', user.id);

  if (error) {
    throw new Error(error.message ?? 'Nepavyko panaudoti prekės');
  }

  return { message: 'Prekė sėkmingai panaudota' };
}
