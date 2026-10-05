import { createAction, props } from '@ngrx/store';
import { Menu, User } from '@data/models';
import { IApiAuthRequest, IApiAuthResponse } from '@data/interfaces';

export const setUser = createAction(
    '[Auth] setUser',
    props<{ user: User}>()
);

export const setUserSuccess = createAction(
    '[Auth] setUserSuccess',
    props<{ user: User}>()
);

export const setUserError = createAction(
    '[Auth] setUserError',
    props<{ payload: any }>()
);

export const unSetUser = createAction( '[Auth] unSetUser' );


export const setMenu = createAction(
    '[Auth] setMenu',
    props<{ menu: Menu}>()
);