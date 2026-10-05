import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '@core/prime-ng/prime-ng.module';
import { ConfirmationService } from 'primeng/api';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import * as fromComponents from './components';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputCalendarComponent } from './components/inputs/input-calendar/input-calendar.component';

// export function HttpLoaderFactory(http: HttpClient) {
//   return new TranslateHttpLoader(http, './assets/i18n/', '.json');
// }

@NgModule({
  declarations: [
    ...fromComponents.components
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PrimeNgModule,
    FontAwesomeModule,
    TranslateModule.forChild()
  ],
  exports: [
    ...fromComponents.components,
    FontAwesomeModule,
    FormsModule,
    ReactiveFormsModule,
    PrimeNgModule
  ],
  providers: [ConfirmationService]
})
export class SharedModule { }
