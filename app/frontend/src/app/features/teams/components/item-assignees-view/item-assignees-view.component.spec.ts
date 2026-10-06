import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ItemAssigneesViewComponent } from './item-assignees-view.component';
import { AssigneeResponse, BacklogItemSummary } from '../../models/team.models';

const ITEM_ID = '9c1a0000-0000-4000-8000-000000000101';
const ITEMS: BacklogItemSummary[] = [{ id: ITEM_ID, title: 'Historia 101', type: 'UserStory' }];
const ASSIGNEES: AssigneeResponse[] = [
  { id: '5d2e71aa-0000-4000-8000-00000000c013', name: 'Ana Torres', role: 'Desarrollo' },
  { id: '8f9004bc-0000-4000-8000-0000000002e7', name: 'Luis Rojas', role: 'QA' },
];
const ASSIGNEES_URL = `/api/backlog-items/${ITEM_ID}/assignees`;

// HU-015 — vista Por elemento: carga, datos, vacío, error, 401 y recarga tras asignar.
describe('ItemAssigneesViewComponent', () => {
  let http: HttpTestingController;
  let component: ItemAssigneesViewComponent;
  let fixture: ReturnType<typeof TestBed.createComponent<ItemAssigneesViewComponent>>;
  let unauthorized: number;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ItemAssigneesViewComponent],
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting(), MessageService],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ItemAssigneesViewComponent);
    component = fixture.componentInstance;
    unauthorized = 0;
    component.unauthorized.subscribe(() => unauthorized++);
    fixture.detectChanges();
    http.expectOne('/api/backlog-items').flush(ITEMS);
  });

  afterEach(() => http.verify());

  const text = (): string => {
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  };

  it('constructor_DebeCargarElSelectorDeElementosYNoConsultarResponsablesSinSeleccion', () => {
    // Assert
    expect(component.itemsState()).toEqual({ loading: false, options: ITEMS });
    expect(component.state().status).toBe('idle');
    expect(text()).toContain('Seleccione un elemento');
  });

  it('itemControl_AlSeleccionarUnElemento_DebeMostrarCargandoYLuegoIdentificadorNombreYRol', () => {
    // Act
    component.itemControl.setValue(ITEM_ID);

    // Assert
    expect(component.state().status).toBe('loading');
    http.expectOne(ASSIGNEES_URL).flush(ASSIGNEES);
    const content = text();
    expect(component.state()).toEqual({ status: 'ready', assignees: ASSIGNEES });
    for (const assignee of ASSIGNEES) {
      expect(content).toContain(assignee.id);
      expect(content).toContain(assignee.name);
      expect(content).toContain(assignee.role);
    }
    expect(content).not.toContain('ACCIONES');
  });

  it('render_ElementoSinResponsables_DebeMostrarMensajeInformativoYMantenerElBotonAsignar', () => {
    // Act
    component.itemControl.setValue(ITEM_ID);
    http.expectOne(ASSIGNEES_URL).flush([]);
    const content = text();

    // Assert
    expect(content).toContain('Este elemento aún no tiene responsables asignados.');
    expect(content).toContain('Asignar responsable');
  });

  it('render_ConErrorDeLectura_DebeMostrarMensajeGenericoYReintentarConsultaDeNuevo', () => {
    // Arrange
    component.itemControl.setValue(ITEM_ID);
    http.expectOne(ASSIGNEES_URL).flush({ detail: 'stack trace interno' }, { status: 500, statusText: 'Server Error' });

    // Assert
    const content = text();
    expect(component.state().status).toBe('error');
    expect(content).toContain('No fue posible consultar los responsables del elemento.');
    expect(content).not.toContain('stack trace');

    // Act
    component.reload();

    // Assert
    http.expectOne(ASSIGNEES_URL).flush(ASSIGNEES);
    expect(component.state().status).toBe('ready');
  });

  it('state_Con401_DebeEmitirNoAutorizadoSinExponerDatos', () => {
    // Act
    component.itemControl.setValue(ITEM_ID);
    http.expectOne(ASSIGNEES_URL).flush(null, { status: 401, statusText: 'Unauthorized' });

    // Assert
    expect(unauthorized).toBe(1);
    expect(component.state().status).toBe('idle');
  });

  it('onAssigned_ConElElementoMostrado_DebeConsultarDeNuevoAlServidorYResaltarLaFilaNueva', () => {
    // Arrange
    component.itemControl.setValue(ITEM_ID);
    http.expectOne(ASSIGNEES_URL).flush([ASSIGNEES[0]]);

    // Act
    component.onAssigned({
      created: true,
      assignment: { itemId: ITEM_ID, memberId: ASSIGNEES[1].id, memberName: 'Luis Rojas', role: 'QA' },
    });

    // Assert
    http.expectOne(ASSIGNEES_URL).flush(ASSIGNEES);
    expect(component.state()).toEqual({ status: 'ready', assignees: ASSIGNEES });
    expect(component.highlightedMemberId()).toBe(ASSIGNEES[1].id);
    fixture.detectChanges();
    const rows = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr'));
    const highlighted = rows.filter((row) => row.classList.contains('p-datatable-row-selected'));
    expect(highlighted).toHaveLength(1);
    expect(highlighted[0].textContent).toContain('Luis Rojas');
    expect(rows.some((row) => row.classList.contains('bg-surface-100'))).toBe(false);
  });

  it('onAssigned_ConOtroElemento_DebeSeleccionarloYConsultarSusResponsables', () => {
    // Act
    component.onAssigned({
      created: false,
      assignment: { itemId: ITEM_ID, memberId: ASSIGNEES[0].id, memberName: 'Ana Torres', role: 'Desarrollo' },
    });

    // Assert
    expect(component.itemControl.value).toBe(ITEM_ID);
    http.expectOne(ASSIGNEES_URL).flush([ASSIGNEES[0]]);
    expect(component.highlightedMemberId()).toBeNull();
  });
});
