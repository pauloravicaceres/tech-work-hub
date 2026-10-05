import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { MessageService } from 'primeng/api';
import { MemberItemsViewComponent } from './member-items-view.component';
import { MemberItemResponse, TeamMember } from '../../models/team.models';

const ANA: TeamMember = { id: '5d2e71aa-0000-4000-8000-00000000c013', name: 'Ana Torres', role: 'Desarrollo' };
const ITEMS: MemberItemResponse[] = [
  { id: '9c1a0000-0000-4000-8000-000000000101', title: 'Historia 101', type: 'UserStory' },
  { id: '9c1a0000-0000-4000-8000-000000000102', title: 'Bug 102', type: 'Bug' },
];
const ITEMS_URL = `/api/team-members/${ANA.id}/items`;

// HU-015 — vista Por miembro: carga, datos, vacío, error, 401 y recarga tras asignar.
describe('MemberItemsViewComponent', () => {
  let http: HttpTestingController;
  let component: MemberItemsViewComponent;
  let fixture: ReturnType<typeof TestBed.createComponent<MemberItemsViewComponent>>;
  let unauthorized: number;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MemberItemsViewComponent],
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting(), MessageService],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(MemberItemsViewComponent);
    component = fixture.componentInstance;
    unauthorized = 0;
    component.unauthorized.subscribe(() => unauthorized++);
    fixture.detectChanges();
    http.expectOne('/api/team-members').flush([ANA]);
  });

  afterEach(() => http.verify());

  const text = (): string => {
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  };

  it('constructor_DebeCargarElSelectorDeMiembrosYNoConsultarElementosSinSeleccion', () => {
    // Assert
    expect(component.membersState()).toEqual({ loading: false, options: [ANA] });
    expect(component.state().status).toBe('idle');
  });

  it('memberControl_AlSeleccionarUnMiembro_DebeMostrarCargandoYLuegoIdentificadorTituloYTipo', () => {
    // Act
    component.memberControl.setValue(ANA.id);

    // Assert
    expect(component.state().status).toBe('loading');
    http.expectOne(ITEMS_URL).flush(ITEMS);
    const content = text();
    expect(component.state()).toEqual({ status: 'ready', items: ITEMS });
    for (const item of ITEMS) {
      expect(content).toContain(item.id);
      expect(content).toContain(item.title);
      expect(content).toContain(item.type);
    }
  });

  it('render_MiembroSinElementos_DebeMostrarMensajeInformativo', () => {
    // Act
    component.memberControl.setValue(ANA.id);
    http.expectOne(ITEMS_URL).flush([]);

    // Assert
    expect(text()).toContain('Este miembro aún no tiene elementos relacionados.');
  });

  it('render_ConErrorDeLectura_DebeMostrarMensajeGenericoYReintentarConsultaDeNuevo', () => {
    // Arrange
    component.memberControl.setValue(ANA.id);
    http.expectOne(ITEMS_URL).flush({ detail: 'interno' }, { status: 500, statusText: 'Server Error' });

    // Assert
    expect(component.state().status).toBe('error');
    expect(text()).toContain('No fue posible consultar los elementos del miembro.');

    // Act
    component.reload();

    // Assert
    http.expectOne(ITEMS_URL).flush(ITEMS);
    expect(component.state().status).toBe('ready');
  });

  it('state_Con401_DebeEmitirNoAutorizadoSinExponerDatos', () => {
    // Act
    component.memberControl.setValue(ANA.id);
    http.expectOne(ITEMS_URL).flush(null, { status: 401, statusText: 'Unauthorized' });

    // Assert
    expect(unauthorized).toBe(1);
    expect(component.state().status).toBe('idle');
  });

  it('onAssigned_ConElMiembroMostrado_DebeConsultarDeNuevoAlServidor', () => {
    // Arrange
    component.memberControl.setValue(ANA.id);
    http.expectOne(ITEMS_URL).flush([ITEMS[0]]);

    // Act
    component.onAssigned({
      created: true,
      assignment: { itemId: ITEMS[1].id, memberId: ANA.id, memberName: 'Ana Torres', role: 'Desarrollo' },
    });

    // Assert
    http.expectOne(ITEMS_URL).flush(ITEMS);
    expect(component.state()).toEqual({ status: 'ready', items: ITEMS });
  });
});
