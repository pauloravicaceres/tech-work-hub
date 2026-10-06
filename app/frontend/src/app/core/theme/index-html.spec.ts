import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { THEME_STORAGE_KEY, ThemeService } from './theme.service';

const html = readFileSync(join(process.cwd(), 'src', 'index.html'), 'utf8');
const scriptMatch = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/.exec(html);
const scriptTag = scriptMatch?.[0] ?? '';
const scriptCode = scriptMatch?.[2] ?? '';

type Sistema = 'claro' | 'oscuro' | 'sin-matchmedia';
type Almacen = 'ausente' | 'light' | 'dark' | 'invalido' | 'lanza';

const SISTEMAS: Sistema[] = ['claro', 'oscuro', 'sin-matchmedia'];
const ALMACENES: Almacen[] = ['ausente', 'light', 'dark', 'invalido', 'lanza'];

describe('index.html — script anti-parpadeo (HU-036)', () => {
  const originalMatchMedia = window.matchMedia;
  const root = document.documentElement;

  beforeEach(() => {
    localStorage.clear();
    root.classList.remove('app-dark');
    root.style.removeProperty('color-scheme');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    window.matchMedia = originalMatchMedia;
    TestBed.resetTestingModule();
  });

  function preparar(sistema: Sistema, almacen: Almacen) {
    if (sistema === 'sin-matchmedia') (window as { matchMedia?: unknown }).matchMedia = undefined;
    else
      window.matchMedia = jest.fn().mockReturnValue({
        matches: sistema === 'oscuro',
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      });
    if (almacen === 'light' || almacen === 'dark') localStorage.setItem(THEME_STORAGE_KEY, almacen);
    if (almacen === 'invalido') localStorage.setItem(THEME_STORAGE_KEY, 'azul');
    if (almacen === 'lanza')
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('bloqueado');
      });
  }

  const resultado = () => ({ oscuro: root.classList.contains('app-dark'), colorScheme: root.style.colorScheme });
  const reset = () => {
    root.classList.remove('app-dark');
    root.style.removeProperty('color-scheme');
  };

  it('existe un único <script> clásico, síncrono, sin async/defer/type=module', () => {
    expect(scriptMatch).not.toBeNull();
    expect(scriptTag).not.toMatch(/\b(?:async|defer)\b/);
    expect(scriptTag).not.toMatch(/type\s*=\s*["']module["']/);
    expect(html.match(/<script\b/g)?.length).toBe(1);
  });

  it('está en <head> antes de cualquier hoja de estilos y de <app-root>', () => {
    const head = html.indexOf('<head>');
    const fin = html.indexOf('</head>');
    const script = html.indexOf('<script');
    expect(script).toBeGreaterThan(head);
    expect(script).toBeLessThan(fin);
    const link = html.search(/<link[^>]+rel=["']stylesheet["']/);
    if (link !== -1) expect(script).toBeLessThan(link);
    expect(script).toBeLessThan(html.indexOf('<app-root'));
  });

  it('declara <meta name="color-scheme" content="light dark"> antes de las hojas de estilo', () => {
    const meta = html.indexOf('<meta name="color-scheme" content="light dark">');
    expect(meta).toBeGreaterThan(-1);
    const link = html.search(/<link[^>]+rel=["']stylesheet["']/);
    if (link !== -1) expect(meta).toBeLessThan(link);
  });

  it('no usa eval, innerHTML, Function ni colores literales', () => {
    expect(scriptCode).not.toMatch(/\beval\b|innerHTML|\bFunction\b/);
    expect(scriptCode).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch)\s*\(/);
  });

  describe.each(SISTEMAS)('sistema %s', (sistema) => {
    it.each(ALMACENES)('almacenamiento %s: coincide con ThemeService', (almacen) => {
      preparar(sistema, almacen);
      new Function(scriptCode)();
      const delScript = resultado();

      reset();
      TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
      TestBed.inject(ThemeService);
      const delServicio = resultado();

      expect(delScript).toEqual(delServicio);
    });
  });

  it('elección guardada gana sobre el sistema', () => {
    preparar('oscuro', 'light');
    new Function(scriptCode)();
    expect(resultado()).toEqual({ oscuro: false, colorScheme: 'light' });
  });
});
