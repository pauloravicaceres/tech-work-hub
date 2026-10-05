import { Component, EventEmitter, Output } from '@angular/core';
import { REGISTER_PAGE } from '@data/constants';
import { LayoutService } from '@layout/services/layout.service';

@Component({
  selector: 'app-register, [app-register]',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {

  @Output() get_into_emitter = new EventEmitter<boolean>();
  public registerForm;
  public send = false;
  public message: string = '';

  constructor( public layoutService: LayoutService ) {
    this.registerForm = REGISTER_PAGE.FORM;
  }

  goToEnterForm() {
    this.get_into_emitter.emit(true);
  }


  
  create() {
    this.send = true;
  }


}
