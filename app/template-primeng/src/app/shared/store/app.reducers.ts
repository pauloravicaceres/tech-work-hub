import { ActionReducerMap } from "@ngrx/store";
import * as auth from "./reducers";


export interface AppState {
    auth: auth.State,
}

export const appReducers: ActionReducerMap<AppState> = {
    auth: auth.authReducer
}