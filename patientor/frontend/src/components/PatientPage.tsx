import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Button, Dialog, DialogTitle, DialogContent, Typography } from '@mui/material';
import type { Patient, Diagnosis, NewEntry } from '../types';
import service, { errorMessage } from '../services/patients';
import EntryDetails from './EntryDetails';
import EntryForm from './EntryForm';
const PatientDetail = ({ id, diagnoses }: { id: string; diagnoses: Diagnosis[] }) => {
  const [patient, setPatient] = useState<Patient>();
  const [error, setError] = useState('');
  const [entryError, setEntryError] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let active = true;
    service.get(id).then(data => { if (active) setPatient(data); })
      .catch((e: unknown) => { if (active) setError(errorMessage(e)); });
    return () => { active = false; };
  }, [id]);
  const submit = async (input: NewEntry) => {
    setSaving(true); setEntryError('');
    try {
      const entry = await service.addEntry(id, input);
      setPatient(current => current ? { ...current, entries: current.entries.concat(entry) } : current);
      setOpen(false);
    } catch (e: unknown) { setEntryError(errorMessage(e)); }
    finally { setSaving(false); }
  };
  const close = () => { if (!saving) { setOpen(false); setEntryError(''); } };
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!patient) return <p role="status">Loading patient…</p>;
  return <>
    <Typography variant="h4" component="h2">{patient.name}</Typography>
    <p>Gender: {patient.gender}</p><p>Date of birth: {patient.dateOfBirth}</p>
    <p>SSN: <span>{patient.ssn}</span></p><p>Occupation: <span>{patient.occupation}</span></p>
    <Typography variant="h5" component="h2">Entries</Typography>
    {patient.entries.length === 0 && <p>No entries yet.</p>}
    {patient.entries.map(entry => <EntryDetails key={entry.id} entry={entry} diagnoses={diagnoses} />)}
    <Button variant="contained" onClick={() => setOpen(true)}>Add New Entry</Button>
    <Dialog fullWidth open={open} onClose={close} aria-labelledby="entry-title"><DialogTitle id="entry-title">Add a new entry</DialogTitle><DialogContent><EntryForm diagnoses={diagnoses} onSubmit={submit} onCancel={close} saving={saving} error={entryError} /></DialogContent></Dialog>
  </>;
};
const PatientPage = ({ diagnoses }: { diagnoses: Diagnosis[] }) => {
  const { id } = useParams();
  return id ? <PatientDetail key={id} id={id} diagnoses={diagnoses} /> : <Alert severity="error">Patient not found</Alert>;
};
export default PatientPage;
