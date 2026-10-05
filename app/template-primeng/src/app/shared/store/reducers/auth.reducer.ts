import { createReducer, on } from '@ngrx/store';
import { setMenu, setUser, setUserError, setUserSuccess, unSetUser } from '../actions';
import { Menu, User } from '@data/models';
import { IApiAuthRequest, IApiAuthResponse } from '@data/interfaces';

export interface State {
    user: User | null,
    menu: Menu | null,
    loading: boolean,
    response: boolean,
    error: any
}

export const initialState: State = {
    user: null,
    menu: null,
    loading: false,
    response: false,
    error: null
};

export const authReducer = createReducer(
    initialState,

    on( setUser, ( state, { user } ) => ( {
        ...state,
        loading: true,
        user: user
    } ) ),

    on( setUserSuccess, ( state, { user } ) => ( {
            ...state, 
            user: { ...user },
            loading: false,
            response: true,
        } )
    ),

    on( setUserError, ( state, { payload } ) => ( { 
            ...state,
            loading: false,
            response: false,
            error: {
                url: payload.url,
                name: payload.name,
                message: payload.message
            }
        } )
    ),

    on( setMenu, ( state, { menu } ) => ( { ...state, menu: { ...menu } } ) ),
    on( unSetUser, state => ( { ...state, user: null } ) )
);