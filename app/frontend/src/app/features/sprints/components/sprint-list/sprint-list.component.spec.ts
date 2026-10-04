import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { SprintListComponent } from './sprint-list.component';

const SPRINTS = [
  { id: '3fa85f64-5717-4562-b3fc-2c963f66afa6', identification: 'Sprint 2026-01', startDate: '2026-10-05', endDate: '2026-10-18' },
  { id: '7b201e44-0000-4000-8000-000000000c3a', identification: 'Sprint 2026-02', startDate: '2026-10-19', endDate: '2026-11-01' },
];

// HU-003 — listado: estados de carga, vacío, error y con datos; consulta fresca en cada navegación.
describe('SprintListComponent', () => {
  let http: HttpTestingController;

  const create = () => {
    const fixture = TestBed.createComponent(SprintListComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SprintListComponent],
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting(), provideRouter([]), MessageService],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('constructor_DebeIniciarEnEstadoCargandoYConsultarElServidor', () => {
    // Act
    const { componentInstance } = create();

    // Assert
    expect(componentInstance.state().status).toBe('loading');
    expect(http.expectOne('/api/sprints').request.method).toBe('GET');
  });

  it('state_ConRespuestaConDatos_DebeExponerLosSprints', () => {
    // Arrange
    const { componentInstance } = create();

    // Act
    http.expectOne('/api/sprints').flush(SPRINTS);

    // Assert
    expect(componentInstance.state()).toEqual({ status: 'ready', sprints: SPRINTS });
  });

  it('render_ConDatos_DebeMostrarLasColumnasDeLaHuYNingunaAccionDeEdicion', () => {
    // Arrange
    const fixture = create();
    http.expectOne('/api/sprints').flush(SPRINTS);

    // Act
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    // Assert
    expect(text).toContain('Sprint 2026-01');
    expect(text).toContain('05/10/2026');
    expect(text).toContain('01/11/2026');
    expect(text).not.toMatch(/Editar|Eliminar|Cancelar|Estado/);
  });

  it('render_ConListaVacia_DebeMostrarMensajeInformativoYBotonNuevoSprint', () => {
    // Arrange
    const fixture = create();
    http.expectOne('/api/sprints').flush([]);

    // Act
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    // Assert
    expect(text).toContain('No hay Sprints registrados');
    expect(text).toContain('Nuevo Sprint');
  });

  it('state_ConRespuesta500_DebeSerErrorYReintentarDebeConsultarDeNuevo', () => {
    // Arrange
    const { componentInstance } = create();
    http.expectOne('/api/sprints').flush({}, { status: 500, statusText: 'Server Error' });
    expect(componentInstance.state().status).toBe('error');

    // Act
    componentInstance.reload();
    http.expectOne('/api/sprints').flush(SPRINTS);

    // Assert
    expect(componentInstance.state().status).toBe('ready');
  });

  it('state_ConRespuesta401_DebeSerUnauthorized', () => {
    // Arrange
    const { componentInstance } = create();

    // Act
    http.expectOne('/api/sprints').flush({}, { status: 401, statusText: 'Unauthorized' });

    // Assert
    expect(componentInstance.state().status).toBe('unauthorized');
  });

  it('navegacionRepetida_DebeConsultarElServidorEnCadaCreacion', () => {
    // Arrange / Act
    const first = create();
    http.expectOne('/api/sprints').flush([]);
    first.destroy();
    create();

    // Assert
    http.expectOne('/api/sprints').flush(SPRINTS);
  });
});
