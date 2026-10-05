import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PrimeNGConfig } from 'primeng/api';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private currentLanguageSubject = new BehaviorSubject<string>('en');
  currentLanguage$ = this.currentLanguageSubject.asObservable();

  constructor(private translateService: TranslateService,
    private primengConfig: PrimeNGConfig) {}

  setLanguage(language: string) {
    // this.translateService.use(language);
    // this.translateService.currentLang = language;
    // this.translateService.get('primeng').subscribe(res => this.primengConfig.setTranslation(res));
    // this.currentLanguageSubject.next(language);
  }

  getCurrentLanguage(): string {
    return this.currentLanguageSubject.value;
  }
}
