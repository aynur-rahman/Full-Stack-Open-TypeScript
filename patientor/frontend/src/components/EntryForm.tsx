import { useState } from 'react';
import type { FormEvent } from 'react';
import { Alert, Button, Stack, TextField, MenuItem, FormControl, InputLabel, Select, OutlinedInput } from '@mui/material';
import type { Diagnosis, Entry, NewEntry, HealthCheckRating } from '../types';
interface Props { diagnoses: Diagnosis[]; onSubmit: (entry: NewEntry) => Promise<void>; onCancel: () => void; saving: boolean; error: string }
const entryTypes: Entry['type'][] = ['HealthCheck', 'Hospital', 'OccupationalHealthcare'];
const ratings: { value: HealthCheckRating; label: string }[] = [
  { value: 0, label: 'Healthy' }, { value: 1, label: 'Low risk' }, { value: 2, label: 'High risk' }, { value: 3, label: 'Critical risk' },
];
const EntryForm = ({ diagnoses, onSubmit, onCancel, saving, error }: Props) => {
  const [type, setType] = useState<Entry['type']>('HealthCheck');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [specialist, setSpecialist] = useState('');
  const [diagnosisCodes, setCodes] = useState<string[]>([]);
  const [rating, setRating] = useState<HealthCheckRating>(0);
  const [dischargeDate, setDischargeDate] = useState('');
  const [criteria, setCriteria] = useState('');
  const [employerName, setEmployerName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const base = { description, date, specialist, diagnosisCodes };
    let entry: NewEntry;
    switch (type) {
      case 'HealthCheck': entry = { ...base, type, healthCheckRating: rating }; break;
      case 'Hospital': entry = { ...base, type, discharge: { date: dischargeDate, criteria } }; break;
      case 'OccupationalHealthcare': entry = { ...base, type, employerName, ...(startDate || endDate ? { sickLeave: { startDate, endDate } } : {}) }; break;
      default: { const unreachable: never = type; throw new Error(`Unknown entry: ${unreachable}`); }
    }
    void onSubmit(entry);
  };
  return <Stack component="form" onSubmit={submit} gap={2} sx={{ mt: 1 }}>
    {error && <Alert severity="error">{error}</Alert>}
    <TextField select label="Entry type" value={type} onChange={event => {
      const selected = entryTypes.find(value => value === event.target.value);
      if (selected) setType(selected);
    }}>{entryTypes.map(value => <MenuItem key={value} value={value}>{value}</MenuItem>)}</TextField>
    <TextField required label="Date" type="date" slotProps={{ inputLabel: { shrink: true } }} value={date} onChange={event => setDate(event.target.value)} />
    <TextField autoFocus required multiline label="Description" value={description} onChange={event => setDescription(event.target.value)} />
    <TextField required label="Specialist" value={specialist} onChange={event => setSpecialist(event.target.value)} />
    <FormControl><InputLabel id="diagnosis-label">Diagnosis codes</InputLabel><Select multiple labelId="diagnosis-label" value={diagnosisCodes} input={<OutlinedInput label="Diagnosis codes" />} onChange={event => {
      const value = event.target.value;
      setCodes(typeof value === 'string' ? value.split(',') : value);
    }} renderValue={selected => selected.join(', ')}>{diagnoses.map(diagnosis => <MenuItem key={diagnosis.code} value={diagnosis.code} sx={{ whiteSpace: 'normal' }}>{diagnosis.code} {diagnosis.name}</MenuItem>)}</Select></FormControl>
    {type === 'HealthCheck' && <TextField select label="Health rating" value={rating} onChange={event => {
      const selected = ratings.find(option => option.value === Number(event.target.value));
      if (selected) setRating(selected.value);
    }}>{ratings.map(option => <MenuItem key={option.value} value={option.value}>{option.value} – {option.label}</MenuItem>)}</TextField>}
    {type === 'Hospital' && <><TextField required label="Discharge date" type="date" slotProps={{ inputLabel: { shrink: true } }} value={dischargeDate} onChange={event => setDischargeDate(event.target.value)} /><TextField required label="Discharge criteria" value={criteria} onChange={event => setCriteria(event.target.value)} /></>}
    {type === 'OccupationalHealthcare' && <><TextField required label="Employer" value={employerName} onChange={event => setEmployerName(event.target.value)} />
      <TextField label="Sick leave start" required={Boolean(endDate)} type="date" slotProps={{ inputLabel: { shrink: true } }} value={startDate} onChange={event => setStartDate(event.target.value)} />
      <TextField label="Sick leave end" required={Boolean(startDate)} type="date" slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: startDate } }} value={endDate} onChange={event => setEndDate(event.target.value)} /></>}
    <Stack direction="row" justifyContent="space-between"><Button disabled={saving} onClick={onCancel}>Cancel</Button><Button variant="contained" disabled={saving} type="submit">{saving ? 'Saving…' : 'Add'}</Button></Stack>
  </Stack>;
};
export default EntryForm;
