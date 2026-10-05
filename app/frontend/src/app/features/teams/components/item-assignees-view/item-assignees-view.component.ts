import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, Observable, catchError, combineLatest, map, of, startWith, switchMap } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { Fluid } from 'primeng/fluid';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';

import { AssigneeResponse, BacklogItemSummary } from '../../models/team.models';
import { TeamApiService } from '../../services/team-api.service';
import { AssignAssigneeDialogComponent, AssignedEvent } from '../assign-assignee-dialog/assign-assignee-dialog.component';

export type ItemAssigneesState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; assignees: AssigneeResponse[] }
  | { status: 'error' };

interface ItemsListState {
  loading: boolean;
  options: BacklogItemSummary[];
}

/** Vista `Por elemento` (HU-015, estados 1, 2, 5, 6 y 7): personas y roles relacionados con un elemento, solo lectura. */
@Component({
  selector: 'app-item-assignees-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    Fluid,
    SelectModule,
    TableModule,
    ButtonModule,
    MessageModule,
    AssignAssigneeDialogComponent,
  ],
  templateUrl: './item-assignees-view.component.html',
  styleUrls: ['./item-assignees-view.component.scss'],
})
export class ItemAssigneesViewComponent {
  private readonly api = inject(TeamApiService);
  private readonly reload$ = new BehaviorSubject<void>(undefined);

  /** Se emite ante un 401: la página muestra el diálogo de reautenticación y descarta los datos. */
  readonly unauthorized = output<void>();

  readonly itemControl = new FormControl<string | null>(null);
  private readonly selectedItemId = toSignal(this.itemControl.valueChanges, { initialValue: null });

  readonly itemsState = toSignal(
    this.api.listBacklogItems().pipe(
      map((options): ItemsListState => ({ loading: false, options })),
      catchError((error: HttpErrorResponse) => {
        this.notifyIfUnauthorized(error);
        return of<ItemsListState>({ loading: false, options: [] });
      }),
      startWith<ItemsListState>({ loading: true, options: [] }),
    ),
    { initialValue: { loading: true, options: [] } as ItemsListState },
  );

  /** Consulta fresca al servidor en cada cambio de elemento y tras cada asignación (sin Optimistic UI). */
  readonly state = toSignal(
    combineLatest([this.itemControl.valueChanges.pipe(startWith(this.itemControl.value)), this.reload$]).pipe(
      switchMap(([itemId]) => (itemId ? this.loadAssignees(itemId) : of<ItemAssigneesState>({ status: 'idle' }))),
    ),
    { initialValue: { status: 'idle' } as ItemAssigneesState },
  );

  readonly dialogVisible = signal(false);
  /** Relación recién creada (201): su fila se resalta mientras se muestre ese elemento. */
  private readonly highlighted = signal<{ itemId: string; memberId: string } | null>(null);
  readonly highlightedMemberId = computed(() => {
    const current = this.highlighted();
    return current !== null && current.itemId === this.selectedItemId() ? current.memberId : null;
  });

  readonly selectedItem = computed(
    () => this.itemsState().options.find((item) => item.id === this.selectedItemId()) ?? null,
  );

  openDialog(): void {
    this.dialogVisible.set(true);
  }

  onAssigned(event: AssignedEvent): void {
    const { itemId, memberId } = event.assignment;
    this.highlighted.set(event.created ? { itemId, memberId } : null);
    if (this.itemControl.value === itemId) {
      this.reload$.next();
      return;
    }
    this.itemControl.setValue(itemId);
  }

  reload(): void {
    this.reload$.next();
  }

  onUnauthorized(): void {
    this.unauthorized.emit();
  }

  private loadAssignees(itemId: string): Observable<ItemAssigneesState> {
    return this.api.listItemAssignees(itemId).pipe(
      map((assignees): ItemAssigneesState => ({ status: 'ready', assignees })),
      catchError((error: HttpErrorResponse) => {
        this.notifyIfUnauthorized(error);
        return of<ItemAssigneesState>({ status: error.status === 401 ? 'idle' : 'error' });
      }),
      startWith<ItemAssigneesState>({ status: 'loading' }),
    );
  }

  private notifyIfUnauthorized(error: HttpErrorResponse): void {
    if (error.status === 401) this.unauthorized.emit();
  }
}
