import { Routes } from '@angular/router';
import { MessageService } from 'primeng/api';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'backlog/nuevo',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/backlog/components/create-backlog-item/create-backlog-item.component').then(
        (m) => m.CreateBacklogItemComponent,
      ),
  },
  {
    // `MessageService` compartido por las tres páginas: el toast de creación se muestra en el listado.
    path: 'sprints',
    canActivate: [authGuard],
    providers: [MessageService],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/sprints/components/sprint-list/sprint-list.component').then((m) => m.SprintListComponent),
      },
      {
        path: 'nuevo',
        loadComponent: () =>
          import('./features/sprints/components/sprint-form/sprint-form.component').then((m) => m.SprintFormComponent),
      },
      {
        // Debe declararse antes de `:id`.
        path: ':id/elementos',
        loadComponent: () =>
          import('./features/sprints/components/sprint-assigned-items/sprint-assigned-items.component').then(
            (m) => m.SprintAssignedItemsComponent,
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./features/sprints/components/sprint-detail/sprint-detail.component').then(
            (m) => m.SprintDetailComponent,
          ),
      },
    ],
  },
  {
    // HU-012: la pestaña activa se deriva de `data.tab`; ambas rutas montan la misma página.
    path: 'equipos',
    canActivate: [authGuard],
    providers: [MessageService],
    children: [
      {
        path: '',
        pathMatch: 'full',
        data: { tab: 'miembros' },
        loadComponent: () =>
          import('./features/teams/components/team-page/team-page.component').then((m) => m.TeamPageComponent),
      },
      {
        path: 'roles',
        data: { tab: 'roles' },
        loadComponent: () =>
          import('./features/teams/components/team-page/team-page.component').then((m) => m.TeamPageComponent),
      },
      {
        // HU-015: pestaña Responsables; `data.view` elige la vista Por elemento (por defecto) o Por miembro.
        path: 'responsables',
        data: { tab: 'responsables', view: 'elemento' },
        loadComponent: () =>
          import('./features/teams/components/team-page/team-page.component').then((m) => m.TeamPageComponent),
      },
      {
        path: 'responsables/miembro',
        data: { tab: 'responsables', view: 'miembro' },
        loadComponent: () =>
          import('./features/teams/components/team-page/team-page.component').then((m) => m.TeamPageComponent),
      },
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: 'backlog/nuevo' },
  { path: '**', redirectTo: 'backlog/nuevo' },
];
