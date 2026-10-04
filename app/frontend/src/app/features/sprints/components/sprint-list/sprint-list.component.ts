import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { BehaviorSubject, Observable, catchError, map, of, startWith, switchMap } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';

import { AuthService } from '../../../../core/auth/auth.service';
import { Sprint } from '../../models/sprint.models';
import { SprintApiService } from '../../services/sprint-api.service';

export type SprintListState =
  | { status: 'loading' }
  | { status: 'ready'; sprints: Sprint[] }
  | { status: 'unauthorized' }
  | { status: 'error' };

@Component({
  selector: 'app-sprint-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, TableModule, ButtonModule, MessageModule, ToastModule, TooltipModule, DialogModule],
  templateUrl: './sprint-list.component.html',
  styleUrls: ['./sprint-list.component.scss'],
})
export class SprintListComponent {
  private readonly api = inject(SprintApiService);
  private readonly auth = inject(AuthService);
  private readonly reload$ = new BehaviorSubject<void>(undefined);

  /** Consulta fresca al servidor en cada creación del componente y en cada reintento. */
  readonly state = toSignal(
    this.reload$.pipe(switchMap(() => this.load())),
    { initialValue: { status: 'loading' } as SprintListState },
  );

  reload(): void {
    this.reload$.next();
  }

  reauthenticate(): void {
    void this.auth.reauthenticate();
  }

  private load(): Observable<SprintListState> {
    return this.api.list().pipe(
      map((sprints): SprintListState => ({ status: 'ready', sprints })),
      catchError((error: HttpErrorResponse) =>
        of<SprintListState>({ status: error.status === 401 ? 'unauthorized' : 'error' }),
      ),
      startWith<SprintListState>({ status: 'loading' }),
    );
  }
}
