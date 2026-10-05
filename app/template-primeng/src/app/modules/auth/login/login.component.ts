import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { LOGIN_PAGE, NEW_PASSWORD_PAGE } from '@data/constants';
import { IApiAuthRequest } from '@data/interfaces';
import { Menu, User } from '@data/models';
import { AuthService } from '@data/services/auth.service';
import { Store } from '@ngrx/store';
import { setMenu, setUser } from '@shared/store/actions';
import { AppState } from '@shared/store/app.reducers';
import { Subscription } from 'rxjs';

type forms = 'login' | 'password';

@Component({
  selector: 'app-login, [app-login]',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  @Output() recover_key_emitter = new EventEmitter<boolean>();
  @Output() check_in_emitter = new EventEmitter<boolean>();
  @Output() get_into_emitter = new EventEmitter<boolean>();
  userSubs!: Subscription;

  public loginForm;
  public send = false;

  constructor( private authService: AuthService,
    private router: Router,
    private store: Store<AppState> ) {
    this.loginForm = LOGIN_PAGE.FORM;
  }

  ngOnInit(): void {
    this.userSubs = this.store.select('auth').subscribe( ( { user, loading, response } )=> {
      if (user != null)
        if (loading == false && response == true) {
          this.authService.setUserLocalStorage(user);
          this.authService.set(user);
          this.router.navigate( ['/panel/home'] );
        }
    })
  }


  get getIsValidForm() {
    return (this.loginForm.user.isValid() && this.loginForm.password.isValid())
  }

  authenticate() {
    this.send = true;
    if (!this.getIsValidForm) return;

    this.get_into_emitter.emit(true);

    const authRequest: User = {
      user_name: this.loginForm.user.val,
      user_password: this.loginForm.password.val
    }
    
    setTimeout(() => {
      this.store.dispatch( setUser( { user: authRequest } ));
      
      const tempMenu = new Menu('dashboard');
      this.store.dispatch( setMenu( { menu: tempMenu } ));
      this.get_into_emitter.emit(false);
    }, 2000);

  }

  goToCheckInForm() {
    this.check_in_emitter.emit(true);
  }

  goToRecoverPasswordForm(){
    this.recover_key_emitter.emit(true);
  }

  ngOnDestroy(): void {
    this.userSubs.unsubscribe();
  }

}
