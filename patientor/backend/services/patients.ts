import { randomUUID } from 'node:crypto';
import initialPatients from '../data/patients.ts';
import type { NewPatient, Patient, PublicPatient, NewEntry, Entry } from '../types.ts';

export const createPatientService = () => {
  const patients: Patient[] = structuredClone(initialPatients);
  const getAll = (): PublicPatient[] => patients.map(({ id, name, dateOfBirth, gender, occupation }) =>
    ({ id, name, dateOfBirth, gender, occupation }));
  const find = (id: string): Patient | undefined => patients.find(patient => patient.id === id);
  const add = (input: NewPatient): Patient => {
    const patient: Patient = { ...input, id: randomUUID(), entries: [] };
    patients.push(patient);
    return patient;
  };
  const addEntry = (patient: Patient, input: NewEntry): Entry => {
    const entry: Entry = { ...input, id: randomUUID() };
    patient.entries.push(entry);
    return entry;
  };
  return { getAll, find, add, addEntry };
};
