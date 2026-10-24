import axios from 'axios';
import type { Patient, PublicPatient, PatientFormValues, Entry, NewEntry, Diagnosis } from '../types';
import { apiBaseUrl } from '../constants';
const getAll = async () => (await axios.get<PublicPatient[]>(`${apiBaseUrl}/patients`)).data;
const get = async (id: string) => (await axios.get<Patient>(`${apiBaseUrl}/patients/${id}`)).data;
const create = async (input: PatientFormValues) => (await axios.post<Patient>(`${apiBaseUrl}/patients`, input)).data;
const addEntry = async (id: string, input: NewEntry) => (await axios.post<Entry>(`${apiBaseUrl}/patients/${id}/entries`, input)).data;
const getDiagnoses = async () => (await axios.get<Diagnosis[]>(`${apiBaseUrl}/diagnoses`)).data;
export const errorMessage = (error: unknown): string => {
  if (axios.isAxiosError<unknown>(error)) {
    const data = error.response?.data;
    if (typeof data === 'string') return data;
    if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') return data.error;
    return error.message;
  }
  return error instanceof Error ? error.message : 'Request failed';
};
export default { getAll, get, create, addEntry, getDiagnoses };
