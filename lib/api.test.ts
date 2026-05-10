import { uploadPhoto, analyzePhoto, createTask, getTaskById } from './api';

jest.mock('react-native-url-polyfill/auto', () => ({}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const mockGetSession = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
  },
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('uploadPhoto', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
    });
  });

  it('turėtų siųsti nuotrauką ir grąžinti uploadId', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ uploadId: 'abc-123' }),
    });

    const result = await uploadPhoto('file:///tmp/photo.jpg');

    expect(result).toEqual({ uploadId: 'abc-123' });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/upload'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      }),
    );
  });

  it('turėtų mesti klaidą kai nėra sesijos', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
    });

    await expect(uploadPhoto('file:///tmp/photo.jpg')).rejects.toThrow('Nėra aktyvios sesijos');
  });

  it('turėtų mesti klaidą kai serveris grąžina klaidą', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 415,
      json: () => Promise.resolve({ error: 'Netinkamas failo tipas' }),
    });

    await expect(uploadPhoto('file:///tmp/photo.jpg')).rejects.toThrow('Netinkamas failo tipas');
  });

  it('turėtų mesti generic klaidą kai serveris negrąžina JSON', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('not json')),
    });

    await expect(uploadPhoto('file:///tmp/photo.jpg')).rejects.toThrow('Serverio klaida: 500');
  });
});

describe('analyzePhoto', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
    });
  });

  it('turėtų grąžinti analizės rezultatą', async () => {
    const mockResult = {
      uploadId: 'abc-123',
      verdict: 'mess',
      title: 'Netvarkinga virtuvė',
      description: 'Ant stalo palikti indai.',
      bettingIndex: 7,
      photoUrl: 'https://example.supabase.co/storage/v1/object/public/photos/abc-123.jpg',
    };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResult),
    });

    const result = await analyzePhoto('file:///tmp/photo.jpg');

    expect(result).toEqual(mockResult);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/analyze'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('turėtų mesti AI_UNRECOGNIZED klaidą', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 422,
      json: () => Promise.resolve({ error: 'AI_UNRECOGNIZED' }),
    });

    await expect(analyzePhoto('file:///tmp/photo.jpg')).rejects.toThrow('AI_UNRECOGNIZED');
  });
});

describe('createTask', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
    });
  });

  const validParams = {
    title: 'Netvarkinga virtuvė',
    description: 'Ant stalo palikti indai.',
    bettingIndex: 7,
    groupId: 'group-abc',
  };

  it('turėtų sukurti užduotį ir grąžinti ID', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'task-123', assignedTo: 'user-1', initialImageUrl: null }),
    });

    const result = await createTask(validParams);

    expect(result).toEqual({ id: 'task-123', assignedTo: 'user-1', initialImageUrl: null });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/tasks'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('turėtų perduoti photoUrl serveriui', async () => {
    const photoUrl = 'https://example.supabase.co/storage/v1/object/public/photos/abc.jpg';
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ id: 'task-123', assignedTo: 'user-1', initialImageUrl: photoUrl }),
    });

    await createTask({ ...validParams, photoUrl });

    const fetchCall = mockFetch.mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1].body as string);
    expect(requestBody.photoUrl).toBe(photoUrl);
  });

  it('turėtų mesti klaidą kai serveris atmeta', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Pavadinimas yra privalomas' }),
    });

    await expect(createTask(validParams)).rejects.toThrow('Pavadinimas yra privalomas');
  });
});

describe('getTaskById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
    });
  });

  const taskDetailFixture = {
    id: 'task-123',
    groupId: 'group-abc',
    title: 'Netvarkinga virtuvė',
    description: 'Indai',
    status: 'open' as const,
    difficultyScore: 6,
    aiVerdictReason: null,
    initialImageUrl: 'https://example.com/img.jpg',
    evidenceImageUrl: null,
    createdAt: '2026-04-26T10:00:00Z',
    completedAt: null,
    creator: { id: 'c1', username: 'Tomas', avatar_url: null },
    assignedTo: null,
    bets: { totalPool: 0, forCount: 0, againstCount: 0 },
  };

  it('turėtų grąžinti užduoties detales su Authorization antrašte', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(taskDetailFixture),
    });

    const result = await getTaskById('task-123');

    expect(result).toEqual(taskDetailFixture);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/tasks/task-123'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      }),
    );
  });

  it('turėtų mesti klaidą kai užduotis nerasta (404)', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'Užduotis nerasta' }),
    });

    await expect(getTaskById('missing')).rejects.toThrow('Užduotis nerasta');
  });

  it('turėtų mesti klaidą kai nėra sesijos', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    await expect(getTaskById('task-123')).rejects.toThrow('Nėra aktyvios sesijos');
  });
});
