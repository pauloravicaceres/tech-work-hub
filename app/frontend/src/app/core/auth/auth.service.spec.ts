import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { KEYCLOAK } from './auth.config';

// HU-001 — FR-001 / FR-009: login Code + PKCE (S256) y reautenticación ante 401.
describe('AuthService', () => {
  const keycloak = {
    token: 'abc' as string | undefined,
    init: jest.fn(),
    login: jest.fn().mockResolvedValue(undefined),
    updateToken: jest.fn(),
    logout: jest.fn().mockResolvedValue(undefined),
    tokenParsed: undefined as Record<string, unknown> | undefined,
  };
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    keycloak.token = 'abc';
    keycloak.tokenParsed = undefined;
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), { provide: KEYCLOAK, useValue: keycloak }],
    });
    service = TestBed.inject(AuthService);
  });

  it('init_DebeUsarPkceS256YReflejarLaSesion', async () => {
    // Arrange
    keycloak.init.mockResolvedValue(true);

    // Act
    await service.init();

    // Assert
    expect(keycloak.init).toHaveBeenCalledWith(expect.objectContaining({ pkceMethod: 'S256', onLoad: 'check-sso' }));
    expect(service.isAuthenticated()).toBe(true);
  });

  it('reauthenticate_DebeLimpiarSesionLocalYLlamarAlLogin', async () => {
    // Arrange
    keycloak.init.mockResolvedValue(true);
    await service.init();

    // Act
    await service.reauthenticate();

    // Assert
    expect(service.isAuthenticated()).toBe(false);
    expect(keycloak.login).toHaveBeenCalledWith({ redirectUri: window.location.href });
  });

  it('refreshToken_DebeForzarRenovacionYDevolverElNuevoToken', async () => {
    // Arrange
    keycloak.updateToken.mockImplementation(async () => {
      keycloak.token = 'nuevo';
      return true;
    });

    // Act / Assert
    await expect(service.refreshToken()).resolves.toBe('nuevo');
    expect(keycloak.updateToken).toHaveBeenCalledWith(-1);
  });

  it('refreshToken_SiKeycloakFalla_DebeRechazar', async () => {
    // Arrange
    keycloak.updateToken.mockRejectedValue(new Error('expirado'));

    // Act / Assert
    await expect(service.refreshToken()).rejects.toThrow('expirado');
  });

  it.each([
    [{ name: 'Ana Pérez', preferred_username: 'ana' }, 'Ana Pérez'],
    [{ preferred_username: 'ana' }, 'ana'],
    [{ name: '', preferred_username: 'ana' }, 'ana'],
    [{ name: '' }, null],
    [undefined, null],
  ])('userName_TrasInit_%j_Devuelve_%s', async (tokenParsed, esperado) => {
    keycloak.init.mockResolvedValue(true);
    keycloak.tokenParsed = tokenParsed;

    await service.init();

    expect(service.userName()).toBe(esperado);
  });

  it('logout_DebeLlamarAKeycloakConElOrigenComoRedirect', async () => {
    await service.logout();

    expect(keycloak.logout).toHaveBeenCalledWith({ redirectUri: window.location.origin });
  });
});
