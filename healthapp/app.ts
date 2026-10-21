import express from 'express';
import type { ErrorRequestHandler } from 'express';
import { calculateBmi } from './bmiCalculator.ts';
import { calculateExercises } from './exerciseCalculator.ts';
import { toNumber } from './input.ts';

const app = express();
app.use(express.json());
app.get('/hello', (_req, res) => { res.send('Hello Full Stack!'); });
app.get('/bmi', (req, res) => {
  try {
    const height = toNumber(req.query.height);
    const weight = toNumber(req.query.weight);
    res.json({ height, weight, bmi: calculateBmi(height, weight) });
  } catch {
    res.status(400).json({ error: 'malformatted parameters' });
  }
});
app.post('/exercises', (req, res) => {
  const body: unknown = req.body;
  if (!body || typeof body !== 'object' || !('daily_exercises' in body) || !('target' in body)) {
    res.status(400).json({ error: 'parameters missing' });
    return;
  }
  try {
    if (!Array.isArray(body.daily_exercises)) throw new Error('malformatted parameters');
    res.json(calculateExercises(body.daily_exercises.map(toNumber), toNumber(body.target)));
  } catch {
    res.status(400).json({ error: 'malformatted parameters' });
  }
});
const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, next) => {
  if (error instanceof SyntaxError) res.status(400).json({ error: 'malformatted parameters' });
  else next(error);
};
app.use(errorHandler);
export default app;
