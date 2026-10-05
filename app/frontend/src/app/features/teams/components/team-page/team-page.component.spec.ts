import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { MessageService } from 'primeng/api';
import { TeamPageComponent } from './team-page.component';
import { TeamMember, TechnicalRole } from '../../models/team.models';

const MEMBERS: TeamMember[] = [
  { id: '5d2e71aa-0000-4000-8000-00000000c013', name: 'Ana Torres', role: 'Desarrollo' },
  { id: '8f9004bc-0000-4000-8000-0000000002e7', name: 'Luis Rojas', role: 'QA' },
];
const ROLES: TechnicalRole[] = [
  { id: '11111111-0000-4000-8000-000000000001', name: 'Desarrollo' },
  { id: '11111111-0000-4000-8000-000000000002', name: 'QA' },
];
const MEMBERS_URL = '/api/team-members';
const ROLES_URL = '/api/technical-roles';

// HU-012 — página /equipos: grilla de miembros, estado vacío, error de lectura con reintento, pestaña de roles y registro.
describe('TeamPageComponent', () => {
  let http: HttpTestingController;
  let data$: BehaviorSubject<Record<string, string>>;
  let messages: MessageService;

  const create = (tab: 'miembros' | 'roles' = 'miembros') => {
    data$.next({ tab });
    const fixture = TestBed.createComponent(TeamPageComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    data$ = new BehaviorSubject<Record<string, string>>({ tab: 'miembros' });
    TestBed.configureTestingModule({
      imports: [TeamPageComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        MessageService,
        { provide: ActivatedRoute, useValue: { data: data$ } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    messages = TestBed.inject(MessageService);
  });

  afterEach(() => http.verify());

  it('constructor_DebeIniciarEnCargandoYConsultarLosMiembros', () => {
    // Act
    const { componentInstance } = create();

    // Assert
    expect(componentInstance.state().status).toBe('loading');
    expect(http.expectOne(MEMBERS_URL).request.method).toBe('GET');
  });

  it('render_ConMiembros_DebeMostrarIdentificadorNombreYRolSinAccionesPorFila', () => {
    // Arrange
    const fixture = create();
    http.expectOne(MEMBERS_URL).flush(MEMBERS);

    // Act
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    // Assert
    expect(fixture.componentInstance.state()).toEqual({ status: 'members', members: MEMBERS });
    for (const member of MEMBERS) {
      expect(text).toContain(member.id);
      expect(text).toContain(member.name);
      expect(text).toContain(member.role);
    }
    expect(text).not.toContain('ACCIONES');
  });

  it('render_SinMiembros_DebeMostrarElEstadoVacio', () => {
    // Arrange
    const fixture = create();
    http.expectOne(MEMBERS_URL).flush([]);

    // Act
    fixture.detectChanges();

    // Assert
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Aún no hay miembros registrados en el equipo.');
  });

  it('render_ConErrorDeLectura_DebeMostrarMensajeGenericoSinElCuerpoYReintentarConsultaDeNuevo', () => {
    // Arrange
    const fixture = create();
    http.expectOne(MEMBERS_URL).flush({ detail: 'stack trace interno' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    // Assert
    expect(fixture.componentInstance.state().status).toBe('error');
    expect(text).toContain('No fue posible consultar los miembros del equipo.');
    expect(text).toContain('Reintentar');
    expect(text).not.toContain('stack trace');

    // Act
    fixture.componentInstance.reload();

    // Assert
    http.expectOne(MEMBERS_URL).flush(MEMBERS);
    expect(fixture.componentInstance.state().status).toBe('members');
  });

  it('state_Con401_DebeMarcarSesionNoValidaSinExponerDatos', () => {
    // Arrange
    const { componentInstance } = create();

    // Act
    http.expectOne(MEMBERS_URL).flush(null, { status: 401, statusText: 'Unauthorized' });

    // Assert
    expect(componentInstance.state().status).toBe('unauthorized');
  });

  it('openDialog_DebeMostrarElDialogoDeRegistroYConsultarElCatalogo', () => {
    // Arrange
    const fixture = create();
    http.expectOne(MEMBERS_URL).flush(MEMBERS);

    // Act
    fixture.componentInstance.openDialog();
    fixture.detectChanges();

    // Assert
    expect(fixture.componentInstance.dialogVisible()).toBe(true);
    http.expectOne(ROLES_URL).flush(ROLES);
  });

  it('onRegistered_DebeMostrarToastConLosDatosDelServidorYConsultarDeNuevoLaLista', () => {
    // Arrange
    const fixture = create();
    http.expectOne(MEMBERS_URL).flush(MEMBERS);
    const add = jest.spyOn(messages, 'add');
    const created: TeamMember = { id: '3b6f0c11-0000-4000-8000-000000000abc', name: 'Eva Soto', role: 'QA' };

    // Act
    fixture.componentInstance.onRegistered(created);

    // Assert
    const toast = add.mock.calls[0][0];
    expect(toast.severity).toBe('success');
    expect(toast.detail).toContain(created.id);
    expect(toast.detail).toContain('Eva Soto');
    expect(toast.detail).toContain('QA');
    http.expectOne(MEMBERS_URL).flush([...MEMBERS, created]);
    expect(fixture.componentInstance.state()).toEqual({ status: 'members', members: [...MEMBERS, created] });
  });

  it('onUnauthorized_DebeMostrarElDialogoDeReautenticacion', () => {
    // Arrange
    const fixture = create();
    http.expectOne(MEMBERS_URL).flush(MEMBERS);

    // Act
    fixture.componentInstance.onUnauthorized();

    // Assert
    expect(fixture.componentInstance.sessionExpired()).toBe(true);
  });

  // Pestaña "Roles técnicos" (estado 3).
  it('render_PestanaRoles_DebeConsultarElCatalogoYMostrarIdentificadorYNombre', () => {
    // Arrange
    const fixture = create('roles');
    http.expectOne(ROLES_URL).flush(ROLES);

    // Act
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    // Assert
    expect(fixture.componentInstance.tab()).toBe('roles');
    expect(fixture.componentInstance.state()).toEqual({ status: 'roles', roles: ROLES });
    expect(fixture.componentInstance.breadcrumbItems().map((item) => item.label)).toEqual(['Equipos y Roles', 'Roles técnicos']);
    for (const role of ROLES) {
      expect(text).toContain(role.id);
      expect(text).toContain(role.name);
    }
    expect(text).not.toContain('Registrar miembro');
  });

  it('render_PestanaRolesConErrorDeLectura_DebeMostrarMensajeGenericoYReintentar', () => {
    // Arrange
    const fixture = create('roles');
    http.expectOne(ROLES_URL).flush({ detail: 'interno' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    // Assert
    expect(fixture.componentInstance.state().status).toBe('error');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No fue posible consultar los roles técnicos.');

    // Act
    fixture.componentInstance.reload();

    // Assert
    http.expectOne(ROLES_URL).flush(ROLES);
    expect(fixture.componentInstance.state().status).toBe('roles');
  });
});
