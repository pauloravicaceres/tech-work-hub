import { Component, OnInit } from '@angular/core';
import { LOGIN_PAGE } from '@data/constants';
import { LayoutService } from '@layout/services/layout.service';
import { TranslateService } from '@ngx-translate/core';
import { PrimeNGConfig } from 'primeng/api';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent {

  public STYLE_BACKGROUND = LOGIN_PAGE.STYLE_BACKGROUND;
  public LOGO = LOGIN_PAGE.LOGO;
  public showLogin = true;
  public Recover = false;
  public Register = false;  
  blockedPanel: boolean = false;

  constructor( public layoutService: LayoutService,
    private config: PrimeNGConfig,
    public translateService: TranslateService ) {
  }

  ngOnInit(): void {
    this.translateService.addLangs(['es', 'en']);
    this.translateService.setDefaultLang('es');
    this.translateService.use('es');
    this.config.setTranslation({
        weak: "Bajo",
        medium: "Medio",
        strong: "Alto",
        passwordPrompt: "Ingrese contraseña"
    });
  }

  goToRegisterForm() {
    this.showLogin = false;
    this.Register = true;
    this.Recover = false;
  }

  getInto(msj: any) {
    this.blockedPanel = msj;
  }

  goToRecoverForm() {
    this.showLogin = false;
    this.Register = false;
    this.Recover = true;
  }

  goToEnterForm(){
    this.showLogin = true;
    this.Recover = false;
    this.Register = false;
  }
}