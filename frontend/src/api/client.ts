import type { ComparePlansResult, CommunityState, DispatchPlan, ForecastData, LadderResponse, ManualOverrideSettings, RunwayForecast, SafeUser, ScenarioEventPayload, SignalState } from '@/types/navya';

const base = 'http://localhost:3001';
const tokenKey = 'navya_token';
export const getToken = () => localStorage.getItem(tokenKey);
export const setSession = (token:string, user:SafeUser) => { localStorage.setItem(tokenKey, token); localStorage.setItem('navya_user', JSON.stringify(user)); };
export const clearSession = () => { localStorage.removeItem(tokenKey); localStorage.removeItem('navya_user'); };
export const getStoredUser = ():SafeUser | null => { try { return JSON.parse(localStorage.getItem('navya_user') || 'null') as SafeUser | null; } catch { return null; } };
async function request<T>(path:string, init:RequestInit = {}, auth=true):Promise<T> {
  const headers = new Headers(init.headers); headers.set('Content-Type', 'application/json');
  if (auth) { const token=getToken(); if (token) headers.set('Authorization', `Bearer ${token}`); }
  const response = await fetch(`${base}${path}`, { ...init, headers });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export const api = {
  login: (body:{email:string;password:string}) => request<{token:string;user:SafeUser}>('/auth/login',{method:'POST',body:JSON.stringify(body)},false),
  register: (body:{email:string;password:string}) => request<{token:string;user:SafeUser}>('/auth/register',{method:'POST',body:JSON.stringify(body)},false),
  me: () => request<SafeUser>('/auth/me'),
  signal: () => request<SignalState>('/signal',{},false),
  state: () => request<CommunityState>('/api/microgrid/state'),
  community: () => request<Record<string,unknown>>('/api/microgrid/community'),
  assets: () => request<Record<string,unknown>[]>('/api/microgrid/assets'),
  parameters: () => request<Record<string,unknown>>('/api/microgrid/parameters'),
  saveParameters: (body:Record<string,unknown>) => request<Record<string,unknown>>('/api/microgrid/parameters',{method:'PUT',body:JSON.stringify(body)}),
  forecast: (hours:number) => request<ForecastData>(`/api/forecast?horizon=${hours}`),
  optimize: () => request<DispatchPlan>('/api/optimize',{method:'POST',body:'{}'}),
  explain: (body:{query:string;run_id:string}) => request<{explanation:string;grounded_reason_codes:string[];metrics_referenced:Record<string,number>}>('/api/explain',{method:'POST',body:JSON.stringify(body)}),
  ladder: () => request<LadderResponse>('/api/ladder'),
  recalculateLadder: () => request<LadderResponse>('/api/ladder/recalculate',{method:'POST',body:'{}'}),
  runway: () => request<RunwayForecast>('/api/runway'),
  scenario: (body:ScenarioEventPayload) => request<DispatchPlan>('/api/scenario',{method:'POST',body:JSON.stringify(body)}),
  compare: (body:Record<string,unknown> = {}) => request<ComparePlansResult>('/api/scenario/compare',{method:'POST',body:JSON.stringify(body)}),
  override: (body:ManualOverrideSettings) => request<Record<string,unknown>>('/api/override',{method:'POST',body:JSON.stringify(body)}),
  clearOverride: () => request<void>('/api/override/clear',{method:'DELETE'}),
  optimizeHistory: () => request<Record<string,unknown>[]>('/api/optimize/history'),
  scenarioHistory: () => request<Record<string,unknown>[]>('/api/scenario/list'),
  overrideHistory: () => request<Record<string,unknown>[]>('/api/override/history'),
};
