import { inject } from '@angular/core';
import { CanActivateFn, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

/** Sin sesión redirige al login de Keycloak (la ruta no se activa ni se renderiza el componente). */
export const authGuard: CanActivateFn = (_route, state: RouterStateSnapshot) => {
  const auth = inject(AuthService);
  if (auth.isAuthenticated()) return true;

  void auth.login(`${window.location.origin}${state.url}`);
  return false;
};
