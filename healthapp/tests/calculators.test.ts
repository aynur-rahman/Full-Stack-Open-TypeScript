import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import app from '../app.ts';
import { calculateBmi } from '../bmiCalculator.ts';
import { calculateExercises } from '../exerciseCalculator.ts';

const server = app.listen(0, '127.0.0.1');
let base: string;
before(() => new Promise<void>(resolve => {
  const ready = () => {
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    base = `http://127.0.0.1:${address.port}`;
    resolve();
  };
  if (server.listening) ready();
  else server.once('listening', ready);
}));
after(() => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
const post = (body: unknown) => fetch(`${base}/exercises`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});

void test('BMI categories include each exact boundary', () => {
  const cases: [number, string][] = [
    [15.9, 'Underweight (Severe thinness)'], [16, 'Underweight (Moderate thinness)'],
    [17, 'Underweight (Mild thinness)'], [18.5, 'Normal range'],
    [25, 'Overweight (Pre-obese)'], [30, 'Obese (Class I)'],
    [35, 'Obese (Class II)'], [40, 'Obese (Class III)'],
  ];
  for (const [weight, label] of cases) assert.equal(calculateBmi(100, weight), label);
  assert.equal(calculateBmi(180, 72), 'Normal range');
});

void test('exercise calculations report the exact example, zero days, and achieved targets', () => {
  assert.deepEqual(calculateExercises([3, 0, 2, 4.5, 0, 3, 1], 2), {
    periodLength: 7, trainingDays: 5, success: false, rating: 2,
    ratingDescription: 'not too bad but could be better', target: 2, average: 13.5 / 7,
  });
  assert.equal(calculateExercises([0, 0], 1).rating, 1);
  assert.equal(calculateExercises([0, 0], 1).trainingDays, 0);
  assert.equal(calculateExercises([2], 2).success, true);
  assert.equal(calculateExercises([2], 2).rating, 3);
});

void test('calculator functions reject empty periods and nonfinite or negative inputs', () => {
  for (const value of [0, -1, NaN, Infinity]) {
    assert.throws(() => calculateBmi(value, 72));
    assert.throws(() => calculateBmi(180, value));
    assert.throws(() => calculateExercises([1], value));
  }
  assert.throws(() => calculateExercises([], 2));
  for (const value of [-1, NaN, Infinity]) assert.throws(() => calculateExercises([1, value], 2));
});

void test('importing calculators has no CLI output or argument validation side effects', () => {
  const script = "await import('./bmiCalculator.ts'); await import('./exerciseCalculator.ts');";
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: fileURLToPath(new URL('..', import.meta.url)), encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, '');
});

void test('CLI supports variable periods and reports malformed or missing arguments', () => {
  const run = (file: string, args: string[]) => spawnSync(process.execPath, [file, ...args], {
    cwd: fileURLToPath(new URL('..', import.meta.url)), encoding: 'utf8',
  });
  assert.match(run('bmiCalculator.ts', ['180', '72']).stdout, /Normal range/);
  assert.match(run('exerciseCalculator.ts', ['2', '2']).stdout, /periodLength: 1/);
  assert.match(run('exerciseCalculator.ts', ['2', '0', '1', '3']).stdout, /periodLength: 3/);
  for (const [file, args] of [
    ['bmiCalculator.ts', []], ['bmiCalculator.ts', ['180', '72', '5']],
    ['bmiCalculator.ts', ['abc', '72']], ['exerciseCalculator.ts', ['2']],
    ['exerciseCalculator.ts', ['2', 'NaN']],
  ] satisfies [string, string[]][]) {
    const result = run(file, args);
    assert.equal(result.status, 1);
    assert.notEqual(result.stderr.trim(), '');
  }
});

void test('BMI HTTP endpoint rejects blank, repeated, negative and infinite query values', async () => {
  for (const query of ['height=&weight=72', 'height=0&weight=72', 'height=180&weight=-1',
    'height=Infinity&weight=72', 'height=180&height=170&weight=72']) {
    const response = await fetch(`${base}/bmi?${query}`);
    assert.equal(response.status, 400, query);
    const body: unknown = await response.json();
    assert.deepEqual(body, { error: 'malformatted parameters' });
  }
});

void test('exercise HTTP endpoint accepts numeric strings but distinguishes missing and malformed fields', async () => {
  const valid = await post({ daily_exercises: ['1', 0, '2'], target: '1' });
  assert.equal(valid.status, 200);
  const result: unknown = await valid.json();
  assert.deepEqual(result, calculateExercises([1, 0, 2], 1));
  for (const input of [{}, { target: 2 }, { daily_exercises: [1] }]) {
    const response = await post(input);
    assert.equal(response.status, 400);
    const body: unknown = await response.json();
    assert.deepEqual(body, { error: 'parameters missing' });
  }
  for (const input of [
    { daily_exercises: [], target: 2 }, { daily_exercises: [null], target: 2 },
    { daily_exercises: [true], target: 2 }, { daily_exercises: [' '], target: 2 },
    { daily_exercises: [-1], target: 2 }, { daily_exercises: [1], target: false },
    { daily_exercises: '1,2', target: 2 },
  ]) {
    const response = await post(input);
    assert.equal(response.status, 400);
    const body: unknown = await response.json();
    assert.deepEqual(body, { error: 'malformatted parameters' });
  }
});

void test('malformed JSON returns a JSON error without crashing the health server', async () => {
  const response = await fetch(`${base}/exercises`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{',
  });
  assert.equal(response.status, 400);
  const body: unknown = await response.json();
  assert.deepEqual(body, { error: 'malformatted parameters' });
  assert.equal(await (await fetch(`${base}/hello`)).text(), 'Hello Full Stack!');
});
