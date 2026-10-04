import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentRef, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { AssignItemDialogComponent } from './assign-item-dialog.component';
import { AssignedItem } from '../../models/sprint.models';

const SPRINT_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
const ITEM_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const URL = `/api/sprints/${SPRINT_ID}/items`;

// HU-004 — diálogo de asignación: envío, cierre, errores del servidor y ausencia de validación de negocio en el cliente.
describe('AssignItemDialogComponent', () => {
  let http: HttpTestingController;
  let component: AssignItemDialogComponent;
  let ref: ComponentRef<AssignItemDialogComponent>;
  let assigned: AssignedItem[];
  let unauthorized: number;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AssignItemDialogComponent],
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(AssignItemDialogComponent);
    ref = fixture.componentRef;
    ref.setInput('sprintId', SPRINT_ID);
    ref.setInput('sprintName', 'Sprint 2026-01');
    ref.setInput('visible', true);
    component = fixture.componentInstance;
    assigned = [];
    unauthorized = 0;
    component.assigned.subscribe((value) => assigned.push(value));
    component.unauthorized.subscribe(() => unauthorized++);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  const submit = (value = ITEM_ID) => {
    component.form.controls.itemId.setValue(value);
    component.onSubmit();
    return http.expectOne(URL);
  };

  it('onSubmit_DebeDeshabilitarElBotonMientrasHayEnvioEnCursoYNoDuplicarSolicitudes', () => {
    // Arrange
    component.form.controls.itemId.setValue(ITEM_ID);

    // Act
    component.onSubmit();
    component.onSubmit();

    // Assert
    expect(component.isSubmitting()).toBe(true);
    http.expectOne(URL).flush({ sprintId: SPRINT_ID, itemId: ITEM_ID }, { status: 201, statusText: 'Created' });
    expect(component.isSubmitting()).toBe(false);
  });

  it('onSubmit_Con201_DebeCerrarElDialogoYEmitirElEvento', () => {
    // Arrange / Act
    const req = submit();
    req.flush({ sprintId: SPRINT_ID, itemId: ITEM_ID }, { status: 201, statusText: 'Created' });

    // Assert
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ itemId: ITEM_ID });
    expect(component.visible()).toBe(false);
    expect(assigned).toEqual([{ sprintId: SPRINT_ID, itemId: ITEM_ID }]);
  });

  it('onSubmit_ConCampoVacio_DebeEnviarAlServidorSinValidarEnElCliente', () => {
    // Arrange / Act
    const req = submit('   ');
    req.flush(
      { errors: { itemId: ['El identificador del elemento es obligatorio.'] } },
      { status: 400, statusText: 'Bad Request' },
    );

    // Assert
    expect(req.request.body).toEqual({ itemId: '' });
    expect(component.fieldError()).toBe('El identificador del elemento es obligatorio.');
    expect(component.banner()?.message).toContain('Revise los campos marcados');
    expect(component.visible()).toBe(true);
  });

  it('onSubmit_Con400DeItemId_DebeConservarElValorYMostrarElErrorDelCampo', () => {
    // Arrange / Act
    submit('no-es-un-id').flush(
      { errors: { itemId: ['El identificador del elemento no tiene un formato válido.'] } },
      { status: 400, statusText: 'Bad Request' },
    );

    // Assert
    expect(component.form.controls.itemId.value).toBe('no-es-un-id');
    expect(component.fieldError()).toContain('formato válido');
    expect(component.visible()).toBe(true);
    expect(assigned).toHaveLength(0);
  });

  it('onSubmit_Con400SoloDeSprintId_DebeMostrarBannerSinErrorEnElCampo', () => {
    // Arrange / Act
    submit().flush(
      { errors: { sprintId: ['El identificador del Sprint no tiene un formato válido.'] } },
      { status: 400, statusText: 'Bad Request' },
    );

    // Assert
    expect(component.fieldError()).toBeNull();
    expect(component.banner()?.message).toContain('identificador del Sprint');
  });

  it('onSubmit_Con404DeElemento_DebeConservarElValorYPermitirReintentar', () => {
    // Arrange / Act
    submit().flush(
      { status: 404, detail: 'El elemento del backlog indicado no existe.' },
      { status: 404, statusText: 'Not Found' },
    );

    // Assert
    expect(component.banner()?.message).toContain('elemento del backlog indicado no existe');
    expect(component.fieldError()).toContain('No existe un elemento');
    expect(component.form.controls.itemId.value).toBe(ITEM_ID);
    expect(component.sprintMissing()).toBe(false);
    expect(component.isSubmitting()).toBe(false);
  });

  it('onSubmit_Con404DeSprint_DebeBloquearElReintento', () => {
    // Arrange
    submit().flush({ status: 404, detail: 'El Sprint indicado no existe.' }, { status: 404, statusText: 'Not Found' });

    // Act
    component.onSubmit();

    // Assert
    http.expectNone(URL);
    expect(component.sprintMissing()).toBe(true);
    expect(component.banner()?.message).toContain('El Sprint indicado no existe');
    expect(component.fieldError()).toBeNull();
  });

  it('onSubmit_Con409_DebeMostrarAdvertenciaSinRevelarElSprintYConservarElValor', () => {
    // Arrange / Act
    submit().flush(
      { status: 409, detail: 'El elemento ya está asignado a un Sprint.' },
      { status: 409, statusText: 'Conflict' },
    );

    // Assert
    expect(component.banner()?.severity).toBe('warn');
    expect(component.banner()?.message).toContain('El elemento ya está asignado a un Sprint');
    expect(component.fieldError()).toBe('Este elemento ya pertenece a un Sprint.');
    expect(component.form.controls.itemId.value).toBe(ITEM_ID);
    expect(component.visible()).toBe(true);
    expect(assigned).toHaveLength(0);
  });

  it('onSubmit_Con500_DebeMostrarMensajeGenericoSinExponerDetallesYConservarElValor', () => {
    // Arrange / Act
    submit().flush({ detail: 'traza interna' }, { status: 500, statusText: 'Server Error' });

    // Assert
    expect(component.banner()?.severity).toBe('error');
    expect(component.banner()?.message).toContain('No fue posible asignar el elemento');
    expect(component.banner()?.message).not.toContain('traza interna');
    expect(component.form.controls.itemId.value).toBe(ITEM_ID);
    expect(component.isSubmitting()).toBe(false);
    expect(assigned).toHaveLength(0);
  });

  it('onSubmit_Con401_DebeCerrarElDialogoYNotificarSesionInvalida', () => {
    // Arrange / Act
    submit().flush({}, { status: 401, statusText: 'Unauthorized' });

    // Assert
    expect(component.visible()).toBe(false);
    expect(unauthorized).toBe(1);
  });

  it('resetState_DebeLimpiarCampoYErroresAlReabrir', () => {
    // Arrange
    submit().flush({ status: 409 }, { status: 409, statusText: 'Conflict' });

    // Act
    component.resetState();

    // Assert
    expect(component.form.controls.itemId.value).toBe('');
    expect(component.banner()).toBeNull();
    expect(component.fieldError()).toBeNull();
    expect(component.sprintMissing()).toBe(false);
  });

  it('onCancel_DebeCerrarSinEnviarNada', () => {
    // Arrange / Act
    component.onCancel();

    // Assert
    http.expectNone(URL);
    expect(component.visible()).toBe(false);
  });
});
