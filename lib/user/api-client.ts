import type { ApiDiary, ApiEntry, ApiGoal, ApiPersonalFood } from './nutrition-adapter';
import { readDiary, readEntry, readGoal, readPersonalFood, writePersonalFood } from './nutrition-adapter';
import type { FoodRecurrence, DiaryEntryInput, MealType, NutritionGoalInput, PersonalFoodInput, ContactDetails, User } from './types';

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
  if (response.status === 204) return undefined as T;
  const payload = (await response.json().catch(() => ({}))) as Envelope<T> & { error?: string; message?: string };
  if (!response.ok) {
    const code = typeof payload === 'object' && payload && 'code' in payload && typeof payload.code === 'string' ? payload.code : undefined;
    throw new UserApiError(payload.error || payload.message || code || 'request', response.status, code || payload.error);
  }
  return 'data' in payload ? payload.data : payload as T;
}

export const userApi = {
  updateProfile: (body: ContactDetails) => request<User>('/auth/profile', { method: 'POST', body: JSON.stringify(body) }),
  newsletter: () => request<{ token: string | null; status: string | null }>('/auth/newsletter'),
  requestLoginLink: (email: string, locale: 'fr' | 'en') => request<{ ok: boolean }>('/auth/login-link', { method: 'POST', body: JSON.stringify({ email, locale }) }),
  consumeLoginLink: (token: string) => request<{ ok: boolean }>('/auth/login-link/consume', { method: 'POST', body: JSON.stringify({ token }) }),
  changePassword: (password: string) => request<{ ok: boolean }>('/auth/password', { method: 'POST', body: JSON.stringify({ password }) }),
  me: () => request<User>('/auth/me'),
  login: (body: { email: string; password: string }) => request<User>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body: { displayName: string; email: string; password: string }) => request<User>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' })
};

export const nutritionApi = {
  recurrences: (date: string) => request<FoodRecurrence[]>(`/nutrition/recurrences?date=${encodeURIComponent(date)}`),
  stopRecurrence: (id: string, date: string) => request<{ ok: boolean }>(`/nutrition/recurrences/${encodeURIComponent(id)}/stop`, { method: 'POST', body: JSON.stringify({ date }) }),
  diary: (date: string) => request<ApiDiary>(`/nutrition/diary?date=${encodeURIComponent(date)}`).then(readDiary),
  createEntry: (body: DiaryEntryInput) => request<ApiEntry | { id: string; recurring: true }>('/nutrition/diary/entries', { method: 'POST', body: JSON.stringify(body) }).then(row => 'recurring' in row ? row : readEntry(row)),
  updateEntry: (id: string, body: { mealType: MealType; quantity: number }) => request<ApiEntry>(`/nutrition/diary/entries/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ mealType: body.mealType, consumedAmount: body.quantity }) }).then(readEntry),
  deleteEntry: (id: string) => request<void>(`/nutrition/diary/entries/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  goals: (date: string) => request<ApiGoal | null>(`/nutrition/goals?date=${encodeURIComponent(date)}`).then(readGoal),
  updateGoals: (body: NutritionGoalInput) => request<ApiGoal>('/nutrition/goals', { method: 'PUT', body: JSON.stringify(body) }).then(value => readGoal(value)!),
  goalHistory: () => request<ApiGoal[]>('/nutrition/goals/history').then(rows => rows.map(row => readGoal(row)!)),
  personalFoods: () => request<ApiPersonalFood[]>('/nutrition/personal-foods').then(rows => rows.map(readPersonalFood)),
  personalFood: (id: string) => request<ApiPersonalFood>(`/nutrition/personal-foods/${encodeURIComponent(id)}`).then(readPersonalFood),
  createPersonalFood: (body: PersonalFoodInput) => request<ApiPersonalFood>('/nutrition/personal-foods', { method: 'POST', body: JSON.stringify(writePersonalFood(body)) }).then(readPersonalFood),
  updatePersonalFood: (id: string, body: Partial<PersonalFoodInput>) => request<ApiPersonalFood>(`/nutrition/personal-foods/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(writePersonalFood(body)) }).then(readPersonalFood),
  deletePersonalFood: (id: string) => request<void>(`/nutrition/personal-foods/${encodeURIComponent(id)}`, { method: 'DELETE' })
};
