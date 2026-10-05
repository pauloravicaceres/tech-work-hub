import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { OperativeInstructionListComponent } from './operative-instruction-list/operative-instruction-list.component';

const routes: Routes = [
    {
        path: '',
        component: OperativeInstructionListComponent,
        canActivate: [authGuard]
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class OperativeInstructionRoutingModule { }
