import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { CreateBacklogItemComponent } from './create-backlog-item.component';
import { TECHNICAL_BACKLOG_ITEM_TYPES } from '../../models/backlog-item.constants';

const GUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const APP_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

// HU-001 — UI: estado reactivo (Signals), reglas de QA N/A y mapeo de errores HTTP (SC-03, SC-05, SC-06, CB-04).
describe('CreateBacklogItemComponent', () => {
  let http: HttpTestingController;
  let component: CreateBacklogItemComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CreateBacklogItemComponent],
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    component = TestBed.createComponent(CreateBacklogItemComponent).componentInstance;
    http.expectOne('/api/applications').flush([{ id: APP_ID, name: 'Tech Gateway' }]);
  });

  afterEach(() => http.verify());

  const fill = (over: Record<string, unknown> = {}) =>
    component.form.patchValue({ title: 'Implementar OIDC', type: 'UserStory', priority: 'High', ...over });

  it('constructor_DebeCargarAplicacionesConGuidRealesDesdeLaApi', () => {
    // Assert
    expect(component.applications()).toEqual([{ label: 'Tech Gateway', value: APP_ID }]);
    expect(component.applications()[0].value).toMatch(GUID_REGEX);
  });

  it('onSubmit_ConTituloVacio_NoDebeEnviarPeticionHttp', () => {
    // Arrange
    fill({ title: '' });

    // Act
    component.onSubmit();

    // Assert
    http.expectNone('/api/backlog/items');
    expect(component.isSubmitting()).toBe(false);
  });

  it('form_ConTituloDe201Caracteres_DebeSerInvalido', () => {
    // Arrange / Act
    fill({ title: 'a'.repeat(201) });

    // Assert
    expect(component.form.controls.title.hasError('maxlength')).toBe(true);
    expect(component.charsCount()).toBe(201);
  });

  it('form_ConDevPointsNegativos_DebeSerInvalido', () => {
    // Arrange / Act
    fill({ devPoints: -3 });

    // Assert
    expect(component.form.controls.devPoints.hasError('min')).toBe(true);
    expect(component.form.invalid).toBe(true);
  });

  it.each([...TECHNICAL_BACKLOG_ITEM_TYPES])(
    'typeChange_ATipoTecnico_%s_DebeDeshabilitarYAnularQaPoints',
    (type) => {
      // Arrange
      fill({ qaPoints: 3 });

      // Act
      component.form.controls.type.setValue(type);

      // Assert
      expect(component.isQaNotApplicable()).toBe(true);
      expect(component.form.controls.qaPoints.disabled).toBe(true);
      expect(component.form.controls.qaPoints.value).toBeNull();
    },
  );

  it('typeChange_DeSpikeABug_DebeRehabilitarQaPoints', () => {
    // Arrange
    component.form.controls.type.setValue('Spike');

    // Act
    component.form.controls.type.setValue('Bug');

    // Assert
    expect(component.isQaNotApplicable()).toBe(false);
    expect(component.form.controls.qaPoints.enabled).toBe(true);
  });

  it.each(['UserStory', 'Bug'] as const)(
    'onSubmit_Con%s_SinEstimacionQa_DebeEnviarQaPointsNuloYNoCero',
    (type) => {
      // Arrange
      fill({ type });

      // Act
      component.onSubmit();
      const req = http.expectOne('/api/backlog/items');
      req.flush({ id: 'c0ffee' }, { status: 201, statusText: 'Created' });

      // Assert
      expect(req.request.body.qaPoints).toBeNull();
    },
  );

  it('onSubmit_ConSpike_DebeEnviarQaPointsNuloEnElPayload', () => {
    // Arrange
    fill({ type: 'Spike', devPoints: 2 });

    // Act
    component.onSubmit();
    const req = http.expectOne('/api/backlog/items');
    req.flush({ id: 'c0ffee' }, { status: 201, statusText: 'Created' });

    // Assert
    expect(req.request.method).toBe('POST');
    expect(req.request.body.qaPoints).toBeNull();
    expect(req.request.body.type).toBe('Spike');
    expect(component.isSubmitting()).toBe(false);
  });

  it('onSubmit_ConRespuesta401_DebeActivarSessionExpired', () => {
    // Arrange
    fill();

    // Act
    component.onSubmit();
    http.expectOne('/api/backlog/items').flush({}, { status: 401, statusText: 'Unauthorized' });

    // Assert
    expect(component.sessionExpired()).toBe(true);
    expect(component.serverError()).toBe(false);
    expect(component.isSubmitting()).toBe(false);
  });

  it('onSubmit_ConRespuesta500_DebeActivarServerErrorSinSessionExpired', () => {
    // Arrange
    fill();

    // Act
    component.onSubmit();
    http.expectOne('/api/backlog/items').flush({}, { status: 500, statusText: 'Server Error' });

    // Assert
    expect(component.serverError()).toBe(true);
    expect(component.sessionExpired()).toBe(false);
  });

  it('onSubmit_ConApplicationIdSeleccionado_DebeEnviarUnGuidValido', () => {
    // Arrange: el backend tipa ApplicationId como Guid? (CreateBacklogItemCommand).
    fill({ applicationId: component.applications()[0].value });

    // Act
    component.onSubmit();
    const req = http.expectOne('/api/backlog/items');
    req.flush({ id: 'x' }, { status: 201, statusText: 'Created' });

    // Assert
    expect(req.request.body.applicationId).toMatch(GUID_REGEX);
  });

  it('onSubmit_ConRespuesta400ConErrors_DebeAsignarMensajePorCampo', () => {
    // Arrange
    fill({ applicationId: APP_ID });

    // Act
    component.onSubmit();
    http.expectOne('/api/backlog/items').flush(
      {
        title: 'One or more validation errors occurred.',
        status: 400,
        errors: {
          ApplicationId: ['The specified Application does not exist.'],
          Title: ['The length of Title must be 200 characters or fewer.'],
        },
      },
      { status: 400, statusText: 'Bad Request' },
    );

    // Assert
    expect(component.fieldErrors().applicationId).toBe('The specified Application does not exist.');
    expect(component.fieldErrors().title).toBe('The length of Title must be 200 characters or fewer.');
    expect(component.form.controls.applicationId.hasError('server')).toBe(true);
    expect(component.isSubmitting()).toBe(false);
  });

  it('onSubmit_ConRespuesta400ConErrorGeneral_NoDebeAsignarErroresDeCampo', () => {
    // Arrange
    fill();

    // Act
    component.onSubmit();
    http
      .expectOne('/api/backlog/items')
      .flush({ errors: { Request: ['JSON malformado'] } }, { status: 400, statusText: 'Bad Request' });

    // Assert
    expect(component.fieldErrors()).toEqual({});
  });

  it('onCancel_DebeRestablecerFormularioYLimpiarErrores', () => {
    // Arrange
    fill({ title: 'Algo', type: 'Spike' });
    component.fieldErrors.set({ title: 'x' });

    // Act
    component.onCancel();

    // Assert
    expect(component.form.controls.title.value).toBe('');
    expect(component.form.controls.type.value).toBe('UserStory');
    expect(component.form.controls.qaPoints.enabled).toBe(true);
    expect(component.fieldErrors()).toEqual({});
  });
});
