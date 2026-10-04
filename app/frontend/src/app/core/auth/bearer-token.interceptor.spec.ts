import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { bearerTokenInterceptor } from './bearer-token.interceptor';

// HU-001 — FR-001 / FR-009: el cliente envía el Bearer a /api/** y reautentica ante 401.
describe('bearerTokenInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let auth: { token: string | undefined; refreshToken: jest.Mock<Promise<string>, []> };

  beforeEach(() => {
    auth = { token: 'token-1', refreshToken: jest.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(withInterceptors([bearerTokenInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('intercept_ConRutaApi_DebeAnadirAuthorizationBearer', () => {
    // Act
    http.get('/api/applications').subscribe();

    // Assert
    const req = controller.expectOne('/api/applications');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-1');
    req.flush([]);
  });

  it('intercept_ConUrlFueraDeApi_NoDebeAnadirAuthorization', () => {
    // Act
    http.get('/assets/config.json').subscribe();

    // Assert
    const req = controller.expectOne('/assets/config.json');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('intercept_SinToken_NoDebeAnadirAuthorization', () => {
    // Arrange
    auth.token = undefined;

    // Act
    http.get('/api/applications').subscribe();

    // Assert
    const req = controller.expectOne('/api/applications');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });

  it('intercept_Con401_DebeRenovarTokenYReintentarUnaVez', async () => {
    // Arrange
    auth.refreshToken.mockResolvedValue('token-2');
    const result = jest.fn();

    // Act
    http.post('/api/backlog/items', {}).subscribe(result);
    controller.expectOne('/api/backlog/items').flush({}, { status: 401, statusText: 'Unauthorized' });
    await Promise.resolve();
    await Promise.resolve();

    // Assert
    const retry = controller.expectOne('/api/backlog/items');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer token-2');
    retry.flush({ id: 'x' });
    expect(result).toHaveBeenCalledWith({ id: 'x' });
    expect(auth.refreshToken).toHaveBeenCalledTimes(1);
  });

  it('intercept_Con401YRenovacionFallida_DebePropagarElError401', async () => {
    // Arrange
    auth.refreshToken.mockRejectedValue(new Error('refresh expirado'));
    const onError = jest.fn();

    // Act
    http.get('/api/applications').subscribe({ error: onError });
    controller.expectOne('/api/applications').flush({}, { status: 401, statusText: 'Unauthorized' });
    await Promise.resolve();
    await Promise.resolve();

    // Assert
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0].status).toBe(401);
  });

  it('intercept_ConError500_NoDebeIntentarRenovarToken', () => {
    // Act
    const onError = jest.fn();
    http.get('/api/applications').subscribe({ error: onError });
    controller.expectOne('/api/applications').flush({}, { status: 500, statusText: 'Server Error' });

    // Assert
    expect(auth.refreshToken).not.toHaveBeenCalled();
    expect(onError.mock.calls[0][0].status).toBe(500);
  });
});
