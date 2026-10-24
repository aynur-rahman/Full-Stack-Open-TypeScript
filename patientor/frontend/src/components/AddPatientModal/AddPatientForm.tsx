import { useState } from 'react';
import { Button, Stack, TextField, MenuItem } from '@mui/material';
import type { PatientFormValues } from '../../types';
import { Gender } from '../../types';
interface Props { onCancel: () => void; onSubmit: (values: PatientFormValues) => Promise<void>; saving: boolean }
const AddPatientForm = ({ onCancel, onSubmit, saving }: Props) => {
  const [values, setValues] = useState<PatientFormValues>({ name: '', ssn: '', dateOfBirth: '', occupation: '', gender: Gender.Other });
  return <Stack component="form" gap={2} sx={{ mt: 1 }} onSubmit={event => { event.preventDefault(); void onSubmit(values); }}>
    <TextField autoFocus required label="Name" value={values.name} onChange={event => setValues({ ...values, name: event.target.value })} />
    <TextField required label="Social security number" value={values.ssn} onChange={event => setValues({ ...values, ssn: event.target.value })} />
    <TextField required label="Date of birth" type="date" slotProps={{ inputLabel: { shrink: true } }} value={values.dateOfBirth} onChange={event => setValues({ ...values, dateOfBirth: event.target.value })} />
    <TextField required label="Occupation" value={values.occupation} onChange={event => setValues({ ...values, occupation: event.target.value })} />
    <TextField select label="Gender" value={values.gender} onChange={event => {
      const gender = Object.values(Gender).find(value => value === event.target.value);
      if (gender) setValues({ ...values, gender });
    }}>{Object.values(Gender).map(gender => <MenuItem key={gender} value={gender}>{gender}</MenuItem>)}</TextField>
    <Stack direction="row" justifyContent="space-between"><Button disabled={saving} onClick={onCancel}>Cancel</Button><Button disabled={saving} variant="contained" type="submit">{saving ? 'Saving…' : 'Add'}</Button></Stack>
  </Stack>;
};
export default AddPatientForm;
