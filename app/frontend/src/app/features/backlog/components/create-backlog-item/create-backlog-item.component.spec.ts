import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { CreateBacklogItemComponent } from './create-backlog-item.component';

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
  });

  afterEach(() => http.verify());

  const fill = (over: Record<string, unknown> = {}) =>
    component.form.patchValue({ title: 'Implementar OIDC', type: 'UserStory', priority: 'High', ...over });

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
    expect(component.form.get('title')?.hasError('maxlength')).toBe(true);
    expect(component.charsCount()).toBe(201);
  });

  it('form_ConDevPointsNegativos_DebeSerInvalido', () => {
    // Arrange / Act
    fill({ devPoints: -3 });

    // Assert
    expect(component.form.get('devPoints')?.hasError('min')).toBe(true);
    expect(component.form.invalid).toBe(true);
  });

  it.each(['Spike', 'Research', 'TechDebt', 'TechEvolution', 'TechRequirement'])(
    'typeChange_ATipoTecnico_%s_DebeDeshabilitarYAnularQaPoints',
    (type) => {
      // Arrange
      fill({ qaPoints: 3 });

      // Act
      component.form.get('type')?.setValue(type);

      // Assert
      expect(component.isQaNotApplicable()).toBe(true);
      expect(component.form.get('qaPoints')?.disabled).toBe(true);
      expect(component.form.get('qaPoints')?.value).toBeNull();
    },
  );

  it('typeChange_DeSpikeABug_DebeRehabilitarQaPoints', () => {
    // Arrange
    component.form.get('type')?.setValue('Spike');

    // Act
    component.form.get('type')?.setValue('Bug');

    // Assert
    expect(component.isQaNotApplicable()).toBe(false);
    expect(component.form.get('qaPoints')?.enabled).toBe(true);
  });

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
    const guid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    fill({ applicationId: component.applications[0].value });

    // Act
    component.onSubmit();
    const req = http.expectOne('/api/backlog/items');
    req.flush({ id: 'x' }, { status: 201, statusText: 'Created' });

    // Assert
    expect(req.request.body.applicationId).toMatch(guid);
  });

  it('onSubmit_ConRespuesta400DeAplicacionInexistente_DebeMarcarInvalidAppEnElControl', () => {
    // Arrange
    fill();

    // Act
    component.onSubmit();
    http
      .expectOne('/api/backlog/items')
      .flush({ message: 'La aplicación no existe' }, { status: 400, statusText: 'Bad Request' });

    // Assert
    expect(component.form.get('applicationId')?.hasError('invalidApp')).toBe(true);
  });
});
