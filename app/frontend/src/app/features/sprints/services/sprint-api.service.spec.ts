import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { SprintApiService } from './sprint-api.service';
import { AssignedItem, Sprint, SprintItem } from '../models/sprint.models';

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

  // HU-004 — asignación y consulta de elementos de un Sprint.
  it('assignItem_DebeHacerPostAItemsDelSprintConElItemIdEnElCuerpo', () => {
    // Arrange
    const itemId = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
    const response: AssignedItem = { sprintId: SPRINT.id, itemId };
    let result: AssignedItem | undefined;

    // Act
    service.assignItem(SPRINT.id, itemId).subscribe((assigned) => (result = assigned));
    const req = http.expectOne(`/api/sprints/${SPRINT.id}/items`);
    req.flush(response, { status: 201, statusText: 'Created' });

    // Assert
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ itemId });
    expect(result).toEqual(response);
  });

  it('listItems_DebeHacerGetAItemsDelSprint', () => {
    // Arrange
    const items: SprintItem[] = [
      { id: '7c9e6679-7425-40de-944b-e07fc1f90ae7', title: 'Registro de aplicaciones', type: 'UserStory', devPoints: 8, qaPoints: 5 },
      { id: '1b4e28ba-2fa1-11d2-883f-0016d3cca427', title: 'Spike de rendimiento', type: 'Spike', devPoints: 2.5, qaPoints: null },
    ];
    let result: SprintItem[] | undefined;

    // Act
    service.listItems(SPRINT.id).subscribe((list) => (result = list));
    const req = http.expectOne(`/api/sprints/${SPRINT.id}/items`);
    req.flush(items);

    // Assert
    expect(req.request.method).toBe('GET');
    expect(result).toEqual(items);
  });
});
