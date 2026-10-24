import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Weather, Visibility } from './types';
import type { Diary } from './types';
import { getDiaries, addDiary, errorMessage } from './service';
const App = () => {
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState('');
  const [weather, setWeather] = useState<Weather>(Weather.Sunny);
  const [visibility, setVisibility] = useState<Visibility>(Visibility.Great);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let active = true;
    getDiaries().then(data => { if (active) setDiaries(data); })
      .catch((e: unknown) => { if (active) setError(errorMessage(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const created = await addDiary({ date, weather, visibility, comment });
      setDiaries(current => current.concat(created)); setDate(''); setComment('');
    } catch (e: unknown) { setError(errorMessage(e)); }
    finally { setSaving(false); }
  };
  return <main><h1>Flight diaries</h1><h2>Add new entry</h2>
    {error && <p role="alert">{error}</p>}
    <form onSubmit={event => { void submit(event); }}>
      <label>Date<input type="date" required value={date} onChange={event => setDate(event.target.value)} /></label>
      <fieldset><legend>Visibility</legend>{Object.values(Visibility).map(value => <label key={value}><input type="radio" name="visibility" value={value} checked={value === visibility} onChange={() => setVisibility(value)} />{value}</label>)}</fieldset>
      <fieldset><legend>Weather</legend>{Object.values(Weather).map(value => <label key={value}><input type="radio" name="weather" value={value} checked={value === weather} onChange={() => setWeather(value)} />{value}</label>)}</fieldset>
      <label>Comment<textarea value={comment} onChange={event => setComment(event.target.value)} /></label>
      <button disabled={saving} type="submit">{saving ? 'Saving…' : 'Add'}</button>
    </form><h2>Diary entries</h2>
    {loading ? <p role="status">Loading diaries…</p> : diaries.length === 0 ? <p>No diary entries yet.</p> : diaries.map(diary => <section key={diary.id}><h3>{diary.date}</h3><p>Visibility: {diary.visibility}</p><p>Weather: {diary.weather}</p></section>)}
  </main>;
};
export default App;
