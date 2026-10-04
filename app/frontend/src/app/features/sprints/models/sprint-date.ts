const pad = (value: number): string => String(value).padStart(2, '0');

/** Convierte una fecha local a `yyyy-MM-dd` sin pasar por UTC (evita corrimientos de día). */
export const toIsoDate = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
