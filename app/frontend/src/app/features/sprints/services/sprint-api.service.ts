import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateSprintRequest, Sprint } from '../models/sprint.models';

@Injectable({ providedIn: 'root' })
export class SprintApiService {
  private readonly http = inject(HttpClient);

  create(request: CreateSprintRequest): Observable<Sprint> {
    return this.http.post<Sprint>('/api/sprints', request);
  }

  list(): Observable<Sprint[]> {
    return this.http.get<Sprint[]>('/api/sprints');
  }

  getById(id: string): Observable<Sprint> {
    return this.http.get<Sprint>(`/api/sprints/${encodeURIComponent(id)}`);
  }
}
