import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { INTERNAL_ROUTES } from 'src/app/data/constants';
import { AuthService } from 'src/app/data/services/auth.service';
import { map, take } from 'rxjs';

export const routerInjection = () => inject(Router);
// export const authStateObs = () => inject(AuthService).getUser;
// export const authStateObs$ = () => inject(AuthService).authState$;

export const noAuthGuard: CanActivateFn = (route, state) => {
  const router = routerInjection();
  
  router.navigate(['/login']);
  return true;
  // return authStateObs$().pipe(
  //   map( ( user: any ) => {
  //     console.log('currentUser', user);
  //     if ( user === null ) {
  //       router.navigate(['/login']);
  //       return false;
  //     }
  //     else{
  //       return true;
  //     }
  //   } ),
  //   take(1)
  // );

  // console.log('authStateObs$', authStateObs$)
  // if ( authStateObs$ !== null ) {
    
  // console.log('xxxxxx$')
  //   router.navigateByUrl( INTERNAL_ROUTES.PANEL_HOME );
  //   return false;
  // }
  // else{
  //   return true;
  // }
  
};
