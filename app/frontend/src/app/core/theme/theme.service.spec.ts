import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { THEME_MODES, THEME_STORAGE_KEY, ThemeService } from './theme.service';

type Sistema = 'claro' | 'oscuro' | 'sin-matchmedia';

describe('ThemeService', () => {
  const originalMatchMedia = window.matchMedia;
  const root = document.documentElement;

  function mockSistema(sistema: Sistema) {
    let listener: ((e: MediaQueryListEvent) => void) | undefined;
    const query = {
      matches: sistema === 'oscuro',
      addEventListener: jest.fn((_: string, l: (e: MediaQueryListEvent) => void) => (listener = l)),
      removeEventListener: jest.fn(),
    };
    if (sistema === 'sin-matchmedia') {
      (window as { matchMedia?: unknown }).matchMedia = undefined;
    } else {
      window.matchMedia = jest.fn().mockReturnValue(query);
    }
    return { query, emit: (matches: boolean) => listener?.({ matches } as MediaQueryListEvent) };
  }

  const crear = () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    return TestBed.inject(ThemeService);
  };

  const dom = () => ({ oscuro: root.classList.contains('app-dark'), colorScheme: root.style.colorScheme });

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

  it('exporta la clave y los modos del contrato', () => {
    expect(THEME_STORAGE_KEY).toBe('app-theme-mode');
    expect([...THEME_MODES]).toEqual(['light', 'dark']);
  });

  describe('modo inicial sin elección guardada', () => {
    it.each<[Sistema, 'light' | 'dark']>([
      ['claro', 'light'],
      ['oscuro', 'dark'],
      ['sin-matchmedia', 'light'],
    ])('sistema %s → %s', (sistema, esperado) => {
      mockSistema(sistema);
      const servicio = crear();
      expect(servicio.mode()).toBe(esperado);
      expect(dom()).toEqual({ oscuro: esperado === 'dark', colorScheme: esperado });
    });
  });

  describe('elección guardada', () => {
    it.each<['light' | 'dark', Sistema]>([
      ['light', 'claro'],
      ['light', 'oscuro'],
      ['light', 'sin-matchmedia'],
      ['dark', 'claro'],
      ['dark', 'oscuro'],
      ['dark', 'sin-matchmedia'],
    ])('guardado %s con sistema %s prevalece', (guardado, sistema) => {
      localStorage.setItem(THEME_STORAGE_KEY, guardado);
      mockSistema(sistema);
      const servicio = crear();
      expect(servicio.mode()).toBe(guardado);
      expect(dom()).toEqual({ oscuro: guardado === 'dark', colorScheme: guardado });
    });

    it.each<[Sistema, 'light' | 'dark']>([
      ['claro', 'light'],
      ['oscuro', 'dark'],
    ])('valor inválido con sistema %s → %s y no se borra', (sistema, esperado) => {
      localStorage.setItem(THEME_STORAGE_KEY, 'sepia');
      mockSistema(sistema);
      expect(crear().mode()).toBe(esperado);
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('sepia');
    });

    it.each<[Sistema, 'light' | 'dark']>([
      ['claro', 'light'],
      ['oscuro', 'dark'],
    ])('getItem lanza con sistema %s → %s sin error', (sistema, esperado) => {
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new DOMException('bloqueado', 'SecurityError');
      });
      mockSistema(sistema);
      expect(crear().mode()).toBe(esperado);
    });
  });

  describe('toggle()', () => {
    it('alterna mode, la clase app-dark y color-scheme en el mismo turno síncrono', () => {
      mockSistema('claro');
      const servicio = crear();
      servicio.toggle();
      expect(servicio.mode()).toBe('dark');
      expect(dom()).toEqual({ oscuro: true, colorScheme: 'dark' });
      servicio.toggle();
      expect(servicio.mode()).toBe('light');
      expect(dom()).toEqual({ oscuro: false, colorScheme: 'light' });
    });

    it('parte del modo efectivo del sistema oscuro', () => {
      mockSistema('oscuro');
      const servicio = crear();
      servicio.toggle();
      expect(servicio.mode()).toBe('light');
      expect(dom()).toEqual({ oscuro: false, colorScheme: 'light' });
    });

    it('guarda la elección en app-theme-mode', () => {
      mockSistema('claro');
      const servicio = crear();
      servicio.toggle();
      expect(localStorage.getItem('app-theme-mode')).toBe('dark');
      servicio.toggle();
      expect(localStorage.getItem('app-theme-mode')).toBe('light');
    });

    it('con setItem bloqueado el modo cambia durante la sesión y no lanza', () => {
      mockSistema('claro');
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('cuota', 'QuotaExceededError');
      });
      const servicio = crear();
      expect(() => servicio.toggle()).not.toThrow();
      expect(servicio.mode()).toBe('dark');
      expect(dom().oscuro).toBe(true);
    });
  });

  describe('preferencia del sistema', () => {
    it('sin elección sigue los cambios de matchMedia', () => {
      const sistema = mockSistema('claro');
      const servicio = crear();
      sistema.emit(true);
      expect(servicio.mode()).toBe('dark');
      expect(dom()).toEqual({ oscuro: true, colorScheme: 'dark' });
      sistema.emit(false);
      expect(servicio.mode()).toBe('light');
      expect(dom()).toEqual({ oscuro: false, colorScheme: 'light' });
    });

    it('con elección guardada ignora el evento change', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
      const sistema = mockSistema('claro');
      const servicio = crear();
      sistema.emit(true);
      expect(servicio.mode()).toBe('light');
      expect(dom()).toEqual({ oscuro: false, colorScheme: 'light' });
    });

    it('con elección hecha con toggle() ignora el evento change', () => {
      const sistema = mockSistema('claro');
      const servicio = crear();
      servicio.toggle();
      sistema.emit(false);
      expect(servicio.mode()).toBe('dark');
    });

    it('libera el listener al destruirse', () => {
      const sistema = mockSistema('claro');
      crear();
      TestBed.resetTestingModule();
      expect(sistema.query.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('sin matchMedia no registra listener', () => {
      mockSistema('sin-matchmedia');
      expect(() => crear()).not.toThrow();
    });
  });
});
