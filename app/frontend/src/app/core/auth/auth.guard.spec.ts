import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

// HU-001 — FR-001: sin sesión la ruta no se activa y se redirige al login de Keycloak.
describe('authGuard', () => {
  const isAuthenticated = signal(false);
  const login = jest.fn().mockResolvedValue(undefined);
  const state = { url: '/backlog/nuevo' } as RouterStateSnapshot;

  const run = () =>
    TestBed.runInInjectionContext(() => authGuard({} as ActivatedRouteSnapshot, state));

  beforeEach(() => {
    login.mockClear();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), { provide: AuthService, useValue: { isAuthenticated, login } }],
    });
  });

  it('canActivate_ConSesion_DebePermitirLaRuta', () => {
    // Arrange
    isAuthenticated.set(true);

    // Act / Assert
    expect(run()).toBe(true);
    expect(login).not.toHaveBeenCalled();
  });

  it('canActivate_SinSesion_DebeBloquearYRedirigirAlLogin', () => {
    // Arrange
    isAuthenticated.set(false);

    // Act / Assert
    expect(run()).toBe(false);
    expect(login).toHaveBeenCalledWith(`${window.location.origin}/backlog/nuevo`);
  });
});
