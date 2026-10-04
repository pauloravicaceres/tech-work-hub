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
  { path: '', pathMatch: 'full', redirectTo: 'backlog/nuevo' },
  { path: '**', redirectTo: 'backlog/nuevo' },
];
