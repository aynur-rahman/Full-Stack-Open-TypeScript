export const toNumber = (value: unknown): number => {
  if ((typeof value !== 'number' && typeof value !== 'string') ||
      (typeof value === 'string' && value.trim() === '') || !Number.isFinite(Number(value))) {
    throw new Error('malformatted parameters');
  }
  return Number(value);
};
