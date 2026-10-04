import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';

import { AuthService } from '../../../../core/auth/auth.service';
import { Sprint } from '../../models/sprint.models';
import { SprintApiService } from '../../services/sprint-api.service';

export type SprintDetailState =
  | { status: 'loading' }
  | { status: 'ready'; sprint: Sprint }
  | { status: 'notFound' }
  | { status: 'unauthorized' }
  | { status: 'error' };

const toErrorStatus = (httpStatus: number): 'notFound' | 'unauthorized' | 'error' => {
  if (httpStatus === 404) return 'notFound';
  if (httpStatus === 401) return 'unauthorized';
  return 'error';
};

@Component({
  selector: 'app-sprint-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, CardModule, ButtonModule, MessageModule, DialogModule],
  templateUrl: './sprint-detail.component.html',
  styleUrls: ['./sprint-detail.component.scss'],
})
export class SprintDetailComponent {
  private readonly api = inject(SprintApiService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly state = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get('id') ?? ''),
      switchMap((id) =>
        this.api.getById(id).pipe(
          map((sprint): SprintDetailState => ({ status: 'ready', sprint })),
          catchError((error: HttpErrorResponse) => of<SprintDetailState>({ status: toErrorStatus(error.status) })),
          startWith<SprintDetailState>({ status: 'loading' }),
        ),
      ),
    ),
    { initialValue: { status: 'loading' } as SprintDetailState },
  );

  reauthenticate(): void {
    void this.auth.reauthenticate();
  }
}
