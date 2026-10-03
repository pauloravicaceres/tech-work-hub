import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateBacklogItemRequest,
  CreateBacklogItemResponse,
  RegisteredApplication,
} from '../models/backlog-item.models';

@Injectable({ providedIn: 'root' })
export class BacklogApiService {
  private readonly http = inject(HttpClient);

  createItem(request: CreateBacklogItemRequest): Observable<CreateBacklogItemResponse> {
    return this.http.post<CreateBacklogItemResponse>('/api/backlog/items', request);
  }

  /** Catálogo del módulo Application (`id` = Guid real). */
  getApplications(): Observable<RegisteredApplication[]> {
    return this.http.get<RegisteredApplication[]>('/api/applications');
  }
}
