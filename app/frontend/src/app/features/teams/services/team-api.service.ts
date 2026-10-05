import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AssigneeResponse,
  AssignMemberRequest,
  BacklogItemSummary,
  ItemAssigneeResponse,
  MemberItemResponse,
  RegisterTeamMemberRequest,
  TeamMember,
  TechnicalRole,
} from '../models/team.models';

@Injectable({ providedIn: 'root' })
export class TeamApiService {
  private readonly http = inject(HttpClient);

  listMembers(): Observable<TeamMember[]> {
    return this.http.get<TeamMember[]>('/api/team-members');
  }

  listRoles(): Observable<TechnicalRole[]> {
    return this.http.get<TechnicalRole[]>('/api/technical-roles');
  }

  registerMember(request: RegisterTeamMemberRequest): Observable<TeamMember> {
    return this.http.post<TeamMember>('/api/team-members', request);
  }

  /** HU-015: elementos del backlog para el selector (solo `id`, `title` y `type`). */
  listBacklogItems(): Observable<BacklogItemSummary[]> {
    return this.http.get<BacklogItemSummary[]>('/api/backlog-items');
  }

  /** HU-015: asigna un miembro a un elemento. Se observa la respuesta completa: 201 = creada, 200 = ya existía. */
  assignMember(itemId: string, memberId: string): Observable<HttpResponse<ItemAssigneeResponse>> {
    const request: AssignMemberRequest = { memberId };
    return this.http.post<ItemAssigneeResponse>(`/api/backlog-items/${encodeURIComponent(itemId)}/assignees`, request, {
      observe: 'response',
    });
  }

  /** HU-015: personas relacionadas con un elemento (solo lectura). */
  listItemAssignees(itemId: string): Observable<AssigneeResponse[]> {
    return this.http.get<AssigneeResponse[]>(`/api/backlog-items/${encodeURIComponent(itemId)}/assignees`);
  }

  /** HU-015: elementos relacionados con un miembro (solo lectura). */
  listMemberItems(memberId: string): Observable<MemberItemResponse[]> {
    return this.http.get<MemberItemResponse[]>(`/api/team-members/${encodeURIComponent(memberId)}/items`);
  }
}
