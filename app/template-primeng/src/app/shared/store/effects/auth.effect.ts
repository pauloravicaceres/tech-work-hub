import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { mergeMap, map, catchError, of, tap } from 'rxjs';
import { setUser, setUserError, setUserSuccess } from '../actions';
import { AuthService } from '@data/services/auth.service';

@Injectable()
export class AuthEffect {

    constructor( private actions$: Actions,
        private authService: AuthService ) {
    }

    setUser$ = createEffect(
        () => this.actions$.pipe(
            ofType( setUser ),
            mergeMap(
                ( action ) => this.authService.login( action.user )
                .pipe(
                    map( user => setUserSuccess( { user: user } ) ),
                    catchError( err => of( setUserError( { payload: err } ) ) )
                )
            )
        )
    );
}
