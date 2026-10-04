import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink, UrlTree, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { SprintDetailComponent } from './sprint-detail.component';

const SPRINT = {
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  identification: 'Sprint 2026-01',
  startDate: '2026-10-05',
  endDate: '2026-10-18',
};

// HU-003 — detalle: datos de solo lectura, 404 "Sprint no existe" y error genérico.
describe('SprintDetailComponent', () => {
  let http: HttpTestingController;

  const create = () => {
    const fixture = TestBed.createComponent(SprintDetailComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SprintDetailComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: SPRINT.id })) } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('render_ConSprintExistente_DebeMostrarIdentificacionYFechas', () => {
    // Arrange
    const fixture = create();
    const req = http.expectOne(`/api/sprints/${SPRINT.id}`);

    // Act
    req.flush(SPRINT);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    // Assert
    expect(req.request.method).toBe('GET');
    expect(text).toContain(SPRINT.id);
    expect(text).toContain('Sprint 2026-01');
    expect(text).toContain('05/10/2026');
    expect(text).toContain('18/10/2026');
    expect(text).not.toMatch(/Editar|Eliminar|Cancelar/);
  });

  it('render_ConSprintExistente_DebeOfrecerElBotonElementosAsignadosHaciaSuRuta', () => {
    // Arrange
    const fixture = create();
    http.expectOne(`/api/sprints/${SPRINT.id}`).flush(SPRINT);

    // Act
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const router = TestBed.inject(Router);
    const targets = fixture.debugElement
      .queryAll(By.directive(RouterLink))
      .filter((el) => (el.nativeElement as HTMLElement).textContent?.includes('Elementos asignados'))
      .map((el) => router.serializeUrl(el.injector.get(RouterLink).urlTree as UrlTree));

    // Assert
    expect(targets).toEqual([`/sprints/${SPRINT.id}/elementos`]);
    expect(root.textContent).toContain('Sprint 2026-01');
  });

  it('render_Con404_DebeMostrarSprintNoExisteYNingunDato', () => {
    // Arrange
    const fixture = create();

    // Act
    http.expectOne(`/api/sprints/${SPRINT.id}`).flush({}, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    // Assert
    expect(fixture.componentInstance.state().status).toBe('notFound');
    expect(text).toContain('El Sprint solicitado no existe');
    expect(text).toContain('Volver al listado');
    expect(text).not.toContain('FECHA DE INICIO');
  });

  it('state_Con500_DebeSerErrorSinExponerDetallesInternos', () => {
    // Arrange
    const fixture = create();

    // Act
    http.expectOne(`/api/sprints/${SPRINT.id}`).flush({ detail: 'traza interna' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    // Assert
    expect(fixture.componentInstance.state().status).toBe('error');
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('traza interna');
  });

  it('state_Con401_DebeSerUnauthorized', () => {
    // Arrange
    const fixture = create();

    // Act
    http.expectOne(`/api/sprints/${SPRINT.id}`).flush({}, { status: 401, statusText: 'Unauthorized' });

    // Assert
    expect(fixture.componentInstance.state().status).toBe('unauthorized');
  });
});
