import { toNumber } from './input.ts';

export interface ExerciseResult {
  periodLength: number;
  trainingDays: number;
  success: boolean;
  rating: 1 | 2 | 3;
  ratingDescription: string;
  target: number;
  average: number;
}

export const calculateExercises = (hours: number[], target: number): ExerciseResult => {
  if (hours.length === 0 || !Number.isFinite(target) || target <= 0 ||
      hours.some(hour => !Number.isFinite(hour) || hour < 0)) {
    throw new Error('malformatted parameters');
  }
  const average = hours.reduce((sum, hour) => sum + hour, 0) / hours.length;
  const rating = average >= target ? 3 : average >= target * 0.5 ? 2 : 1;
  return {
    periodLength: hours.length,
    trainingDays: hours.filter(hour => hour > 0).length,
    success: average >= target,
    rating,
    ratingDescription: rating === 3 ? 'target reached, well done' : rating === 2 ?
      'not too bad but could be better' : 'more regular exercise would help',
    target,
    average,
  };
};

if (process.argv[1] === import.meta.filename) {
  try {
    const args = process.argv.slice(2);
    if (args.length < 2) throw new Error('Expected a target and at least one day');
    console.log(calculateExercises(args.slice(1).map(toNumber), toNumber(args[0])));
  } catch (error: unknown) {
    console.error(error instanceof Error ? error.message : 'Invalid input');
    process.exitCode = 1;
  }
}
