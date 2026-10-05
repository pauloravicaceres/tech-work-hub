/** Miembro del equipo (`TeamMemberResponse` de `GET`/`POST /api/team-members`): sin auditoría ni estado. */
export interface TeamMember {
  id: string;
  name: string;
  role: string;
}

/** Rol técnico del catálogo (`TechnicalRoleResponse` de `GET /api/technical-roles`). */
export interface TechnicalRole {
  id: string;
  name: string;
}

/** Cuerpo de `POST /api/team-members`: `role` es el NOMBRE de un rol del catálogo. */
export interface RegisterTeamMemberRequest {
  name: string;
  role: string;
}

/** `ProblemDetails` (RFC 7807) con el diccionario `errors` por campo. */
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  errors?: Record<string, string[]>;
}

/** Relación creada o existente (`ItemAssigneeResponse` de `POST /api/backlog-items/{itemId}/assignees`): sin auditoría. */
export interface ItemAssigneeResponse {
  itemId: string;
  memberId: string;
  memberName: string;
  role: string;
}

/** Persona relacionada con un elemento (`AssigneeResponse` de `GET /api/backlog-items/{itemId}/assignees`). */
export interface AssigneeResponse {
  id: string;
  name: string;
  role: string;
}

/** Elemento relacionado con un miembro (`MemberItemResponse` de `GET /api/team-members/{memberId}/items`). */
export interface MemberItemResponse {
  id: string;
  title: string;
  type: string;
}

/** Elemento del backlog para el selector (`GET /api/backlog-items`): solo `id`, `title` y `type`. */
export type BacklogItemSummary = MemberItemResponse;

/** Cuerpo de `POST /api/backlog-items/{itemId}/assignees`: un miembro por solicitud. */
export interface AssignMemberRequest {
  memberId: string;
}
