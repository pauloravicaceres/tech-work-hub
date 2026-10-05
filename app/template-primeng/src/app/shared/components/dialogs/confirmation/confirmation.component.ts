import { Component, Input } from '@angular/core';
import { IConfirmDialog } from '@data/interfaces';
import { TranslateService } from '@ngx-translate/core';
import { AppConfirmationService } from '@shared/services/app-confirmation.service';
import { ConfirmationService } from 'primeng/api';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-confirmation',
  templateUrl: './confirmation.component.html',
  styleUrls: ['./confirmation.component.scss']
})
export class ConfirmationComponent {
  confirmationSubs: Subscription;
  confirmDialog: IConfirmDialog = {
    header: '',
    message: '',
    icon: 'pi pi-exclamation-triangle',
    style: { with: 'auto' },
    register: '',
    onAccept: () => {},
    onReject: () => {}
  }

  constructor( public translate: TranslateService,
    private confirmationService: ConfirmationService,
    private appConfirmationService: AppConfirmationService ) {
    this.confirmationSubs = this.appConfirmationService.confirmDialog$.subscribe( ( r: IConfirmDialog ) => {
      if (r != null) {
        this.confirmDialog = r
        this.confirmationService.confirm({
          accept: r.onAccept,
          reject: r.onReject
        });
      }
    })
  }
  
}


