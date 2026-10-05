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

import { MemberItemResponse, TeamMember } from '../../models/team.models';
import { TeamApiService } from '../../services/team-api.service';
import { AssignAssigneeDialogComponent, AssignedEvent } from '../assign-assignee-dialog/assign-assignee-dialog.component';

export type MemberItemsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; items: MemberItemResponse[] }
  | { status: 'error' };

interface MembersListState {
  loading: boolean;
  options: TeamMember[];
}

/** Vista `Por miembro` (HU-015, estado 3): elementos relacionados con un miembro, solo lectura. */
@Component({
  selector: 'app-member-items-view',
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
  templateUrl: './member-items-view.component.html',
  styleUrls: ['./member-items-view.component.scss'],
})
export class MemberItemsViewComponent {
  private readonly api = inject(TeamApiService);
  private readonly reload$ = new BehaviorSubject<void>(undefined);

  /** Se emite ante un 401: la página muestra el diálogo de reautenticación y descarta los datos. */
  readonly unauthorized = output<void>();

  readonly memberControl = new FormControl<string | null>(null);
  private readonly selectedMemberId = toSignal(this.memberControl.valueChanges, { initialValue: null });

  readonly membersState = toSignal(
    this.api.listMembers().pipe(
      map((options): MembersListState => ({ loading: false, options })),
      catchError((error: HttpErrorResponse) => {
        this.notifyIfUnauthorized(error);
        return of<MembersListState>({ loading: false, options: [] });
      }),
      startWith<MembersListState>({ loading: true, options: [] }),
    ),
    { initialValue: { loading: true, options: [] } as MembersListState },
  );

  /** Consulta fresca al servidor en cada cambio de miembro y tras cada asignación (sin Optimistic UI). */
  readonly state = toSignal(
    combineLatest([this.memberControl.valueChanges.pipe(startWith(this.memberControl.value)), this.reload$]).pipe(
      switchMap(([memberId]) => (memberId ? this.loadItems(memberId) : of<MemberItemsState>({ status: 'idle' }))),
    ),
    { initialValue: { status: 'idle' } as MemberItemsState },
  );

  readonly dialogVisible = signal(false);

  readonly selectedMember = computed(
    () => this.membersState().options.find((member) => member.id === this.selectedMemberId()) ?? null,
  );

  openDialog(): void {
    this.dialogVisible.set(true);
  }

  /** Tras asignar se consulta de nuevo al servidor; si el miembro asignado es el elegido, su lista se refresca. */
  onAssigned(event: AssignedEvent): void {
    if (this.memberControl.value === event.assignment.memberId) this.reload$.next();
  }

  reload(): void {
    this.reload$.next();
  }

  onUnauthorized(): void {
    this.unauthorized.emit();
  }

  private loadItems(memberId: string): Observable<MemberItemsState> {
    return this.api.listMemberItems(memberId).pipe(
      map((items): MemberItemsState => ({ status: 'ready', items })),
      catchError((error: HttpErrorResponse) => {
        this.notifyIfUnauthorized(error);
        return of<MemberItemsState>({ status: error.status === 401 ? 'idle' : 'error' });
      }),
      startWith<MemberItemsState>({ status: 'loading' }),
    );
  }

  private notifyIfUnauthorized(error: HttpErrorResponse): void {
    if (error.status === 401) this.unauthorized.emit();
  }
}
