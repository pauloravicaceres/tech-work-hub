import { InjectionToken, inject } from '@angular/core';
import Keycloak, { KeycloakConfig } from 'keycloak-js';

/** Parámetros del cliente público de Keycloak (Authorization Code + PKCE, sin secreto). */
export const KEYCLOAK_CONFIG = new InjectionToken<KeycloakConfig>('KEYCLOAK_CONFIG', {
  providedIn: 'root',
  factory: () => ({
    url: 'http://localhost:8080/',
    realm: 'techworkhub',
    clientId: 'techworkhub-web',
  }),
});

/** Instancia de `keycloak-js`; se sustituye por un doble en las pruebas. */
export const KEYCLOAK = new InjectionToken<Keycloak>('KEYCLOAK', {
  providedIn: 'root',
  factory: () => new Keycloak(inject(KEYCLOAK_CONFIG)),
});
