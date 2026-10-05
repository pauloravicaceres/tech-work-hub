import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { MessageService } from 'primeng/api';
import { AssignAssigneeDialogComponent, AssignedEvent } from './assign-assignee-dialog.component';
import { BacklogItemSummary, ItemAssigneeResponse, TeamMember } from '../../models/team.models';

const ITEM_ID = '9c1a0000-0000-4000-8000-000000000101';
const ANA: TeamMember = { id: '5d2e71aa-0000-4000-8000-00000000c013', name: 'Ana Torres', role: 'Desarrollo' };
const LUIS: TeamMember = { id: '8f9004bc-0000-4000-8000-0000000002e7', name: 'Luis Rojas', role: 'QA' };
const ITEMS: BacklogItemSummary[] = [{ id: ITEM_ID, title: 'Historia 101', type: 'UserStory' }];
const ASSIGNMENT: ItemAssigneeResponse = { itemId: ITEM_ID, memberId: ANA.id, memberName: 'Ana Torres', role: 'Desarrollo' };
const ASSIGN_URL = `/api/backlog-items/${ITEM_ID}/assignees`;

// HU-015 — diálogo de asignación: selectores, rol de solo lectura, 201 vs 200 y errores del servidor.
describe('AssignAssigneeDialogComponent', () => {
  let http: HttpTestingController;
  let messages: MessageService;
  let component: AssignAssigneeDialogComponent;
  let assigned: AssignedEvent[];
  let unauthorized: number;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AssignAssigneeDialogComponent],
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting(), MessageService],
    });
    http = TestBed.inject(HttpTestingController);
    messages = TestBed.inject(MessageService);
    const fixture = TestBed.createComponent(AssignAssigneeDialogComponent);
    fixture.componentRef.setInput('visible', true);
    component = fixture.componentInstance;
    assigned = [];
    unauthorized = 0;
    component.assigned.subscribe((event) => assigned.push(event));
    component.unauthorized.subscribe(() => unauthorized++);
    fixture.detectChanges();
    http.expectOne('/api/backlog-items').flush(ITEMS);
    http.expectOne('/api/team-members').flush([ANA, LUIS]);
  });

  afterEach(() => http.verify());

  const submit = (itemId: string | null = ITEM_ID, memberId: string | null = ANA.id): TestRequest => {
    component.form.setValue({ itemId, memberId });
    component.onSubmit();
    return http.expectOne(ASSIGN_URL);
  };

  it('estado_DebeAlimentarLosSelectoresDesdeElServicio', () => {
    // Assert
    expect(component.itemsState()).toEqual({ loading: false, options: ITEMS });
    expect(component.membersState()).toEqual({ loading: false, options: [ANA, LUIS] });
  });

  it('selectedRole_DebeDerivarseDelMiembroSeleccionadoSinEnviarloEnLaSolicitud', () => {
    // Arrange
    component.form.controls.memberId.setValue(LUIS.id);

    // Assert
    expect(component.selectedRole()).toBe('QA');

    // Act
    const req = submit(ITEM_ID, LUIS.id);

    // Assert
    expect(req.request.body).toEqual({ memberId: LUIS.id });
    req.flush({ ...ASSIGNMENT, memberId: LUIS.id, memberName: LUIS.name, role: 'QA' }, { status: 201, statusText: 'Created' });
  });

  it('onSubmit_Con201_DebeMostrarToastDeAsignadoCerrarYEmitirCreado', () => {
    // Arrange
    const add = jest.spyOn(messages, 'add');

    // Act
    submit().flush(ASSIGNMENT, { status: 201, statusText: 'Created' });

    // Assert
    expect(add.mock.calls[0][0].severity).toBe('success');
    expect(add.mock.calls[0][0].detail).toContain('Ana Torres');
    expect(add.mock.calls[0][0].detail).toContain('Historia 101');
    expect(component.visible()).toBe(false);
    expect(assigned).toEqual([{ created: true, assignment: ASSIGNMENT }]);
  });

  it('onSubmit_Con200_DebeMostrarToastInformativoDistintoYEmitirNoCreado', () => {
    // Arrange
    const add = jest.spyOn(messages, 'add');

    // Act
    submit().flush(ASSIGNMENT, { status: 200, statusText: 'OK' });

    // Assert
    expect(add.mock.calls[0][0].severity).toBe('info');
    expect(add.mock.calls[0][0].detail).toContain('ya era responsable');
    expect(assigned).toEqual([{ created: false, assignment: ASSIGNMENT }]);
  });

  it('onSubmit_DebeDeshabilitarElBotonYNoDuplicarSolicitudesMientrasHayEnvioEnCurso', () => {
    // Arrange
    component.form.setValue({ itemId: ITEM_ID, memberId: ANA.id });

    // Act
    component.onSubmit();
    component.onSubmit();

    // Assert
    expect(component.isSubmitting()).toBe(true);
    http.expectOne(ASSIGN_URL).flush(ASSIGNMENT, { status: 201, statusText: 'Created' });
    expect(component.isSubmitting()).toBe(false);
  });

  it('onSubmit_SinElemento_DebeMostrarErrorEnLineaSinEnviarSolicitud', () => {
    // Act
    component.form.setValue({ itemId: null, memberId: ANA.id });
    component.onSubmit();

    // Assert
    expect(component.itemError()).toBe('El elemento es obligatorio.');
    expect(component.banner()?.severity).toBe('error');
    http.expectNone((request) => request.method === 'POST');
  });

  it('onSubmit_SinMiembro_DebeEnviarMemberIdVacioAlServidorSinValidarEnElCliente', () => {
    // Act
    const req = submit(ITEM_ID, null);
    req.flush({ errors: { memberId: ['El identificador del miembro es obligatorio.'] } }, { status: 400, statusText: 'Bad Request' });

    // Assert
    expect(req.request.body).toEqual({ memberId: '' });
    expect(component.memberError()).toBe('El identificador del miembro es obligatorio.');
    expect(component.itemError()).toBeNull();
    expect(component.visible()).toBe(true);
    expect(component.form.getRawValue().itemId).toBe(ITEM_ID);
  });

  it('onSubmit_Con400PorItemId_DebeMostrarElMensajeEnElCampoYMantenerElDialogo', () => {
    // Act
    submit().flush(
      { errors: { itemId: ['El identificador del elemento no tiene un formato válido.'] } },
      { status: 400, statusText: 'Bad Request' },
    );

    // Assert
    expect(component.itemError()).toBe('El identificador del elemento no tiene un formato válido.');
    expect(component.memberError()).toBeNull();
    expect(component.visible()).toBe(true);
    expect(assigned).toEqual([]);
  });

  it('onSubmit_Con404DeMiembro_DebeVaciarElMiembroConservarElElementoYRecargarMiembros', () => {
    // Act
    submit().flush({ detail: 'El miembro indicado no existe.' }, { status: 404, statusText: 'Not Found' });

    // Assert
    expect(component.visible()).toBe(true);
    expect(component.form.getRawValue()).toEqual({ itemId: ITEM_ID, memberId: null });
    expect(component.memberError()).toContain('miembro seleccionado no existe');
    http.expectOne('/api/team-members').flush([LUIS]);
    expect(component.membersState().options).toEqual([LUIS]);
  });

  it('onSubmit_Con404DeElemento_DebeVaciarElElementoConservarElMiembroYRecargarElementos', () => {
    // Act
    submit().flush({ detail: 'El elemento indicado no existe.' }, { status: 404, statusText: 'Not Found' });

    // Assert
    expect(component.visible()).toBe(true);
    expect(component.form.getRawValue()).toEqual({ itemId: null, memberId: ANA.id });
    expect(component.itemError()).toContain('elemento seleccionado no existe');
    http.expectOne('/api/backlog-items').flush([]);
  });

  it('onSubmit_Con500_DebeMostrarMensajeGenericoSinElCuerpoConservarCamposYOfrecerReintentar', () => {
    // Act
    submit().flush({ detail: 'System.Exception: stack trace interno' }, { status: 500, statusText: 'Server Error' });

    // Assert
    expect(component.visible()).toBe(true);
    expect(component.failed()).toBe(true);
    expect(component.banner()?.message).toContain('No se guardó ningún cambio');
    expect(component.banner()?.message).not.toContain('stack trace');
    expect(component.form.getRawValue()).toEqual({ itemId: ITEM_ID, memberId: ANA.id });
    expect(component.isSubmitting()).toBe(false);
    expect(assigned).toEqual([]);
  });

  it('onSubmit_Con401_DebeCerrarElDialogoYEmitirNoAutorizado', () => {
    // Act
    submit().flush(null, { status: 401, statusText: 'Unauthorized' });

    // Assert
    expect(component.visible()).toBe(false);
    expect(unauthorized).toBe(1);
    expect(assigned).toEqual([]);
  });

  it('resetState_DebeConservarElElementoPrecargadoYLimpiarErroresPrevios', () => {
    // Arrange
    component.itemError.set('error previo');

    // Act
    component.resetState();

    // Assert
    expect(component.itemError()).toBeNull();
    expect(component.form.getRawValue()).toEqual({ itemId: null, memberId: null });
  });

  it('onCancel_DebeCerrarElDialogoSinEnviarNada', () => {
    // Act
    component.onCancel();

    // Assert
    expect(component.visible()).toBe(false);
  });
});
