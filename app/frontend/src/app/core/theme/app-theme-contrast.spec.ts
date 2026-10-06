import { contrastRatio } from './contrast';
import { ThemeModeName, componentValue, semanticValue } from './theme-token-resolver';

/**
 * SC-004 / FR-012: pares texto/fondo y de componentes con su umbral o excepción (spec.md, E-01..E-09).
 * La tabla es independiente del preset: los hex esperados se escribieron desde `spec.md`; el preset real
 * se resuelve token a token y debe coincidir con ellos.
 */
type Tipo = 'texto' | 'componente';
type Token = { fuente: 'semantic'; ruta: string } | { fuente: 'button'; ruta: string };

interface Par {
  rol: string;
  modo: ThemeModeName;
  tipo: Tipo;
  fg: Token;
  fgHex: string;
  bg: Token;
  bgHex: string;
  excepcion?: { id: string; ratio: number };
}

const s = (ruta: string): Token => ({ fuente: 'semantic', ruta });
const b = (ruta: string): Token => ({ fuente: 'button', ruta });

const PARES: Par[] = [
  // Texto principal y secundario sobre página, tarjeta y pie
  { rol: 'texto-principal/página', modo: 'light', tipo: 'texto', fg: s('text.color'), fgHex: '#1e2939', bg: s('surface.50'), bgHex: '#f9fafb' },
  { rol: 'texto-principal/página', modo: 'dark', tipo: 'texto', fg: s('text.color'), fgHex: '#e5e7eb', bg: s('surface.900'), bgHex: '#101828' },
  { rol: 'texto-principal/tarjeta', modo: 'light', tipo: 'texto', fg: s('text.color'), fgHex: '#1e2939', bg: s('content.background'), bgHex: '#ffffff' },
  { rol: 'texto-principal/tarjeta', modo: 'dark', tipo: 'texto', fg: s('text.color'), fgHex: '#e5e7eb', bg: s('content.background'), bgHex: '#1e2939' },
  { rol: 'texto-secundario/página', modo: 'light', tipo: 'texto', fg: s('text.muted.color'), fgHex: '#6a7282', bg: s('surface.50'), bgHex: '#f9fafb' },
  { rol: 'texto-secundario/página', modo: 'dark', tipo: 'texto', fg: s('text.muted.color'), fgHex: '#99a1af', bg: s('surface.900'), bgHex: '#101828' },
  { rol: 'texto-secundario/tarjeta', modo: 'light', tipo: 'texto', fg: s('text.muted.color'), fgHex: '#6a7282', bg: s('content.background'), bgHex: '#ffffff' },
  { rol: 'texto-secundario/tarjeta', modo: 'dark', tipo: 'texto', fg: s('text.muted.color'), fgHex: '#99a1af', bg: s('content.background'), bgHex: '#1e2939' },
  // Navegación activa
  { rol: 'texto-principal/navegación-activa', modo: 'light', tipo: 'texto', fg: s('text.color'), fgHex: '#1e2939', bg: s('navigation.item.active.background'), bgHex: '#e5e7eb' },
  { rol: 'texto-principal/navegación-activa', modo: 'dark', tipo: 'texto', fg: s('text.color'), fgHex: '#e5e7eb', bg: s('navigation.item.active.background'), bgHex: '#364153' },
  { rol: 'texto-secundario/navegación-activa', modo: 'light', tipo: 'texto', fg: s('text.muted.color'), fgHex: '#6a7282', bg: s('navigation.item.active.background'), bgHex: '#e5e7eb', excepcion: { id: 'E-06', ratio: 3.91 } },
  { rol: 'texto-secundario/navegación-activa', modo: 'dark', tipo: 'texto', fg: s('text.muted.color'), fgHex: '#99a1af', bg: s('navigation.item.active.background'), bgHex: '#364153', excepcion: { id: 'E-07', ratio: 3.96 } },
  // Botón primario
  { rol: 'etiqueta/botón-primario', modo: 'light', tipo: 'texto', fg: s('primary.contrast.color'), fgHex: '#ffffff', bg: s('primary.color'), bgHex: '#0092b8', excepcion: { id: 'E-01', ratio: 3.62 } },
  { rol: 'etiqueta/botón-primario', modo: 'dark', tipo: 'texto', fg: s('primary.contrast.color'), fgHex: '#ffffff', bg: s('primary.color'), bgHex: '#00b8db', excepcion: { id: 'E-03', ratio: 2.37 } },
  // Enlaces y botones de texto/contorno
  { rol: 'enlace/tarjeta', modo: 'light', tipo: 'texto', fg: b('link.color'), fgHex: '#007595', bg: s('content.background'), bgHex: '#ffffff' },
  { rol: 'enlace/tarjeta', modo: 'dark', tipo: 'texto', fg: b('link.color'), fgHex: '#00b8db', bg: s('content.background'), bgHex: '#1e2939' },
  { rol: 'enlace/página', modo: 'light', tipo: 'texto', fg: b('link.color'), fgHex: '#007595', bg: s('surface.50'), bgHex: '#f9fafb' },
  { rol: 'enlace/página', modo: 'dark', tipo: 'texto', fg: b('link.color'), fgHex: '#00b8db', bg: s('surface.900'), bgHex: '#101828' },
  { rol: 'botón-texto-primario/tarjeta', modo: 'light', tipo: 'texto', fg: b('text.primary.color'), fgHex: '#007595', bg: s('content.background'), bgHex: '#ffffff' },
  { rol: 'botón-texto-primario/tarjeta', modo: 'dark', tipo: 'texto', fg: b('text.primary.color'), fgHex: '#00b8db', bg: s('content.background'), bgHex: '#1e2939' },
  { rol: 'botón-contorno-primario/tarjeta', modo: 'light', tipo: 'texto', fg: b('outlined.primary.color'), fgHex: '#007595', bg: s('content.background'), bgHex: '#ffffff' },
  { rol: 'botón-contorno-primario/tarjeta', modo: 'dark', tipo: 'texto', fg: b('outlined.primary.color'), fgHex: '#00b8db', bg: s('content.background'), bgHex: '#1e2939' },
  // Peligro
  { rol: 'texto-peligro/tarjeta', modo: 'light', tipo: 'texto', fg: b('outlined.danger.color'), fgHex: '#fb2c36', bg: s('content.background'), bgHex: '#ffffff', excepcion: { id: 'E-04', ratio: 3.81 } },
  { rol: 'texto-peligro/tarjeta', modo: 'dark', tipo: 'texto', fg: b('outlined.danger.color'), fgHex: '#fb2c36', bg: s('content.background'), bgHex: '#1e2939', excepcion: { id: 'E-05', ratio: 3.85 } },
  { rol: 'borde-botón-peligro/tarjeta', modo: 'light', tipo: 'componente', fg: b('outlined.danger.border.color'), fgHex: '#fb2c36', bg: s('content.background'), bgHex: '#ffffff' },
  { rol: 'borde-botón-peligro/tarjeta', modo: 'dark', tipo: 'componente', fg: b('outlined.danger.border.color'), fgHex: '#fb2c36', bg: s('content.background'), bgHex: '#1e2939' },
  { rol: 'borde-botón-contorno-primario/tarjeta', modo: 'light', tipo: 'componente', fg: b('outlined.primary.border.color'), fgHex: '#007595', bg: s('content.background'), bgHex: '#ffffff' },
  { rol: 'borde-botón-contorno-primario/tarjeta', modo: 'dark', tipo: 'componente', fg: b('outlined.primary.border.color'), fgHex: '#00b8db', bg: s('content.background'), bgHex: '#1e2939' },
  // Campos de formulario
  { rol: 'texto-campo/campo', modo: 'light', tipo: 'texto', fg: s('form.field.color'), fgHex: '#1e2939', bg: s('form.field.background'), bgHex: '#ffffff' },
  { rol: 'texto-campo/campo', modo: 'dark', tipo: 'texto', fg: s('form.field.color'), fgHex: '#e5e7eb', bg: s('form.field.background'), bgHex: '#1e2939' },
  { rol: 'marcador/campo', modo: 'light', tipo: 'texto', fg: s('form.field.placeholder.color'), fgHex: '#99a1af', bg: s('form.field.background'), bgHex: '#ffffff', excepcion: { id: 'E-02', ratio: 2.6 } },
  { rol: 'marcador/campo', modo: 'dark', tipo: 'texto', fg: s('form.field.placeholder.color'), fgHex: '#99a1af', bg: s('form.field.background'), bgHex: '#1e2939' },
  { rol: 'borde-campo/campo', modo: 'light', tipo: 'componente', fg: s('form.field.border.color'), fgHex: '#6a7282', bg: s('form.field.background'), bgHex: '#ffffff' },
  { rol: 'borde-campo/campo', modo: 'dark', tipo: 'componente', fg: s('form.field.border.color'), fgHex: '#99a1af', bg: s('form.field.background'), bgHex: '#1e2939' },
  { rol: 'borde-campo-hover/campo', modo: 'light', tipo: 'componente', fg: s('form.field.hover.border.color'), fgHex: '#6a7282', bg: s('form.field.background'), bgHex: '#ffffff' },
  { rol: 'borde-campo-hover/campo', modo: 'dark', tipo: 'componente', fg: s('form.field.hover.border.color'), fgHex: '#99a1af', bg: s('form.field.background'), bgHex: '#1e2939' },
  // Bordes decorativos
  { rol: 'borde-decorativo/tarjeta', modo: 'light', tipo: 'componente', fg: s('content.border.color'), fgHex: '#e5e7eb', bg: s('content.background'), bgHex: '#ffffff', excepcion: { id: 'E-08', ratio: 1.24 } },
  { rol: 'borde-decorativo/tarjeta', modo: 'dark', tipo: 'componente', fg: s('content.border.color'), fgHex: '#364153', bg: s('content.background'), bgHex: '#1e2939', excepcion: { id: 'E-09', ratio: 1.42 } },
];

