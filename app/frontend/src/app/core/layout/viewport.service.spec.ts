import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ViewportService } from './viewport.service';

describe('ViewportService', () => {
  const original = window.matchMedia;
  afterEach(() => {
    window.matchMedia = original;
  });

  function mockMatchMedia(matches: boolean) {
    let listener: ((e: MediaQueryListEvent) => void) | undefined;
    const query = {
      matches,
      addEventListener: jest.fn((_: string, l: (e: MediaQueryListEvent) => void) => (listener = l)),
      removeEventListener: jest.fn(),
    };
    window.matchMedia = jest.fn().mockReturnValue(query);
    return { query, emit: (m: boolean) => listener?.({ matches: m } as MediaQueryListEvent) };
  }

  const create = () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    return TestBed.inject(ViewportService);
  };

  it('isWide_SegunMatchMediaYSeActualizaConChange', () => {
    const mm = mockMatchMedia(false);
    const service = create();
    expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 1024px)');
    expect(service.isWide()).toBe(false);
    mm.emit(true);
    expect(service.isWide()).toBe(true);
  });

  it('DebeRemoverElListenerAlDestruirse', () => {
    const mm = mockMatchMedia(true);
    create();
    TestBed.resetTestingModule();
    expect(mm.query.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('SinMatchMedia_ValeTrue', () => {
    (window as { matchMedia?: unknown }).matchMedia = undefined;
    expect(create().isWide()).toBe(true);
  });
});
