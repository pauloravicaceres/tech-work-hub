import { Injectable, inject, signal } from '@angular/core';
import { KEYCLOAK } from './auth.config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly keycloak = inject(KEYCLOAK);

  readonly isAuthenticated = signal(false);

  private readonly _userName = signal<string | null>(null);
  /** Nombre del perfil autenticado (`name` ⇒ `preferred_username` ⇒ `null`). */
  readonly userName = this._userName.asReadonly();

  /** Inicializa Keycloak con Authorization Code + PKCE (S256) y restaura la sesión si existe. */
  async init(): Promise<void> {
    const authenticated = await this.keycloak.init({
      onLoad: 'check-sso',
      pkceMethod: 'S256',
      checkLoginIframe: false,
    });
    this.isAuthenticated.set(authenticated);
    const profile = this.keycloak.tokenParsed;
    this._userName.set(profile?.['name'] || profile?.['preferred_username'] || null);
  }

  get token(): string | undefined {
    return this.keycloak.token;
  }

  /** Redirige al login de Keycloak y regresa a la ruta indicada. */
  login(redirectUri: string = window.location.href): Promise<void> {
    return this.keycloak.login({ redirectUri });
  }

  /** Reautenticación ante 401: descarta la sesión local y vuelve a iniciar el flujo de login. */
  reauthenticate(): Promise<void> {
    this.isAuthenticated.set(false);
    return this.login();
  }

  /** Fuerza la renovación del token; falla si el refresh token expiró. */
  async refreshToken(): Promise<string> {
    await this.keycloak.updateToken(-1);
    const token = this.keycloak.token;
    if (!token) throw new Error('Keycloak no devolvió un token tras la renovación.');
    return token;
  }

  /** Cierra la sesión en Keycloak y regresa al origen de la aplicación. */
  logout(): Promise<void> {
    return this.keycloak.logout({ redirectUri: window.location.origin });
  }
}
