import { Injectable } from '@angular/core';
import { IApiAuthResponse, IApiAuthRequest } from '../interfaces';
import { Router } from '@angular/router';
import { INTERNAL_ROUTES } from '../constants';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { User } from '@data/models';
import { State, Store } from '@ngrx/store';
import { AppState } from '@shared/store/app.reducers';
import { environment as ENV } from "@env/environment";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // public currentUser: User | null;
  private url: string = 'https://reqres.in/api';
  public readonly authState$: Observable<User | null>;
  private user$: BehaviorSubject<User> = new BehaviorSubject<User>( { user_name: '', user_password: '' });
  
  constructor( private router: Router,
    private http: HttpClient,
    private store: Store<AppState> ) {
      this.authState$ = new BehaviorSubject(
        JSON.parse( localStorage.getItem( ENV.ls_access_token )! )
      ).asObservable();
    // this.currentUser = {
    //   user_id: 5,
    //   profile_id: 6,
    //   profile_name: 'Admin',
    //   user_name: 'paulo',
    //   person_name: 'Paulo César Ravichahua Cáceres',
    //   person_last_name: 'Ravichahua Cáceres',
    //   person_first_name: 'Paulo César',
    //   email: 'paulocaceres17@gmail.com',
    //   cell_phone: '940079680',
    // };
  }


  // get getUser(): User {
  //   return this.currentUser.value!;
  // }

  login ( data: User ): Observable<User> {
    return this.http.get(`${this.url}/users/5`)
    .pipe(
      map( (resp: any) => new User(data.user_name, data.user_password, '5', '1', 'admin', 'Paulo César', 'Ravichahua Cáceres', 'Asoc. San Juan Mz A Lt 13', 'paulocaceres17@gmail.com') )
    );
  }

  logout() {
    this.router.navigateByUrl(INTERNAL_ROUTES.AUTH_LOGIN);
  }

  
  set(user: User): Observable<User> {
    this.user$.next(user);
    return this.user$.asObservable();
  }

  setUserLocalStorage( user: User ) {
    localStorage.setItem( ENV.ls_access_token, JSON.stringify( user ) );
  }

}
