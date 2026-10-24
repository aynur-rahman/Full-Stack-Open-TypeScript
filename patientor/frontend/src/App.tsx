import { useEffect, useState } from 'react';
import axios from 'axios';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Alert, Button, Container, Divider, Typography, ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import type { PublicPatient, Diagnosis } from './types';
import patientService, { errorMessage } from './services/patients';
import PatientListPage from './components/PatientListPage';
import PatientPage from './components/PatientPage';
import { apiBaseUrl } from './constants';
const theme = createTheme({ palette: { primary: { main: '#075985' }, background: { default: '#f0f9ff', paper: '#ffffff' } }, typography: { fontFamily: 'system-ui, sans-serif' }, components: { MuiButton: { styleOverrides: { root: { minHeight: 44 } } } } });
const App = () => {
  const [patients, setPatients] = useState<PublicPatient[]>([]);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    Promise.all([patientService.getAll(), patientService.getDiagnoses(), axios.get<string>(`${apiBaseUrl}/ping`)])
      .then(([list, codes]) => { if (active) { setPatients(list); setDiagnoses(codes); } })
      .catch((e: unknown) => { if (active) setError(errorMessage(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return <ThemeProvider theme={theme}><CssBaseline /><BrowserRouter><Container component="main" maxWidth="md" sx={{ py: 3 }}>
    <Typography variant="h3" component="h1" sx={{ mb: 2 }}>Patientor</Typography>
    <Button component={Link} to="/" variant="contained">Home</Button><Divider sx={{ my: 2 }} />
    {error && <Alert severity="error">{error}</Alert>}
    {loading ? <p role="status">Loading patient data…</p> : <Routes>
      <Route path="/" element={<PatientListPage patients={patients} setPatients={setPatients} />} />
      <Route path="/patients/:id" element={<PatientPage diagnoses={diagnoses} />} />
      <Route path="*" element={<Alert severity="info">Page not found. Use Home to return to the patient list.</Alert>} />
    </Routes>}
  </Container></BrowserRouter></ThemeProvider>;
};
export default App;
