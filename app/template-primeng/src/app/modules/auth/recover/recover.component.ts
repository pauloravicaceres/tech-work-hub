import { Component, EventEmitter, Output } from '@angular/core';
import { NEW_PASSWORD_PAGE, RECOVER_PAGE } from '@data/constants';
import { LayoutService } from '@layout/services/layout.service';

type forms = 'email' | 'code' | 'password';

@Component({
  selector: 'app-recover, [app-recover]',
  templateUrl: './recover.component.html',
  styleUrls: ['./recover.component.scss']
})
export class RecoverComponent {
  @Output() get_into_emitter = new EventEmitter<boolean>();
  @Output() send_code_emitter = new EventEmitter<boolean>();
  public formActive: forms = 'email';
  public recoverForm;
  public passwordForm;
  public send = false;
  public code = '';
  public validating = false;
  public creating = false;

  constructor( public layoutService: LayoutService ) {
    this.recoverForm = RECOVER_PAGE.FORM;
    this.passwordForm = NEW_PASSWORD_PAGE.FORM;
  }
  goToEnterForm(){
    this.recoverForm.email.val = '';
    this.get_into_emitter.emit(true);
  }

  sendCode(){
    this.send = true;

    if (this.recoverForm.email.isValid()) {
      this.send_code_emitter.emit(true);

      setTimeout(() => {
        this.send_code_emitter.emit(false);
      }, 2000);
    }
  }

  validateCode(){
    this.validating = true;
  }
  

  updatePassword(){
    this.creating = true;    
  }

}
