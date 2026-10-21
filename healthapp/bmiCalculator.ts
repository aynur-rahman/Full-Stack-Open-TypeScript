import { toNumber } from './input.ts';

export const calculateBmi = (height: number, weight: number): string => {
  if (!Number.isFinite(height) || !Number.isFinite(weight) || height <= 0 || weight <= 0) {
    throw new Error('malformatted parameters');
  }
  const bmi = weight / (height / 100) ** 2;
  if (bmi < 16) return 'Underweight (Severe thinness)';
  if (bmi < 17) return 'Underweight (Moderate thinness)';
  if (bmi < 18.5) return 'Underweight (Mild thinness)';
  if (bmi < 25) return 'Normal range';
  if (bmi < 30) return 'Overweight (Pre-obese)';
  if (bmi < 35) return 'Obese (Class I)';
  if (bmi < 40) return 'Obese (Class II)';
  return 'Obese (Class III)';
};

if (process.argv[1] === import.meta.filename) {
  try {
    const args = process.argv.slice(2);
    if (args.length !== 2) throw new Error('Expected height (cm) and weight (kg)');
    console.log(calculateBmi(toNumber(args[0]), toNumber(args[1])));
  } catch (error: unknown) {
    console.error(error instanceof Error ? error.message : 'Invalid input');
    process.exitCode = 1;
  }
}
