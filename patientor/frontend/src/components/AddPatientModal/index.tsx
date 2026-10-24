import { Dialog, DialogTitle, DialogContent, Alert } from '@mui/material';
import type { PatientFormValues } from '../../types';
import AddPatientForm from './AddPatientForm';
interface Props { modalOpen: boolean; onClose: () => void; onSubmit: (values: PatientFormValues) => Promise<void>; error?: string; saving: boolean }
const AddPatientModal = ({ modalOpen, onClose, onSubmit, error, saving }: Props) => <Dialog fullWidth open={modalOpen} onClose={onClose} aria-labelledby="new-patient-title"><DialogTitle id="new-patient-title">Add a new patient</DialogTitle><DialogContent>{error && <Alert severity="error">{error}</Alert>}<AddPatientForm onSubmit={onSubmit} onCancel={onClose} saving={saving} /></DialogContent></Dialog>;
export default AddPatientModal;
