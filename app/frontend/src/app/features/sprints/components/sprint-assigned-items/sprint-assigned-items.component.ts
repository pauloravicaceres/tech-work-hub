import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BehaviorSubject, Observable, catchError, forkJoin, map, of, startWith, switchMap } from 'rxjs';

import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';

import { AuthService } from '../../../../core/auth/auth.service';
import { AssignedItem, Sprint, SprintItem } from '../../models/sprint.models';
import { SprintApiService } from '../../services/sprint-api.service';
import { AssignItemDialogComponent } from '../assign-item-dialog/assign-item-dialog.component';

export type SprintAssignedItemsState =
  | { status: 'loading' }
  | { status: 'ready'; sprint: Sprint; items: SprintItem[] }
  | { status: 'invalidId' }
  | { status: 'notFound' }
  | { status: 'unauthorized' }
  | { status: 'error' };

const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

const toErrorStatus = (httpStatus: number): 'notFound' | 'unauthorized' | 'error' => {
  if (httpStatus === 404) return 'notFound';
  if (httpStatus === 401) return 'unauthorized';
  return 'error';
};

/** Vista "Elementos asignados" de un Sprint (HU-004): grilla de solo lectura y diálogo de asignación. */
@Component({
  selector: 'app-sprint-assigned-items',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    DatePipe,
    TableModule,
    ButtonModule,
    MessageModule,
    ToastModule,
    DialogModule,
    AssignItemDialogComponent,
  ],
  templateUrl: './sprint-assigned-items.component.html',
  styleUrls: ['./sprint-assigned-items.component.scss'],
})
export class SprintAssignedItemsComponent {
  private readonly api = inject(SprintApiService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly messageService = inject(MessageService);
  /** `true` muestra el estado de carga; `false` refresca la grilla sin parpadeo tras una asignación. */
  private readonly reload$ = new BehaviorSubject<boolean>(true);

  /** Cada emisión consulta al servidor: lo visible coincide siempre con lo persistido (sin UI optimista). */
  readonly state = toSignal(
    this.route.paramMap.pipe(
      switchMap((params) => {
        const id = params.get('id') ?? '';
        return this.reload$.pipe(switchMap((showLoading) => this.load(id, showLoading)));
      }),
    ),
    { initialValue: { status: 'loading' } as SprintAssignedItemsState },
  );

  readonly dialogVisible = signal(false);
  readonly sessionExpired = signal(false);
  readonly showSessionDialog = computed(() => this.sessionExpired() || this.state().status === 'unauthorized');

  openDialog(): void {
    this.dialogVisible.set(true);
  }

  reload(): void {
    this.reload$.next(true);
  }

  onAssigned(assigned: AssignedItem): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Elemento asignado',
      detail: `Sprint: ${assigned.sprintId} · Elemento: ${assigned.itemId}`,
      life: 5000,
    });
    this.reload$.next(false);
  }

  onUnauthorized(): void {
    this.sessionExpired.set(true);
  }

  reauthenticate(): void {
    void this.auth.reauthenticate();
  }

  /** Las estimaciones no informadas llegan como `null` y se muestran como guion; un 0 real se muestra como `0` (FR-018). */
  formatPoints(points: number | null | undefined): string {
    return points === null || points === undefined ? '—' : String(points);
  }

  private load(id: string, showLoading: boolean): Observable<SprintAssignedItemsState> {
    if (!GUID_PATTERN.test(id) || id === EMPTY_GUID) return of<SprintAssignedItemsState>({ status: 'invalidId' });

    const request$ = forkJoin([this.api.getById(id), this.api.listItems(id)]).pipe(
      map(([sprint, items]): SprintAssignedItemsState => ({ status: 'ready', sprint, items })),
      catchError((error: HttpErrorResponse) => of<SprintAssignedItemsState>({ status: toErrorStatus(error.status) })),
    );
    return showLoading ? request$.pipe(startWith<SprintAssignedItemsState>({ status: 'loading' })) : request$;
  }
}
