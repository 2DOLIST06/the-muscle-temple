import type { DiaryEntry, DiaryEntryInput, MealType, NutritionDiary, NutritionGoal, NutritionGoalInput, PersonalFood, PersonalFoodInput, User } from './types';

export class UserApiError extends Error {
  constructor(message: string, public status: number, public code?: string) { super(message); }
}

type Envelope<T> = T | { data: T; error?: string; message?: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/user-api${path}`, {
      ...init,
      headers: init?.body ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers,
      cache: 'no-store'
    });
  } catch {
    throw new UserApiError('network', 0);
  }
  const payload = (await response.json().catch(() => ({}))) as Envelope<T> & { error?: string; message?: string };
  if (!response.ok) {
    const code = typeof payload === 'object' && payload && 'code' in payload && typeof payload.code === 'string' ? payload.code : undefined;
    throw new UserApiError(payload.error || payload.message || code || 'request', response.status, code || payload.error);
  }
  return 'data' in payload ? payload.data : payload as T;
}

export const userApi = {
  me: () => request<User>('/auth/me'),
  login: (body: { email: string; password: string }) => request<User>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body: { displayName: string; email: string; password: string }) => request<User>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' })
};

export const nutritionApi = {
  diary: (date: string) => request<NutritionDiary>(`/nutrition/diary?date=${encodeURIComponent(date)}`),
  createEntry: (body: DiaryEntryInput) => request<DiaryEntry>('/nutrition/diary/entries', { method: 'POST', body: JSON.stringify(body) }),
  updateEntry: (id: string, body: { mealType: MealType; quantity: number }) => request<DiaryEntry>(`/nutrition/diary/entries/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteEntry: (id: string) => request<void>(`/nutrition/diary/entries/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  goals: (date: string) => request<NutritionGoal | null>(`/nutrition/goals?date=${encodeURIComponent(date)}`),
  updateGoals: (body: NutritionGoalInput) => request<NutritionGoal>('/nutrition/goals', { method: 'PUT', body: JSON.stringify(body) }),
  goalHistory: () => request<NutritionGoal[]>('/nutrition/goals/history'),
  personalFoods: () => request<PersonalFood[]>('/nutrition/personal-foods'),
  personalFood: (id: string) => request<PersonalFood>(`/nutrition/personal-foods/${encodeURIComponent(id)}`),
  createPersonalFood: (body: PersonalFoodInput) => request<PersonalFood>('/nutrition/personal-foods', { method: 'POST', body: JSON.stringify(body) }),
  updatePersonalFood: (id: string, body: Partial<PersonalFoodInput>) => request<PersonalFood>(`/nutrition/personal-foods/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deletePersonalFood: (id: string) => request<void>(`/nutrition/personal-foods/${encodeURIComponent(id)}`, { method: 'DELETE' })
};
