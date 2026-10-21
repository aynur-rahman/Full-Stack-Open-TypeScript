import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import type { ErrorRequestHandler } from 'express';
import diagnoses from './data/diagnoses.ts';
import { createPatientService } from './services/patients.ts';
import { newPatientSchema, newEntrySchema } from './validation.ts';

export const createApp = () => {
  const app = express();
  const patients = createPatientService();
  app.use(cors());
  app.use(express.json());
  app.get('/api/ping', (_req, res) => { res.send('pong'); });
  app.get('/api/diagnoses', (_req, res) => { res.json(diagnoses); });
  app.get('/api/patients', (_req, res) => { res.json(patients.getAll()); });
  app.post('/api/patients', (req, res) => { res.json(patients.add(newPatientSchema.parse(req.body))); });
  app.get('/api/patients/:id', (req, res) => {
    const patient = patients.find(req.params.id);
    if (!patient) { res.status(404).json({ error: 'Patient not found' }); return; }
    res.json(patient);
  });
  app.post('/api/patients/:id/entries', (req, res) => {
    const patient = patients.find(req.params.id);
    if (!patient) { res.status(404).json({ error: 'Patient not found' }); return; }
    res.json(patients.addEntry(patient, newEntrySchema.parse(req.body)));
  });
  app.use((_req, res) => { res.status(404).json({ error: 'Unknown endpoint' }); });
  const errors: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ') });
    } else if (error instanceof SyntaxError) {
      res.status(400).json({ error: 'Invalid JSON' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  app.use(errors);
  return app;
};
