import axios from 'axios';
import type { Diary, NewDiary } from './types';
export const getDiaries = async () => (await axios.get<Diary[]>('/api/diaries')).data;
export const addDiary = async (entry: NewDiary) => (await axios.post<Diary>('/api/diaries', entry)).data;
export const errorMessage = (error: unknown): string => {
  if (axios.isAxiosError<unknown>(error)) {
    const data = error.response?.data;
    if (typeof data === 'string') return data;
    if (data && typeof data === 'object' && 'error' in data) {
      if (typeof data.error === 'string') return data.error;
      if (Array.isArray(data.error)) {
        return data.error.map((issue: unknown) => {
          if (issue && typeof issue === 'object' && 'message' in issue && typeof issue.message === 'string') {
            const field = 'path' in issue && Array.isArray(issue.path) ? issue.path.join('.') : '';
            return `${field}: ${issue.message}`;
          }
          return 'Invalid diary data';
        }).join('; ');
      }
    }
    return error.message;
  }
  return error instanceof Error ? error.message : 'Unable to save diary';
};
