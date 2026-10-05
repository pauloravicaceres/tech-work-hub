import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TeamApiService } from './team-api.service';
import { TeamMember, TechnicalRole } from '../models/team.models';

const MEMBER: TeamMember = { id: '5d2e71aa-0000-4000-8000-00000000c013', name: 'Ana Torres', role: 'Desarrollo' };

// HU-012 — cliente HTTP de Equipos: rutas, verbos y cuerpo del contrato.
describe('TeamApiService', () => {
  let http: HttpTestingController;
  let service: TeamApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(TeamApiService);
  });

  afterEach(() => http.verify());

  it('listMembers_DebeHacerGetAApiTeamMembers', () => {
    // Arrange
    let result: TeamMember[] | undefined;

    // Act
    service.listMembers().subscribe((members) => (result = members));
    const req = http.expectOne('/api/team-members');
    req.flush([MEMBER]);

    // Assert
    expect(req.request.method).toBe('GET');
    expect(result).toEqual([MEMBER]);
  });

  it('listRoles_DebeHacerGetAApiTechnicalRoles', () => {
    // Arrange
    const roles: TechnicalRole[] = [
      { id: '11111111-0000-4000-8000-000000000001', name: 'Desarrollo' },
      { id: '11111111-0000-4000-8000-000000000002', name: 'QA' },
    ];
    let result: TechnicalRole[] | undefined;

    // Act
    service.listRoles().subscribe((list) => (result = list));
    const req = http.expectOne('/api/technical-roles');
    req.flush(roles);

    // Assert
    expect(req.request.method).toBe('GET');
    expect(result).toEqual(roles);
  });

  it('registerMember_DebeHacerPostConNombreYRolEnElCuerpoYDevolverElMiembro', () => {
    // Arrange
    const request = { name: 'Ana Torres', role: 'Desarrollo' };
    let result: TeamMember | undefined;

    // Act
    service.registerMember(request).subscribe((member) => (result = member));
    const req = http.expectOne('/api/team-members');
    req.flush(MEMBER, { status: 201, statusText: 'Created' });

    // Assert
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    expect(result).toEqual(MEMBER);
  });
});
