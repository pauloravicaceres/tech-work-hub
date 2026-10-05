import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input, model, output, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, Subject, catchError, exhaustMap, map, of, startWith, switchMap } from 'rxjs';

import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { Fluid } from 'primeng/fluid';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';

import { BacklogItemSummary, ItemAssigneeResponse, ProblemDetails, TeamMember } from '../../models/team.models';
import { TeamApiService } from '../../services/team-api.service';

const ITEM_REQUIRED_MESSAGE = 'El elemento es obligatorio.';
const INVALID_FIELDS_MESSAGE = 'Revise los campos marcados.';
const MEMBER_NOT_FOUND_MESSAGE = 'El miembro seleccionado no existe. Actualice la lista de miembros y elija uno registrado.';
const ITEM_NOT_FOUND_MESSAGE = 'El elemento seleccionado no existe. Actualice la lista de elementos y elija uno existente.';
const PERSISTENCE_ERROR_MESSAGE =
  'No se pudo asignar el responsable. Ocurrió un error inesperado. No se guardó ningún cambio. Intente nuevamente.';

interface AssignAssigneeForm {
  itemId: FormControl<string | null>;
  memberId: FormControl<string | null>;
}

interface ListState<T> {
  loading: boolean;
  options: T[];
}

export interface AssignAssigneeBanner {
  severity: 'error';
  message: string;
}

/** Resultado emitido al padre: `created` = 201 (nueva relación), `false` = 200 (ya existía, idempotente). */
export interface AssignedEvent {
  created: boolean;
  assignment: ItemAssigneeResponse;
}

type SubmitResult =
  | { ok: true; created: boolean; assignment: ItemAssigneeResponse }
  | { ok: false; error: HttpErrorResponse };

/** Diálogo de asignación (HU-015, estados 4 a 10 y 12): un miembro por solicitud; el rol es de solo lectura (FR-005). */
@Component({
  selector: 'app-assign-assignee-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Fluid, ReactiveFormsModule, DialogModule, InputTextModule, SelectModule, ButtonModule, MessageModule],
  templateUrl: './assign-assignee-dialog.component.html',
  styleUrls: ['./assign-assignee-dialog.component.scss'],
})
export class AssignAssigneeDialogComponent {
  private readonly api = inject(TeamApiService);
  private readonly messages = inject(MessageService);
  private readonly submit$ = new Subject<{ itemId: string; memberId: string }>();
  private readonly reloadItems$ = new BehaviorSubject<void>(undefined);
  private readonly reloadMembers$ = new BehaviorSubject<void>(undefined);

  readonly visible = model(false);
  /** Elemento precargado cuando el diálogo se abre desde la vista `Por elemento`. */
  readonly itemId = input<string | null>(null);

  /** Se emite tras un 200/201; el padre vuelve a consultar al servidor (sin Optimistic UI). */
  readonly assigned = output<AssignedEvent>();
  /** Se emite ante un 401: el padre muestra el diálogo de reautenticación. */
  readonly unauthorized = output<void>();

  readonly form = new FormGroup<AssignAssigneeForm>({
    itemId: new FormControl<string | null>(null),
    memberId: new FormControl<string | null>(null),
  });

  readonly isSubmitting = signal(false);
  readonly failed = signal(false);
  readonly banner = signal<AssignAssigneeBanner | null>(null);
  readonly itemError = signal<string | null>(null);
  readonly memberError = signal<string | null>(null);

  readonly itemsState = toSignal(
    this.reloadItems$.pipe(
      switchMap(() =>
        this.api.listBacklogItems().pipe(
          map((options): ListState<BacklogItemSummary> => ({ loading: false, options })),
          catchError((error: HttpErrorResponse) => {
            this.notifyIfUnauthorized(error);
            return of<ListState<BacklogItemSummary>>({ loading: false, options: [] });
          }),
          startWith<ListState<BacklogItemSummary>>({ loading: true, options: [] }),
        ),
      ),
    ),
    { initialValue: { loading: true, options: [] } as ListState<BacklogItemSummary> },
  );

  readonly membersState = toSignal(
    this.reloadMembers$.pipe(
      switchMap(() =>
        this.api.listMembers().pipe(
          map((options): ListState<TeamMember> => ({ loading: false, options })),
          catchError((error: HttpErrorResponse) => {
            this.notifyIfUnauthorized(error);
            return of<ListState<TeamMember>>({ loading: false, options: [] });
          }),
          startWith<ListState<TeamMember>>({ loading: true, options: [] }),
        ),
      ),
    ),
    { initialValue: { loading: true, options: [] } as ListState<TeamMember> },
  );

  private readonly selectedMemberId = toSignal(this.form.controls.memberId.valueChanges, { initialValue: null });

  /** Rol técnico registrado del miembro elegido: solo lectura, nunca se envía (FR-005). */
  readonly selectedRole = computed(
    () => this.membersState().options.find((member) => member.id === this.selectedMemberId())?.role ?? '',
  );

