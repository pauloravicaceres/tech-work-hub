import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OperativeInstructionListComponent } from './operative-instruction-list/operative-instruction-list.component';
import { OperativeInstructionRoutingModule } from './operative-instruction-routing.module';
import { SharedModule } from '@shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';
import { OperativeInstructionDetailComponent } from './operative-instruction-detail/operative-instruction-detail.component';

@NgModule({
  declarations: [
    OperativeInstructionListComponent,
    OperativeInstructionDetailComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    OperativeInstructionRoutingModule,
    TranslateModule.forChild()
  ]
})
export class OperativeInstructionModule { }
