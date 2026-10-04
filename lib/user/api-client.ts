import type { DiaryEntry, MealType, NutritionDiary, NutritionGoal, PersonalFood, User } from './types';

export class UserApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
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
  if (!response.ok) throw new UserApiError(payload.error || payload.message || 'request', response.status);
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
  updateEntry: (id: string, body: { mealType: MealType; quantity: number }) => request<DiaryEntry>(`/nutrition/diary/entries/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteEntry: (id: string) => request<void>(`/nutrition/diary/entries/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  goals: (date: string) => request<NutritionGoal | null>(`/nutrition/goals?date=${encodeURIComponent(date)}`),
  updateGoals: (body: NutritionGoal) => request<NutritionGoal>('/nutrition/goals', { method: 'PUT', body: JSON.stringify(body) }),
  goalHistory: () => request<NutritionGoal[]>('/nutrition/goals/history'),
  personalFoods: () => request<PersonalFood[]>('/nutrition/personal-foods'),
  personalFood: (id: string) => request<PersonalFood>(`/nutrition/personal-foods/${encodeURIComponent(id)}`),
  createPersonalFood: (body: Omit<PersonalFood, 'id'>) => request<PersonalFood>('/nutrition/personal-foods', { method: 'POST', body: JSON.stringify(body) }),
  updatePersonalFood: (id: string, body: Partial<Omit<PersonalFood, 'id'>>) => request<PersonalFood>(`/nutrition/personal-foods/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deletePersonalFood: (id: string) => request<void>(`/nutrition/personal-foods/${encodeURIComponent(id)}`, { method: 'DELETE' })
};