/** Roles de texto y de control que la tabla debe cubrir en ambos modos. */
const ROLES_REQUERIDOS = [
  'texto-principal/página',
  'texto-principal/tarjeta',
  'texto-secundario/página',
  'texto-secundario/tarjeta',
  'texto-principal/navegación-activa',
  'texto-secundario/navegación-activa',
  'etiqueta/botón-primario',
  'enlace/tarjeta',
  'enlace/página',
  'botón-texto-primario/tarjeta',
  'botón-contorno-primario/tarjeta',
  'texto-peligro/tarjeta',
  'borde-botón-peligro/tarjeta',
  'borde-botón-contorno-primario/tarjeta',
  'texto-campo/campo',
  'marcador/campo',
  'borde-campo/campo',
  'borde-campo-hover/campo',
  'borde-decorativo/tarjeta',
];

const resolver = (token: Token, modo: ThemeModeName): string =>
  token.fuente === 'semantic' ? semanticValue(token.ruta, modo) : componentValue('button', token.ruta, modo);

const UMBRAL: Record<Tipo, number> = { texto: 4.5, componente: 3 };

describe('contraste de la paleta (SC-004, FR-012)', () => {
  it('la tabla cubre todos los roles de texto y de control en ambos modos', () => {
    for (const modo of ['light', 'dark'] as const)
      for (const rol of ROLES_REQUERIDOS)
        expect(PARES.some((p) => p.rol === rol && p.modo === modo)).toBe(true);
  });

  it('las excepciones son exactamente E-01..E-09', () => {
    const ids = PARES.flatMap((p) => (p.excepcion ? [p.excepcion.id] : [])).sort();
    expect(ids).toEqual(['E-01', 'E-02', 'E-03', 'E-04', 'E-05', 'E-06', 'E-07', 'E-08', 'E-09']);
  });

  it.each(PARES.map((p) => [`${p.rol} (${p.modo})`, p] as const))('%s', (_nombre, par) => {
    const fg = resolver(par.fg, par.modo);
    const bg = resolver(par.bg, par.modo);
    expect(fg).toBe(par.fgHex);
    expect(bg).toBe(par.bgHex);

    const ratio = contrastRatio(fg, bg);
    if (par.excepcion) expect(Math.abs(ratio - par.excepcion.ratio)).toBeLessThan(0.01);
    else expect(ratio).toBeGreaterThanOrEqual(UMBRAL[par.tipo]);
  });

  it('el borde de campo cumple 3:1 sin acogerse a E-08/E-09 (ADR-012)', () => {
    for (const modo of ['light', 'dark'] as const) {
      const par = PARES.find((p) => p.rol === 'borde-campo/campo' && p.modo === modo);
      expect(par?.excepcion).toBeUndefined();
    }
  });

  it('el marcador #99a1af sobre campo oscuro #1e2939 es 5.63:1', () => {
    expect(Math.abs(contrastRatio('#99a1af', '#1e2939') - 5.63)).toBeLessThan(0.01);
  });
});
