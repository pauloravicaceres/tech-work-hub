import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { RegisterMemberDialogComponent } from './register-member-dialog.component';
import { TeamMember, TechnicalRole } from '../../models/team.models';

const ROLES: TechnicalRole[] = [
  { id: '11111111-0000-4000-8000-000000000001', name: 'Desarrollo' },
  { id: '11111111-0000-4000-8000-000000000002', name: 'QA' },
];
const MEMBER: TeamMember = { id: '5d2e71aa-0000-4000-8000-00000000c013', name: 'Ana Torres', role: 'Desarrollo' };
const MEMBERS_URL = '/api/team-members';
const ROLES_URL = '/api/technical-roles';

// HU-012 — diálogo de registro: catálogo, envío, cierre, errores del servidor y ausencia de validación de negocio en el cliente.
describe('RegisterMemberDialogComponent', () => {
  let http: HttpTestingController;
  let component: RegisterMemberDialogComponent;
  let registered: TeamMember[];
  let unauthorized: number;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RegisterMemberDialogComponent],
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(RegisterMemberDialogComponent);
    fixture.componentRef.setInput('visible', true);
    component = fixture.componentInstance;
    registered = [];
    unauthorized = 0;
    component.registered.subscribe((member) => registered.push(member));
    component.unauthorized.subscribe(() => unauthorized++);
    fixture.detectChanges();
    http.expectOne(ROLES_URL).flush(ROLES);
  });

  afterEach(() => http.verify());

  const submit = (name = 'Ana Torres', role: string | null = 'Desarrollo') => {
    component.form.setValue({ name, role });
    component.onSubmit();
    return http.expectOne(MEMBERS_URL);
  };

  it('rolesState_DebeAlimentarseDeListRoles', () => {
    // Assert
    expect(component.rolesState()).toEqual({ loading: false, roles: ROLES });
  });

  it('onSubmit_Con201_DebeEnviarNombreYRolCerrarElDialogoYEmitirElMiembro', () => {
    // Arrange / Act
    const req = submit();
    req.flush(MEMBER, { status: 201, statusText: 'Created' });

    // Assert
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Ana Torres', role: 'Desarrollo' });
    expect(component.visible()).toBe(false);
    expect(registered).toEqual([MEMBER]);
  });

  it('onSubmit_DebeDeshabilitarElBotonMientrasHayEnvioEnCursoYNoDuplicarSolicitudes', () => {
    // Arrange
    component.form.setValue({ name: 'Ana Torres', role: 'Desarrollo' });

    // Act
    component.onSubmit();
    component.onSubmit();

    // Assert
    expect(component.isSubmitting()).toBe(true);
    http.expectOne(MEMBERS_URL).flush(MEMBER, { status: 201, statusText: 'Created' });
    expect(component.isSubmitting()).toBe(false);
  });

  it('onSubmit_ConCamposVacios_DebeEnviarAlServidorSinValidarEnElCliente', () => {
    // Arrange / Act
    const req = submit('   ', null);
    req.flush(
      { errors: { name: ['El nombre es obligatorio.'], role: ['El rol es obligatorio.'] } },
      { status: 400, statusText: 'Bad Request' },
    );

    // Assert
    expect(req.request.body).toEqual({ name: '   ', role: '' });
  });

  it('onSubmit_Con400PorCampos_DebeMantenerElDialogoConservarValoresYMostrarElMensajeDelServidor', () => {
    // Arrange / Act
    submit('', 'QA').flush(
      { errors: { name: ['El nombre es obligatorio.'] } },
      { status: 400, statusText: 'Bad Request' },
    );

    // Assert
    expect(component.visible()).toBe(true);
    expect(component.form.getRawValue()).toEqual({ name: '', role: 'QA' });
    expect(component.nameError()).toBe('El nombre es obligatorio.');
    expect(component.roleError()).toBeNull();
    expect(component.banner()?.severity).toBe('error');
    expect(component.isSubmitting()).toBe(false);
    expect(registered).toEqual([]);
  });

  it('onSubmit_Con400PorRolInvalido_DebeMostrarElDetalleConservarValoresYRefrescarElCatalogo', () => {
    // Arrange / Act
    submit('Ana Torres', 'Chef').flush(
      { detail: 'El rol indicado no es válido.' },
      { status: 400, statusText: 'Bad Request' },
    );

    // Assert
    expect(component.visible()).toBe(true);
    expect(component.form.getRawValue()).toEqual({ name: 'Ana Torres', role: 'Chef' });
    expect(component.banner()?.message).toContain('El rol indicado no es válido.');
    expect(component.roleError()).not.toBeNull();
    http.expectOne(ROLES_URL).flush(ROLES);
  });

  it('onSubmit_Con500_DebeMostrarMensajeGenericoSinExponerElCuerpoYRehabilitarElBoton', () => {
    // Arrange / Act
    submit().flush({ detail: 'System.Exception: stack trace interno' }, { status: 500, statusText: 'Server Error' });

    // Assert
    expect(component.visible()).toBe(true);
    expect(component.form.getRawValue()).toEqual({ name: 'Ana Torres', role: 'Desarrollo' });
    expect(component.banner()?.message).toContain('No fue posible registrar al miembro');
    expect(component.banner()?.message).not.toContain('stack trace');
    expect(component.isSubmitting()).toBe(false);
    expect(registered).toEqual([]);
  });

  it('onSubmit_Con401_DebeCerrarElDialogoYEmitirNoAutorizadoSinCierreSilencioso', () => {
    // Arrange / Act
    submit().flush(null, { status: 401, statusText: 'Unauthorized' });

    // Assert
    expect(component.visible()).toBe(false);
    expect(unauthorized).toBe(1);
    expect(registered).toEqual([]);
  });

  it('onCancel_DebeCerrarElDialogoSinEnviarNada', () => {
    // Act
    component.onCancel();

    // Assert
    expect(component.visible()).toBe(false);
  });
});
