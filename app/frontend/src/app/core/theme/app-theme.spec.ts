import { componentValue, primitiveValue, semanticValue } from './theme-token-resolver';

describe('appThemePreset', () => {
  describe('escalas primitivas (anclajes de Tailwind v4)', () => {
    const anclajes: Record<string, string> = {
      'gray.50': '#f9fafb',
      'gray.200': '#e5e7eb',
      'gray.400': '#99a1af',
      'gray.500': '#6a7282',
      'gray.700': '#364153',
      'gray.800': '#1e2939',
      'gray.900': '#101828',
      'cyan.500': '#00b8db',
      'cyan.600': '#0092b8',
      'cyan.700': '#007595',
      'red.500': '#fb2c36',
    };

    it.each(Object.entries(anclajes))('%s es %s', (path, esperado) => {
      expect(primitiveValue(path)).toBe(esperado);
    });
  });

  describe('modo claro', () => {
    it('primario #0092b8 con etiqueta #ffffff', () => {
      expect(semanticValue('primary.color', 'light')).toBe('#0092b8');
      expect(semanticValue('primary.contrast.color', 'light')).toBe('#ffffff');
    });

    it('fondo de página (surface.50) #f9fafb', () => {
      expect(semanticValue('surface.50', 'light')).toBe('#f9fafb');
    });

    it('tarjeta, menú, menubar y pie (content.background / surface.0) #ffffff', () => {
      expect(semanticValue('content.background', 'light')).toBe('#ffffff');
      expect(semanticValue('surface.0', 'light')).toBe('#ffffff');
      expect(componentValue('card', 'root.background', 'light')).toBe('#ffffff');
      expect(componentValue('menu', 'root.background', 'light')).toBe('#ffffff');
      expect(componentValue('menubar', 'root.background', 'light')).toBe('#ffffff');
    });

    it('borde #e5e7eb y navegación activa #e5e7eb', () => {
      expect(semanticValue('content.border.color', 'light')).toBe('#e5e7eb');
      expect(semanticValue('navigation.item.active.background', 'light')).toBe('#e5e7eb');
    });

    it('texto principal #1e2939 y secundario #6a7282', () => {
      expect(semanticValue('text.color', 'light')).toBe('#1e2939');
      expect(semanticValue('text.muted.color', 'light')).toBe('#6a7282');
    });

    it('peligro #fb2c36 contorneado y enlace #007595', () => {
      expect(componentValue('button', 'outlined.danger.color', 'light')).toBe('#fb2c36');
      expect(componentValue('button', 'outlined.danger.border.color', 'light')).toBe('#fb2c36');
      expect(componentValue('button', 'link.color', 'light')).toBe('#007595');
      expect(componentValue('button', 'text.primary.color', 'light')).toBe('#007595');
      expect(componentValue('button', 'outlined.primary.color', 'light')).toBe('#007595');
    });

    it('borde de campo de formulario #6a7282 (≥ 3:1, ADR-012)', () => {
      expect(semanticValue('form.field.border.color', 'light')).toBe('#6a7282');
      expect(semanticValue('form.field.hover.border.color', 'light')).toBe('#6a7282');
    });
  });

  describe('modo oscuro', () => {
    it('primario #00b8db con etiqueta #ffffff', () => {
      expect(semanticValue('primary.color', 'dark')).toBe('#00b8db');
      expect(semanticValue('primary.contrast.color', 'dark')).toBe('#ffffff');
    });

    it('fondo de página (surface.900) #101828', () => {
      expect(semanticValue('surface.900', 'dark')).toBe('#101828');
    });

    it('tarjeta, menú, menubar y pie (content.background) #1e2939', () => {
      expect(semanticValue('content.background', 'dark')).toBe('#1e2939');
      expect(semanticValue('surface.800', 'dark')).toBe('#1e2939');
      expect(componentValue('card', 'root.background', 'dark')).toBe('#1e2939');
      expect(componentValue('menu', 'root.background', 'dark')).toBe('#1e2939');
      expect(componentValue('menubar', 'root.background', 'dark')).toBe('#1e2939');
    });

    it('borde #364153 y navegación activa #364153', () => {
      expect(semanticValue('content.border.color', 'dark')).toBe('#364153');
      expect(semanticValue('navigation.item.active.background', 'dark')).toBe('#364153');
    });

    it('texto principal #e5e7eb y secundario #99a1af', () => {
      expect(semanticValue('text.color', 'dark')).toBe('#e5e7eb');
      expect(semanticValue('text.muted.color', 'dark')).toBe('#99a1af');
    });

    it('peligro #fb2c36 contorneado y enlace #00b8db', () => {
      expect(componentValue('button', 'outlined.danger.color', 'dark')).toBe('#fb2c36');
      expect(componentValue('button', 'outlined.danger.border.color', 'dark')).toBe('#fb2c36');
      expect(componentValue('button', 'link.color', 'dark')).toBe('#00b8db');
      expect(componentValue('button', 'text.primary.color', 'dark')).toBe('#00b8db');
      expect(componentValue('button', 'outlined.primary.color', 'dark')).toBe('#00b8db');
    });

    it('fondo de campo #1e2939 y borde de campo #99a1af (≥ 3:1, ADR-012)', () => {
      expect(semanticValue('form.field.background', 'dark')).toBe('#1e2939');
      expect(semanticValue('form.field.border.color', 'dark')).toBe('#99a1af');
      expect(semanticValue('form.field.hover.border.color', 'dark')).toBe('#99a1af');
    });
  });

  describe('radios (iguales en ambos modos)', () => {
    it.each(['light', 'dark'] as const)('contenedores 0.75rem en modo %s', (modo) => {
      expect(semanticValue('content.border.radius', modo)).toBe('0.75rem');
      expect(componentValue('card', 'root.border.radius', modo)).toBe('0.75rem');
      expect(componentValue('dialog', 'root.border.radius', modo)).toBe('0.75rem');
    });

    it.each(['light', 'dark'] as const)('controles y botones 0.5rem en modo %s', (modo) => {
      expect(semanticValue('form.field.border.radius', modo)).toBe('0.5rem');
      expect(componentValue('button', 'root.border.radius', modo)).toBe('0.5rem');
      expect(semanticValue('navigation.item.border.radius', modo)).toBe('0.5rem');
    });

    it.each(['light', 'dark'] as const)('menubar y menu sin radio en modo %s', (modo) => {
      expect(componentValue('menubar', 'root.border.radius', modo)).toBe('0');
      expect(componentValue('menu', 'root.border.radius', modo)).toBe('0');
    });
  });
});
