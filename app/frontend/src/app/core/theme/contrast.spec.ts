import { contrastRatio } from './contrast';

describe('contrastRatio', () => {
  it('blanco sobre negro es 21:1', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5);
  });

  it('un color sobre sí mismo es 1:1', () => {
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
    expect(contrastRatio('#0092b8', '#0092b8')).toBeCloseTo(1, 5);
  });

  it('es simétrico respecto del orden de los argumentos', () => {
    expect(contrastRatio('#1e2939', '#f9fafb')).toBeCloseTo(contrastRatio('#f9fafb', '#1e2939'), 10);
  });

  it('blanco sobre #0092b8 ronda 3.62:1', () => {
    expect(Math.abs(contrastRatio('#ffffff', '#0092b8') - 3.62)).toBeLessThanOrEqual(0.01);
  });

  it('rechaza valores que no son #rrggbb', () => {
    expect(() => contrastRatio('rojo', '#ffffff')).toThrow();
  });
});
