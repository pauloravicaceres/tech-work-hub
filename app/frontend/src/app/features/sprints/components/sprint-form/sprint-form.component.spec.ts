import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { SprintFormComponent } from './sprint-form.component';

const SPRINT = {
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  identification: 'Sprint 2026-01',
  startDate: '2026-10-05',
  endDate: '2026-10-18',
};

// HU-003 — formulario de creación: validación de presencia, errores 400 por campo y estados de envío.
describe('SprintFormComponent', () => {
  let http: HttpTestingController;
  let router: Router;
  let messages: MessageService;
  let component: SprintFormComponent;
  let navigate: jest.SpyInstance;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SprintFormComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        MessageService,
      ],
    });
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    messages = TestBed.inject(MessageService);
    navigate = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    component = TestBed.createComponent(SprintFormComponent).componentInstance;
  });

  afterEach(() => http.verify());

  const fill = (over: Record<string, unknown> = {}) =>
    component.form.patchValue({
      identification: 'Sprint 2026-01',
      startDate: new Date(2026, 9, 5),
      endDate: new Date(2026, 9, 18),
      ...over,
    });

  it('onSubmit_ConIdentificacionVacia_NoDebeEnviarYDebeMostrarBanner', () => {
    // Arrange
    fill({ identification: '' });

    // Act
    component.onSubmit();

    // Assert
    http.expectNone('/api/sprints');
    expect(component.form.controls.identification.hasError('required')).toBe(true);
    expect(component.bannerMessage()).toContain('Revise los campos marcados');
  });

  it('form_ConIdentificacionDe101Caracteres_DebeSerInvalida', () => {
    // Arrange / Act
    fill({ identification: 'a'.repeat(101) });

    // Assert
    expect(component.form.controls.identification.hasError('maxlength')).toBe(true);
  });

  it('form_ConIdentificacionDe100Caracteres_DebeSerValida', () => {
    // Arrange / Act
    fill({ identification: 'a'.repeat(100) });

    // Assert
    expect(component.form.controls.identification.valid).toBe(true);
  });

  it.each(['startDate', 'endDate'] as const)('onSubmit_Sin%s_NoDebeEnviarPeticion', (field) => {
    // Arrange
    fill({ [field]: null });

    // Act
    component.onSubmit();

    // Assert
    http.expectNone('/api/sprints');
    expect(component.form.controls[field].hasError('required')).toBe(true);
  });

  it('onSubmit_ConDatosValidos_DebeEnviarFechasIsoYNoDuplicarMientrasSeEnvia', () => {
    // Arrange
    fill();

    // Act
    component.onSubmit();
    component.onSubmit(); // segundo clic mientras se envía: no debe duplicar la petición
    const req = http.expectOne('/api/sprints');

    // Assert (en vuelo)
    expect(component.isSubmitting()).toBe(true);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      identification: 'Sprint 2026-01',
      startDate: '2026-10-05',
      endDate: '2026-10-18',
    });

    req.flush(SPRINT, { status: 201, statusText: 'Created' });
    expect(component.isSubmitting()).toBe(false);
  });

  it('onSubmit_ConRespuesta201_DebeNavegarAlListadoYEmitirToastDeExito', async () => {
    // Arrange
    const add = jest.spyOn(messages, 'add');
    fill();

    // Act
    component.onSubmit();
    http.expectOne('/api/sprints').flush(SPRINT, { status: 201, statusText: 'Created' });
    await Promise.resolve();
    await Promise.resolve();

    // Assert
    expect(navigate).toHaveBeenCalledWith(['/sprints']);
    expect(add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    expect(add.mock.calls[0][0].detail).toContain(SPRINT.id);
  });

  it('onSubmit_ConRespuesta400DeVentana_DebeMostrarMensajeEnFinYConservarValores', () => {
    // Arrange
    fill({ endDate: new Date(2026, 9, 12) });
    const message = 'El Sprint debe abarcar exactamente una ventana de 2 semanas.';

    // Act
    component.onSubmit();
    http
      .expectOne('/api/sprints')
      .flush({ status: 400, errors: { endDate: [message] } }, { status: 400, statusText: 'Bad Request' });

    // Assert
    expect(component.fieldErrors().endDate).toBe(message);
    expect(component.bannerMessage()).toBe(message);
    expect(component.form.controls.endDate.hasError('server')).toBe(true);
    expect(component.form.controls.identification.value).toBe('Sprint 2026-01');
    expect(component.isSubmitting()).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('onSubmit_ConRespuesta400ConClavesPascalCase_DebeAsignarMensajePorCampo', () => {
    // Arrange
    fill();

    // Act
    component.onSubmit();
    http.expectOne('/api/sprints').flush(
      {
        status: 400,
        errors: {
          Identification: ['La identificación es obligatoria.'],
          StartDate: ['La fecha de inicio no tiene un formato válido.'],
        },
      },
      { status: 400, statusText: 'Bad Request' },
    );

    // Assert
    expect(component.fieldErrors().identification).toBe('La identificación es obligatoria.');
    expect(component.fieldErrors().startDate).toBe('La fecha de inicio no tiene un formato válido.');
    expect(component.bannerMessage()).toContain('Revise los campos marcados');
  });

  it('onSubmit_ConRespuesta401_DebeActivarSessionExpired', () => {
    // Arrange
    fill();

    // Act
    component.onSubmit();
    http.expectOne('/api/sprints').flush({}, { status: 401, statusText: 'Unauthorized' });

    // Assert
    expect(component.sessionExpired()).toBe(true);
    expect(component.serverError()).toBe(false);
  });

  it('onSubmit_ConRespuesta500_DebeMostrarMensajeGenericoYPermitirReintento', () => {
    // Arrange
    fill();

    // Act
    component.onSubmit();
    http.expectOne('/api/sprints').flush({ detail: 'traza interna' }, { status: 500, statusText: 'Server Error' });

    // Assert
    expect(component.serverError()).toBe(true);
    expect(component.bannerMessage()).toContain('No se registró ningún Sprint');
    expect(component.bannerMessage()).not.toContain('traza interna');
    expect(component.isSubmitting()).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('onCancel_DebeNavegarAlListadoSinEnviar', () => {
    // Act
    component.onCancel();

    // Assert
    expect(navigate).toHaveBeenCalledWith(['/sprints']);
    http.expectNone('/api/sprints');
  });
});
