import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Link } from 'react-router-dom';
import { Button, Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Typography, Paper } from '@mui/material';
import type { PublicPatient, PatientFormValues } from '../../types';
import AddPatientModal from '../AddPatientModal';
import patientService, { errorMessage } from '../../services/patients';
interface Props { patients: PublicPatient[]; setPatients: Dispatch<SetStateAction<PublicPatient[]>> }
const PatientListPage = ({ patients, setPatients }: Props) => {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const close = () => { if (!saving) { setOpen(false); setError(undefined); } };
  const submit = async (input: PatientFormValues) => {
    setSaving(true); setError(undefined);
    try {
      const patient = await patientService.create(input);
      setPatients(current => current.concat(patient)); setOpen(false);
    } catch (e: unknown) { setError(errorMessage(e)); }
    finally { setSaving(false); }
  };
  return <><Typography variant="h5" component="h2">Patient list</Typography>
    <TableContainer component={Paper} sx={{ my: 2 }}><Table sx={{ tableLayout: 'fixed', '& td, & th': { overflowWrap: 'anywhere', px: { xs: 1, sm: 2 } } }}>
      <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Gender</TableCell><TableCell>Occupation</TableCell></TableRow></TableHead>
      <TableBody>{patients.map(patient => <TableRow key={patient.id}><TableCell><Link to={`/patients/${patient.id}`}>{patient.name}</Link></TableCell><TableCell>{patient.gender}</TableCell><TableCell>{patient.occupation}</TableCell></TableRow>)}</TableBody>
    </Table></TableContainer>
    {patients.length === 0 && <p>No patients yet.</p>}
    <Button variant="contained" onClick={() => setOpen(true)}>Add New Patient</Button>
    <AddPatientModal modalOpen={open} onClose={close} onSubmit={submit} error={error} saving={saving} />
  </>;
};
export default PatientListPage;
