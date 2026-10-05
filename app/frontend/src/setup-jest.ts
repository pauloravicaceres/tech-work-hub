import { setupZonelessTestEnv } from 'jest-preset-angular/setup-env/zoneless';

setupZonelessTestEnv();


// jsdom no implementa ResizeObserver y `p-tabs` (TabList) lo invoca al renderizar.
class ResizeObserverStub implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
globalThis.ResizeObserver ??= ResizeObserverStub;

// jsdom no implementa `matchMedia` y `p-menubar` y `ViewportService` lo consultan; por defecto, ancho reducido.
window.matchMedia ??= ((query: string) =>
  ({
    matches: false,
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }) as unknown as MediaQueryList) as typeof window.matchMedia;
