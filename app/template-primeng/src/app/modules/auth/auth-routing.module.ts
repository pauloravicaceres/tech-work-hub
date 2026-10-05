import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { INTERNAL_PATHS } from 'src/app/data/constants';
import { noAuthGuard } from 'src/app/core/guards/no-auth.guard';
import { AuthComponent } from './auth.component';

const routes: Routes = [
  {
    path: INTERNAL_PATHS.AUTH_LOGIN,
    component: AuthComponent,
    // canActivate: [noAuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
