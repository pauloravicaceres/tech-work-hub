import { TranslateService } from '@ngx-translate/core';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { LayoutService } from '../services/layout.service';
import { IApiAuthResponse, IConfirmDialog } from 'src/app/data/interfaces';
import { INFO_APP } from 'src/app/data/constants';
import { AuthService } from 'src/app/data/services/auth.service';
import { ConfirmEventType, ConfirmationService } from 'primeng/api';
import { AppConfirmationService } from '@shared/services/app-confirmation.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html'
})
export class HeaderComponent {
  public profile_label: string = this.translate.instant('generic.profile');
  public go_out_label: string = this.translate.instant('generic.button-go-out');
  public user: IApiAuthResponse = { user_id: 0, profile_id: 0};
  public application_name: string = INFO_APP.APP_NAME;
  confirmDialog: IConfirmDialog = { header: '', message: '', icon: 'pi pi-exclamation-triangle', style: { with: '500px' } }

  @ViewChild('menubutton') menuButton!: ElementRef;

  @ViewChild('topbarmenubutton') topbarMenuButton!: ElementRef;

  @ViewChild('topbarmenu') menu!: ElementRef;

  constructor( public authService: AuthService,
    public layoutService: LayoutService,
    private appConfirmationService: AppConfirmationService,
    public translate: TranslateService ) {
      this.translate.onLangChange.subscribe((event) => {
        this.profile_label = this.translate.instant('generic.profile')
        this.go_out_label = this.translate.instant('generic.button-go-out')
      });
  }

  ngOnInit(): void {
    // this.user = this.authService.getUser;
    this.user.person_name = 'Paulo Ravichahua Cáceres'
    this.user.profile_name = 'Administrador'
  }

  onConfigButtonClick() {
    this.layoutService.showUserSidebar();
  }

  logout() {
    this.confirmDialog.header = this.translate.instant('components.confirmation.header');
    this.confirmDialog.message = this.translate.instant('components.confirmation.message.sign-off');
    this.confirmDialog.onAccept = () => {
      console.log('accept')
      this.authService.logout();
    }
    this.appConfirmationService.openConfirmation(this.confirmDialog);
  }

}
