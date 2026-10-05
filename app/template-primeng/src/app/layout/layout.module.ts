import { PrimeNgModule } from './../core/prime-ng/prime-ng.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonComponent } from './skeleton/skeleton.component';
import { RightNavComponent } from './right-nav/right-nav.component';
import { LeftNavComponent } from './left-nav/left-nav.component';
import { LeftNavItemComponent } from './left-nav/left-nav-item/left-nav-item.component';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { ContainerComponent } from './container/container.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { HttpClientModule } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { SharedModule } from '@shared/shared.module';
import { ConfirmationService } from 'primeng/api';
import { AppConfigComponent } from './config/app.config.component';
import { TranslateModule } from '@ngx-translate/core';


@NgModule({
  declarations: [
    SkeletonComponent,
    RightNavComponent,
    LeftNavComponent,
    LeftNavItemComponent,
    HeaderComponent,
    FooterComponent,
    ContainerComponent,
    AppConfigComponent
  ],
  imports: [
    CommonModule,
    PrimeNgModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    HttpClientModule,
    TranslateModule.forChild()
  ],
  providers: [ConfirmationService]
})
export class LayoutModule { }
