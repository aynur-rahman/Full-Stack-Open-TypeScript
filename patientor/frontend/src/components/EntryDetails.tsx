import { Paper, Typography } from '@mui/material';
import { LocalHospital, MedicalServices, Work } from '@mui/icons-material';
import type { Entry, Diagnosis } from '../types';
import HealthRatingBar from './HealthRatingBar';
const assertNever = (entry: never): never => { throw new Error(`Unknown entry type: ${JSON.stringify(entry)}`); };
const Details = ({ entry }: { entry: Entry }) => {
  switch (entry.type) {
    case 'HealthCheck': return <><Typography><MedicalServices aria-hidden fontSize="small" /> Health check</Typography><HealthRatingBar rating={entry.healthCheckRating} showText /></>;
    case 'Hospital': return <><Typography><LocalHospital aria-hidden fontSize="small" /> Hospital</Typography><p>Discharged {entry.discharge.date}: {entry.discharge.criteria}</p></>;
    case 'OccupationalHealthcare': return <><Typography><Work aria-hidden fontSize="small" /> Occupational healthcare · {entry.employerName}</Typography>{entry.sickLeave && <p>Sick leave: {entry.sickLeave.startDate} – {entry.sickLeave.endDate}</p>}</>;
    default: return assertNever(entry);
  }
};
const EntryDetails = ({ entry, diagnoses }: { entry: Entry; diagnoses: Diagnosis[] }) => <Paper component="article" variant="outlined" sx={{ p: 2, my: 2, overflowWrap: 'anywhere' }}>
  <Typography variant="h6" component="h3">{entry.date}</Typography><p>{entry.description}</p>
  <Details entry={entry} />
  {entry.diagnosisCodes && entry.diagnosisCodes.length > 0 && <ul>{entry.diagnosisCodes.map(code => <li key={code}>{code} {diagnoses.find(diagnosis => diagnosis.code === code)?.name ?? 'Unknown diagnosis'}</li>)}</ul>}
  <p>Specialist: {entry.specialist}</p>
</Paper>;
export default EntryDetails;