  constructor() {
    this.submit$
      .pipe(
        exhaustMap(({ itemId, memberId }) =>
          this.api.assignMember(itemId, memberId).pipe(
            map((response): SubmitResult => this.toSubmitResult(response)),
            catchError((error: HttpErrorResponse) => of<SubmitResult>({ ok: false, error })),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((result) => this.handleResult(result));
  }

  /** Cada apertura inicia limpia; el elemento precargado se conserva (estado 4). */
  resetState(): void {
    this.form.reset({ itemId: this.itemId(), memberId: null });
    this.clearErrors();
    this.failed.set(false);
    this.isSubmitting.set(false);
  }

  onSubmit(): void {
    if (this.isSubmitting()) return;

    this.clearErrors();
    const itemId = this.form.controls.itemId.value ?? '';
    if (!itemId) {
      // Sin identificador no existe ruta a la que enviar la solicitud.
      this.itemError.set(ITEM_REQUIRED_MESSAGE);
      this.banner.set({ severity: 'error', message: INVALID_FIELDS_MESSAGE });
      return;
    }

    this.isSubmitting.set(true);
    this.submit$.next({ itemId, memberId: this.form.controls.memberId.value ?? '' });
  }

  onCancel(): void {
    this.visible.set(false);
  }

  private toSubmitResult(response: HttpResponse<ItemAssigneeResponse>): SubmitResult {
    if (response.body === null) {
      return { ok: false, error: new HttpErrorResponse({ status: 500 }) };
    }
    return { ok: true, created: response.status === 201, assignment: response.body };
  }

  private clearErrors(): void {
    this.banner.set(null);
    this.itemError.set(null);
    this.memberError.set(null);
  }

  private notifyIfUnauthorized(error: HttpErrorResponse): void {
    if (error.status === 401) this.onUnauthorized();
  }

  private onUnauthorized(): void {
    this.visible.set(false);
    this.unauthorized.emit();
  }

  private handleResult(result: SubmitResult): void {
    this.isSubmitting.set(false);

    if (result.ok) {
      this.notifySuccess(result);
      this.visible.set(false);
      this.assigned.emit({ created: result.created, assignment: result.assignment });
      return;
    }

    const { status, error } = result.error;
    const problem = (error ?? null) as ProblemDetails | null;
    this.failed.set(false);

    switch (status) {
      case 401:
        this.onUnauthorized();
        break;
      case 400:
        this.applyValidationErrors(problem);
        break;
      case 404:
        this.applyNotFound(problem);
        break;
      default:
        // Mensaje genérico: nunca se expone el cuerpo de la respuesta (estado 12).
        this.failed.set(true);
        this.banner.set({ severity: 'error', message: PERSISTENCE_ERROR_MESSAGE });
        break;
    }
  }

  private notifySuccess(result: { created: boolean; assignment: ItemAssigneeResponse }): void {
    const { memberName, role, itemId } = result.assignment;
    const title = this.itemsState().options.find((item) => item.id === itemId)?.title ?? itemId;
    this.messages.add(
      result.created
        ? {
            severity: 'success',
            summary: 'Responsable asignado.',
            detail: `${memberName} (${role}) en ${title}.`,
            life: 5000,
          }
        : {
            severity: 'info',
            summary: 'Sin cambios.',
            detail: `${memberName} ya era responsable de ${title}. No se creó una relación nueva.`,
            life: 5000,
          },
    );
  }

  private applyValidationErrors(problem: ProblemDetails | null): void {
    const errors = new Map(Object.entries(problem?.errors ?? {}).map(([key, messages]) => [key.toLowerCase(), messages]));
    const itemMessages = errors.get('itemid');
    const memberMessages = errors.get('memberid');

    if (itemMessages?.length) this.itemError.set(itemMessages.join(' '));
    if (memberMessages?.length) this.memberError.set(memberMessages.join(' '));
    this.banner.set({ severity: 'error', message: INVALID_FIELDS_MESSAGE });
  }

  /** El 404 distingue miembro de elemento por el `detail`; el campo culpable se vacía y su lista se recarga. */
  private applyNotFound(problem: ProblemDetails | null): void {
    if ((problem?.detail ?? '').toLowerCase().includes('miembro')) {
      this.form.controls.memberId.setValue(null);
      this.memberError.set(MEMBER_NOT_FOUND_MESSAGE);
      this.banner.set({ severity: 'error', message: MEMBER_NOT_FOUND_MESSAGE });
      this.reloadMembers$.next();
      return;
    }

    this.form.controls.itemId.setValue(null);
    this.itemError.set(ITEM_NOT_FOUND_MESSAGE);
    this.banner.set({ severity: 'error', message: ITEM_NOT_FOUND_MESSAGE });
    this.reloadItems$.next();
  }
}
