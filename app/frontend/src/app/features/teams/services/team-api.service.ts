import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RegisterTeamMemberRequest, TeamMember, TechnicalRole } from '../models/team.models';

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
}
