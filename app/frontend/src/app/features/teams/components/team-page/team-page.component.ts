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
import { ItemAssigneesViewComponent } from '../item-assignees-view/item-assignees-view.component';
import { MemberItemsViewComponent } from '../member-items-view/member-items-view.component';
import { RegisterMemberDialogComponent } from '../register-member-dialog/register-member-dialog.component';

export type TeamTab = 'miembros' | 'roles' | 'responsables';

/** Vista de la pestaña Responsables (HU-015): por elemento o por miembro. */
export type ResponsablesView = 'elemento' | 'miembro';

export type TeamPageState =
  | { status: 'loading' }
  | { status: 'members'; members: TeamMember[] }
  | { status: 'roles'; roles: TechnicalRole[] }
  | { status: 'idle' }
  | { status: 'unauthorized' }
  | { status: 'error' };

const MEMBERS_SUCCESS_SUMMARY = 'Miembro registrado.';

/** Página `/equipos` (HU-012 estados 1 a 3 y 5 a 6; HU-015 pestaña Responsables): pestañas, grilla, diálogo de registro y vistas de responsables. */
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
    ItemAssigneesViewComponent,
    MemberItemsViewComponent,
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

  /** Pestaña activa derivada de la URL: `equipos` (miembros), `equipos/roles` o `equipos/responsables[/miembro]`. */
  readonly tab = toSignal(this.route.data.pipe(map((data): TeamTab => this.toTab(data['tab']))), {
    initialValue: 'miembros' as TeamTab,
  });

  /** Vista de la pestaña Responsables: `equipos/responsables/miembro` es `Por miembro`. */
  readonly view = toSignal(
    this.route.data.pipe(map((data): ResponsablesView => (data['view'] === 'miembro' ? 'miembro' : 'elemento'))),
    { initialValue: 'elemento' as ResponsablesView },
  );

  /** Consulta fresca al servidor en cada creación del componente, cada cambio de pestaña y cada reintento. */
  readonly state = toSignal(
    combineLatest([this.route.data, this.reload$]).pipe(
      switchMap(([data]) => {
        const tab = this.toTab(data['tab']);
        if (tab === 'responsables') return of<TeamPageState>({ status: 'idle' });
        return tab === 'roles' ? this.loadRoles() : this.loadMembers();
      }),
    ),
    { initialValue: { status: 'loading' } as TeamPageState },
  );

  readonly dialogVisible = signal(false);
  readonly sessionExpired = signal(false);

  readonly home: MenuItem = { label: 'Inicio' };
  readonly breadcrumbItems = computed<MenuItem[]>(() => {
    switch (this.tab()) {
      case 'roles':
        return [{ label: 'Equipos y Roles' }, { label: 'Roles técnicos' }];
      case 'responsables':
        return [
          { label: 'Equipos y Roles' },
          { label: 'Responsables' },
          { label: this.view() === 'miembro' ? 'Por miembro' : 'Por elemento' },
        ];
      default:
        return [{ label: 'Equipos y Roles' }, { label: 'Miembros' }];
    }
  });

  readonly title = computed(() => (this.tab() === 'responsables' ? 'RESPONSABLES DE ELEMENTOS' : 'MIEMBROS DEL EQUIPO'));
  readonly subtitle = computed(() =>
    this.tab() === 'responsables'
      ? 'Personas y roles técnicos relacionados con el trabajo.'
      : 'Personas del equipo técnico y su rol.',
  );

  selectTab(tab: TeamTab): void {
    const urls: Record<TeamTab, string> = {
      miembros: '/equipos',
      roles: '/equipos/roles',
      responsables: '/equipos/responsables',
    };
    void this.router.navigateByUrl(urls[tab]);
  }

  selectView(view: ResponsablesView): void {
    void this.router.navigateByUrl(view === 'miembro' ? '/equipos/responsables/miembro' : '/equipos/responsables');
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

  private toTab(value: unknown): TeamTab {
    return value === 'roles' || value === 'responsables' ? value : 'miembros';
  }

  private loadMembers():Observable<TeamPageState> {
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
