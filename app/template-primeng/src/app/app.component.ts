import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PrimeNGConfig } from 'primeng/api';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  // currentLanguage: string;
  constructor(private primengConfig: PrimeNGConfig,
    public translate: TranslateService) {
    this.primengConfig.ripple = true;
    document.documentElement.style.fontSize = '13px';
  }

  ngOnInit() {
      // this.translate.setDefaultLang('es');
      // this.translate.use('es');
  }
}
