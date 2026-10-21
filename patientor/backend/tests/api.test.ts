import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import type { Server } from 'node:http';
import { z } from 'zod';
import { createApp } from '../app.ts';
import initialPatients from '../data/patients.ts';

let server: Server;
let base: string;
beforeEach(() => new Promise<void>(resolve => {
  server = createApp().listen(0, '127.0.0.1', () => {
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    base = `http://127.0.0.1:${address.port}`;
    resolve();
  });
}));
afterEach(() => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
const request = async (path: string, input?: unknown) => {
  const response = await fetch(`${base}/api${path}`, input === undefined ? undefined : {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
  });
  const body: unknown = await response.json();
  return { status: response.status, body };
};
const examplePatient = {
  name: 'Synthetic Test Patient', dateOfBirth: '1990-02-28', ssn: 'synthetic',
  gender: 'other', occupation: 'Test occupation',
};
const entryBase = { description: 'Test visit', date: '2026-10-03', specialist: 'Test specialist' };
const patientId = initialPatients[0].id;
const entryPath = `/patients/${patientId}/entries`;

void test('public listing excludes SSN and entries while detail preserves the full supplied dataset', async () => {
  const list = await request('/patients');
  assert.equal(list.status, 200);
  const publicPatients = z.array(z.object({ id: z.string() }).passthrough()).parse(list.body);
  assert.equal(publicPatients.length, initialPatients.length);
  for (const patient of publicPatients) {
    assert.equal('ssn' in patient, false);
    assert.equal('entries' in patient, false);
    const detail = await request(`/patients/${patient.id}`);
    assert.equal(detail.status, 200);
    assert.deepEqual(detail.body, initialPatients.find(item => item.id === patient.id));
  }
});

void test('patient creation generates an ID and starts with empty entries despite injected fields', async () => {
  const created = await request('/patients', { ...examplePatient, id: 'injected', entries: [{ id: 'injected' }] });
  assert.equal(created.status, 200);
  const patient = z.object({ id: z.uuid(), entries: z.array(z.unknown()) }).passthrough().parse(created.body);
  assert.deepEqual(patient, { ...examplePatient, id: patient.id, entries: [] });
  const detail = await request(`/patients/${patient.id}`);
  assert.deepEqual(detail.body, patient);
  const list = await request('/patients');
  const patients = z.array(z.object({ id: z.string() }).passthrough()).parse(list.body);
  const publicPatient = patients.find(item => item.id === patient.id);
  assert.ok(publicPatient);
  assert.equal('ssn' in publicPatient, false);
});

void test('invalid patient payloads return 400 and never mutate the list', async () => {
  const before = await request('/patients');
  for (const body of [{}, null, [], { ...examplePatient, name: ' ' },
    { ...examplePatient, dateOfBirth: '2025-02-29' }, { ...examplePatient, gender: 'invalid' },
    { ...examplePatient, ssn: 123 }, { ...examplePatient, occupation: false }]) {
    const response = await request('/patients', body);
    assert.equal(response.status, 400);
    assert.ok(z.object({ error: z.string().min(1) }).safeParse(response.body).success);
  }
  assert.deepEqual((await request('/patients')).body, before.body);
});

void test('all entry variants persist only on the selected patient with generated IDs', async () => {
  const otherId = initialPatients[1].id;
  const otherBefore = await request(`/patients/${otherId}`);
  const entries = [
    { ...entryBase, type: 'HealthCheck', healthCheckRating: 3, diagnosisCodes: ['S62.5'] },
    { ...entryBase, type: 'Hospital', discharge: { date: '2026-10-04', criteria: 'Recovered' } },
    { ...entryBase, type: 'OccupationalHealthcare', employerName: 'Synthetic employer',
      sickLeave: { startDate: '2026-10-03', endDate: '2026-10-05' } },
    { ...entryBase, type: 'OccupationalHealthcare', employerName: 'No sick leave' },
  ];
  const createdEntries: unknown[] = [];
  for (const input of entries) {
    const response = await request(entryPath, { ...input, id: 'injected' });
    assert.equal(response.status, 200);
    const entry = z.object({ id: z.uuid() }).passthrough().parse(response.body);
    assert.deepEqual(entry, { ...input, id: entry.id });
    createdEntries.push(entry);
  }
  const detail = z.object({ entries: z.array(z.unknown()) }).parse((await request(`/patients/${patientId}`)).body);
  assert.deepEqual(detail.entries, [...initialPatients[0].entries, ...createdEntries]);
  assert.deepEqual((await request(`/patients/${otherId}`)).body, otherBefore.body);
});

void test('invalid entry discriminator and variant fields return 400 without changing any entry', async () => {
  const before = await request(`/patients/${patientId}`);
  const health = { ...entryBase, type: 'HealthCheck', healthCheckRating: 0 };
  const invalid = [
    {}, { ...health, type: 'Unknown' }, { ...health, healthCheckRating: 4 },
    { ...health, healthCheckRating: '0' }, { ...health, specialist: '' },
    { ...health, description: 2 }, { ...health, date: '2026-02-30' },
    { ...health, diagnosisCodes: 'S62.5' }, { ...health, diagnosisCodes: [123] },
    { ...entryBase, type: 'Hospital' },
    { ...entryBase, type: 'Hospital', discharge: { date: '2026-10-04' } },
    { ...entryBase, type: 'OccupationalHealthcare' },
    { ...entryBase, type: 'OccupationalHealthcare', employerName: 'Test', sickLeave: { startDate: '2026-10-05', endDate: '2026-10-03' } },
  ];
  for (const input of invalid) {
    const response = await request(entryPath, input);
    assert.equal(response.status, 400, JSON.stringify(input));
    assert.ok(z.object({ error: z.string().min(1) }).safeParse(response.body).success);
  }
  assert.deepEqual((await request(`/patients/${patientId}`)).body, before.body);
});

void test('missing patients return 404 for detail and entry creation', async () => {
  const before = await request('/patients');
  assert.equal((await request('/patients/not-found')).status, 404);
  assert.equal((await request('/patients/not-found/entries', { ...entryBase, type: 'HealthCheck', healthCheckRating: 0 })).status, 404);
  assert.deepEqual((await request('/patients')).body, before.body);
});

void test('malformed JSON gives a useful 400 error and leaves the server available', async () => {
  const response = await fetch(`${base}/api/patients`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{',
  });
  assert.equal(response.status, 400);
  const body: unknown = await response.json();
  assert.deepEqual(body, { error: 'Invalid JSON' });
  assert.equal(await (await fetch(`${base}/api/ping`)).text(), 'pong');
});
