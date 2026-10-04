import { Routes } from '@angular/router';
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
  { path: '', pathMatch: 'full', redirectTo: 'backlog/nuevo' },
  { path: '**', redirectTo: 'backlog/nuevo' },
];
