import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { SprintApiService } from './sprint-api.service';
import { Sprint } from '../models/sprint.models';

const SPRINT: Sprint = {
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  identification: 'Sprint 2026-01',
  startDate: '2026-10-05',
  endDate: '2026-10-18',
};

// HU-003 — cliente HTTP de Sprints: rutas, verbos y formato de fecha del contrato.
describe('SprintApiService', () => {
  let http: HttpTestingController;
  let service: SprintApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(SprintApiService);
  });

  afterEach(() => http.verify());

  it('create_DebeHacerPostAApiSprintsConFechasIso', () => {
    // Arrange
    const request = { identification: 'Sprint 2026-01', startDate: '2026-10-05', endDate: '2026-10-18' };
    let result: Sprint | undefined;

    // Act
    service.create(request).subscribe((sprint) => (result = sprint));
    const req = http.expectOne('/api/sprints');
    req.flush(SPRINT, { status: 201, statusText: 'Created' });

    // Assert
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    expect(req.request.body.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(req.request.body.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result).toEqual(SPRINT);
  });

  it('list_DebeHacerGetAApiSprints', () => {
    // Arrange
    let result: Sprint[] | undefined;

    // Act
    service.list().subscribe((sprints) => (result = sprints));
    const req = http.expectOne('/api/sprints');
    req.flush([SPRINT]);

    // Assert
    expect(req.request.method).toBe('GET');
    expect(result).toEqual([SPRINT]);
  });

  it('getById_DebeHacerGetAApiSprintsConElId', () => {
    // Arrange
    let result: Sprint | undefined;

    // Act
    service.getById(SPRINT.id).subscribe((sprint) => (result = sprint));
    const req = http.expectOne(`/api/sprints/${SPRINT.id}`);
    req.flush(SPRINT);

    // Assert
    expect(req.request.method).toBe('GET');
    expect(result).toEqual(SPRINT);
  });
});
