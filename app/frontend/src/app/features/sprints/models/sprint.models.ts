/** Sprint tal como lo devuelve la API (`SprintResponse`); las fechas llegan en formato ISO `yyyy-MM-dd`. */
export interface Sprint {
  id: string;
  identification: string;
  startDate: string;
  endDate: string;
}

/** Payload de `POST /api/sprints` (contracts/sprints-api.openapi.yaml); fechas en `yyyy-MM-dd`. */
export interface CreateSprintRequest {
  identification: string;
  startDate: string;
  endDate: string;
}

/** `ProblemDetails` (RFC 7807) con el diccionario `errors` por campo. */
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  errors?: Record<string, string[]>;
}
