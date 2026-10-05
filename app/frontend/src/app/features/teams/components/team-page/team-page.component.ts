import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, combineLatest, map, of, startWith, switchMap } from 'rxjs';

import { MenuItem, MessageService } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { ToastModule } from 'primeng/toast';

import { AuthService } from '../../../../core/auth/auth.service';
import { TeamMember, TechnicalRole } from '../../models/team.models';
import { TeamApiService } from '../../services/team-api.service';
import { RegisterMemberDialogComponent } from '../register-member-dialog/register-member-dialog.component';

export type TeamTab = 'miembros' | 'roles';

export type TeamPageState =
  | { status: 'loading' }
  | { status: 'members'; members: TeamMember[] }
  | { status: 'roles'; roles: TechnicalRole[] }
  | { status: 'unauthorized' }
  | { status: 'error' };

const MEMBERS_SUCCESS_SUMMARY = 'Miembro registrado.';

/** Página `/equipos` (HU-012, estados 1 a 3 y 5 a 6): pestañas de solo lectura, grilla y diálogo de registro. */
@Component({
  selector: 'app-team-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BreadcrumbModule,
    TabsModule,
    TableModule,
    ButtonModule,
    MessageModule,
    ToastModule,
    DialogModule,
    RegisterMemberDialogComponent,
  ],
  templateUrl: './team-page.component.html',
  styleUrls: ['./team-page.component.scss'],
})
export class TeamPageComponent {
  private readonly api = inject(TeamApiService);
  private readonly auth = inject(AuthService);
  private readonly messages = inject(MessageService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly reload$ = new BehaviorSubject<void>(undefined);

  /** Pestaña activa derivada de la URL: `equipos` (miembros) o `equipos/roles` (roles técnicos). */
  readonly tab = toSignal(this.route.data.pipe(map((data): TeamTab => (data['tab'] === 'roles' ? 'roles' : 'miembros'))), {
    initialValue: 'miembros' as TeamTab,
  });

  /** Consulta fresca al servidor en cada creación del componente, cada cambio de pestaña y cada reintento. */
  readonly state = toSignal(
    combineLatest([this.route.data, this.reload$]).pipe(
      switchMap(([data]) => (data['tab'] === 'roles' ? this.loadRoles() : this.loadMembers())),
    ),
    { initialValue: { status: 'loading' } as TeamPageState },
  );

  readonly dialogVisible = signal(false);
  readonly sessionExpired = signal(false);

  readonly home: MenuItem = { label: 'Inicio' };
  readonly breadcrumbItems = computed<MenuItem[]>(() => [
    { label: 'Equipos y Roles' },
    { label: this.tab() === 'roles' ? 'Roles técnicos' : 'Miembros' },
  ]);

  selectTab(tab: TeamTab): void {
    void this.router.navigateByUrl(tab === 'roles' ? '/equipos/roles' : '/equipos');
  }

  reload(): void {
    this.reload$.next();
  }

  openDialog(): void {
    this.dialogVisible.set(true);
  }

  onRegistered(member: TeamMember): void {
    this.messages.add({
      severity: 'success',
      summary: MEMBERS_SUCCESS_SUMMARY,
      detail: `Nombre: ${member.name} · Rol: ${member.role} · Id: ${member.id}`,
      life: 5000,
    });
    this.reload();
  }

  onUnauthorized(): void {
    this.sessionExpired.set(true);
  }

  reauthenticate(): void {
    void this.auth.reauthenticate();
  }

  private loadMembers(): Observable<TeamPageState> {
    return this.api.listMembers().pipe(
      map((members): TeamPageState => ({ status: 'members', members })),
      catchError((error: HttpErrorResponse) => this.toErrorState(error)),
      startWith<TeamPageState>({ status: 'loading' }),
    );
  }

  private loadRoles(): Observable<TeamPageState> {
    return this.api.listRoles().pipe(
      map((roles): TeamPageState => ({ status: 'roles', roles })),
      catchError((error: HttpErrorResponse) => this.toErrorState(error)),
      startWith<TeamPageState>({ status: 'loading' }),
    );
  }

  private toErrorState(error: HttpErrorResponse): Observable<TeamPageState> {
    return of<TeamPageState>({ status: error.status === 401 ? 'unauthorized' : 'error' });
  }
}
