import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SkeletonComponent } from './layout/skeleton/skeleton.component';
import { HomeComponent } from './modules/home/home.component';
import { INTERNAL_PATHS } from './data/constants';
import { authGuard } from '@core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('@modules/auth/auth.module').then( (m) => m.AuthModule )
  },
  { 
    path: 'panel', 
    component: SkeletonComponent,
    children: [
      {
        path: INTERNAL_PATHS.PANEL_HOME,
        component: HomeComponent,
        canActivate: [authGuard]
      },
      {
        path: INTERNAL_PATHS.PANEL_PRODUCT_LIST,
        loadChildren: () => import('@modules/product/product.module').then( (m) => m.ProductModule )
      },
      {
        path: INTERNAL_PATHS.PANEL_OPERATIVE_INSTRUCTION_LIST,
        loadChildren: () => import('@modules/operative-instruction/operative-instruction.module').then( (m) => m.OperativeInstructionModule )
      },
      { path: '**', redirectTo: ''}
    ]
  },
  {
    path: '**',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

