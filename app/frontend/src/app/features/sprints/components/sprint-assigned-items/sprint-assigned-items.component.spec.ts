import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { SprintAssignedItemsComponent } from './sprint-assigned-items.component';
import { SprintItem } from '../../models/sprint.models';

const SPRINT = {
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  identification: 'Sprint 2026-01',
  startDate: '2026-10-05',
  endDate: '2026-10-18',
};
const ITEMS: SprintItem[] = [
  { id: '9a41-1', title: 'Registro de aplicaciones', type: 'UserStory', devPoints: 8, qaPoints: 5 },
  { id: 'e5c8-2', title: 'Migrar esquema de auditoría', type: 'TechDebt', devPoints: 5, qaPoints: null },
];

// HU-004 — vista "Elementos asignados": grilla, estados, apertura del diálogo y refresco desde el servidor.
describe('SprintAssignedItemsComponent', () => {
  let http: HttpTestingController;
  let messages: MessageService;

  let routeId = SPRINT.id;

  const create = (id = SPRINT.id) => {
    routeId = id;
    const fixture = TestBed.createComponent(SprintAssignedItemsComponent);
    fixture.detectChanges();
    return fixture;
  };

  const flushLoad = (items: SprintItem[] = ITEMS) => {
    http.expectOne(`/api/sprints/${SPRINT.id}`).flush(SPRINT);
    http.expectOne(`/api/sprints/${SPRINT.id}/items`).flush(items);
  };

  const textOf = (fixture: { nativeElement: unknown }) => ((fixture.nativeElement as HTMLElement).textContent ?? '').replace(/\s+/g, ' ');

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SprintAssignedItemsComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        MessageService,
        { provide: ActivatedRoute, useFactory: () => ({ paramMap: of(convertToParamMap({ id: routeId })) }) },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    messages = TestBed.inject(MessageService);
  });

  afterEach(() => http.verify());

  it('render_ConElementos_DebeMostrarTituloTipoYPuntosDevYQa', () => {
    // Arrange
    const fixture = create();

    // Act
    flushLoad();
    fixture.detectChanges();
    const text = textOf(fixture);

    // Assert
    expect(text).toContain('ELEMENTOS ASIGNADOS - Sprint 2026-01');
    expect(text).toContain('Registro de aplicaciones');
    expect(text).toContain('UserStory');
    expect(text).toContain('Migrar esquema de auditoría');
    expect(text).toContain('TechDebt');
    expect(fixture.componentInstance.formatPoints(8)).toBe('8');
    expect(fixture.componentInstance.formatPoints(2.5)).toBe('2.5');
    expect(fixture.componentInstance.formatPoints(0)).toBe('0');
    expect(fixture.componentInstance.formatPoints(null)).toBe('—');
    expect(text).toContain('Asignar elemento');
  });

  it('render_SinAccionesDeQuitarMoverNiReasignar', () => {
    // Arrange
    const fixture = create();

    // Act
    flushLoad();
    fixture.detectChanges();

    // Assert
    expect(textOf(fixture)).not.toMatch(/Quitar|Mover|Reasignar|Desasignar|Eliminar/);
  });

  it('state_MientrasCarga_DebeSerLoadingYMostrarMensaje', () => {
    // Arrange / Act
    const fixture = create();

    // Assert
    expect(fixture.componentInstance.state().status).toBe('loading');
    expect(textOf(fixture)).toContain('Cargando elementos asignados');
    http.expectOne(`/api/sprints/${SPRINT.id}`);
    http.expectOne(`/api/sprints/${SPRINT.id}/items`);
  });

  it('render_SinElementos_DebeMostrarEstadoVacioInformativoYBotonActivo', () => {
    // Arrange
    const fixture = create();

    // Act
    flushLoad([]);
    fixture.detectChanges();
    const text = textOf(fixture);

    // Assert
    expect(text).toContain('Este Sprint aún no tiene elementos asignados');
    expect(text).toContain('Asignar elemento');
  });

  it('state_Con404DeSprint_DebeMostrarSprintNoExisteSinGrillaNiBotonAsignar', () => {
    // Arrange
    const fixture = create();

    // Act
    http.expectOne(`/api/sprints/${SPRINT.id}`).flush({}, { status: 404, statusText: 'Not Found' });
    http.match(`/api/sprints/${SPRINT.id}/items`);
    fixture.detectChanges();
    const text = textOf(fixture);

    // Assert
    expect(fixture.componentInstance.state().status).toBe('notFound');
    expect(text).toContain('El Sprint solicitado no existe');
    expect(text).toContain('Volver al listado de Sprints');
    expect(text).not.toContain('Asignar elemento');
  });

  it('state_ConIdMalformado_DebeMostrarErrorSinConsultarAlServidor', () => {
    // Arrange / Act
    const fixture = create('no-es-guid');
    fixture.detectChanges();

    // Assert
    http.expectNone(() => true);
    expect(fixture.componentInstance.state().status).toBe('invalidId');
    expect(textOf(fixture)).toContain('no tiene un formato válido');
  });

  it('state_Con500_DebeMostrarErrorGenericoConReintentoQueVuelveAConsultar', () => {
    // Arrange
    const fixture = create();
    http.expectOne(`/api/sprints/${SPRINT.id}`).flush({ detail: 'traza interna' }, { status: 500, statusText: 'Server Error' });
    http.match(`/api/sprints/${SPRINT.id}/items`);
    fixture.detectChanges();

    // Act
    const errorText = textOf(fixture);
    fixture.componentInstance.reload();
    flushLoad();

    // Assert
    expect(errorText).toContain('No fue posible consultar los elementos asignados');
    expect(errorText).not.toContain('traza interna');
    expect(errorText).toContain('Reintentar');
    expect(fixture.componentInstance.state().status).toBe('ready');
  });

  it('state_Con401_DebeAbrirElDialogoDeSesionInvalida', () => {
    // Arrange
    const fixture = create();

    // Act
    http.expectOne(`/api/sprints/${SPRINT.id}`).flush({}, { status: 401, statusText: 'Unauthorized' });
    http.match(`/api/sprints/${SPRINT.id}/items`);

    // Assert
    expect(fixture.componentInstance.state().status).toBe('unauthorized');
    expect(fixture.componentInstance.showSessionDialog()).toBe(true);
  });

  it('openDialog_DebeAbrirElDialogoDeAsignacion', () => {
    // Arrange
    const fixture = create();
    flushLoad();

    // Act
    fixture.componentInstance.openDialog();

    // Assert
    expect(fixture.componentInstance.dialogVisible()).toBe(true);
  });

  it('onAssigned_DebeMostrarToastYConsultarDeNuevoAlServidorSinInsertarLaFilaLocalmente', () => {
    // Arrange
    const fixture = create();
    flushLoad([ITEMS[0]]);
    const toast = jest.spyOn(messages, 'add');

    // Act
    fixture.componentInstance.onAssigned({ sprintId: SPRINT.id, itemId: ITEMS[1].id });
    const stateWhileRefreshing = fixture.componentInstance.state();
    flushLoad(ITEMS);

    // Assert
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success', detail: expect.stringContaining(ITEMS[1].id) }));
    expect(stateWhileRefreshing.status).toBe('ready');
    const current = fixture.componentInstance.state();
    expect(current.status === 'ready' && current.items).toEqual(ITEMS);
  });

  it('onUnauthorized_DebeMostrarElDialogoDeSesion', () => {
    // Arrange
    const fixture = create();
    flushLoad();

    // Act
    fixture.componentInstance.onUnauthorized();

    // Assert
    expect(fixture.componentInstance.showSessionDialog()).toBe(true);
  });
});
