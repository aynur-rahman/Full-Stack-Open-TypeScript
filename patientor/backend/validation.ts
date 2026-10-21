import { z } from 'zod';
import { Gender, HealthCheckRating } from './types.ts';
import type { NewPatient, NewEntry } from './types.ts';

const text = z.string().trim().min(1, 'Must not be empty');
export const isGender = (value: unknown): value is Gender =>
  Object.values(Gender).some(gender => gender === value);
export const newPatientSchema = z.object({
  name: text,
  dateOfBirth: z.iso.date(),
  ssn: text,
  gender: z.enum(Gender),
  occupation: text,
}) satisfies z.ZodType<NewPatient>;
const baseEntry = z.object({
  description: text,
  date: z.iso.date(),
  specialist: text,
  diagnosisCodes: z.array(text).optional(),
});
export const newEntrySchema = z.discriminatedUnion('type', [
  baseEntry.extend({
    type: z.literal('HealthCheck'),
    healthCheckRating: z.union([
      z.literal(HealthCheckRating.Healthy), z.literal(HealthCheckRating.LowRisk),
      z.literal(HealthCheckRating.HighRisk), z.literal(HealthCheckRating.CriticalRisk),
    ]),
  }),
  baseEntry.extend({
    type: z.literal('Hospital'),
    discharge: z.object({ date: z.iso.date(), criteria: text }),
  }),
  baseEntry.extend({
    type: z.literal('OccupationalHealthcare'),
    employerName: text,
    sickLeave: z.object({ startDate: z.iso.date(), endDate: z.iso.date() })
      .refine(leave => leave.endDate >= leave.startDate, 'Sick leave must end on or after it starts').optional(),
  }),
]) satisfies z.ZodType<NewEntry>;
