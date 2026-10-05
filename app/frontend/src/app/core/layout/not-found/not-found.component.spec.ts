import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LAYOUT_TEXTS } from '../layout.texts';
import { NotFoundComponent } from './not-found.component';

describe('NotFoundComponent', () => {
  it('DebeMostrarUnMensajeInformativoSinRouterOutlet', () => {
    TestBed.configureTestingModule({ imports: [NotFoundComponent], providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(NotFoundComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('p-message')).not.toBeNull();
    expect(el.textContent).toContain(LAYOUT_TEXTS.notFound.title);
    expect(el.textContent).toContain(LAYOUT_TEXTS.notFound.message);
    expect(el.querySelector('router-outlet')).toBeNull();
  });
});
