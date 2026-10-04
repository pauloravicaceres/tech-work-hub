import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, input, model, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, catchError, exhaustMap, map, of } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';

import { AssignedItem, ProblemDetails } from '../../models/sprint.models';
import { SprintApiService } from '../../services/sprint-api.service';

const INVALID_FIELDS_MESSAGE = 'Revise los campos marcados: hay datos obligatorios ausentes o inválidos.';
const SPRINT_NOT_FOUND_MESSAGE = 'El Sprint indicado no existe. No se registró ninguna asignación.';
const ITEM_NOT_FOUND_MESSAGE = 'El elemento del backlog indicado no existe. No se registró ninguna asignación.';
const ITEM_NOT_FOUND_FIELD_MESSAGE = 'No existe un elemento del backlog con este identificador.';
const ALREADY_ASSIGNED_MESSAGE =
  'El elemento ya está asignado a un Sprint. Un elemento solo puede pertenecer a un Sprint. No se registró ninguna asignación.';
const ALREADY_ASSIGNED_FIELD_MESSAGE = 'Este elemento ya pertenece a un Sprint.';
const SPRINT_ID_INVALID_MESSAGE = 'El identificador del Sprint no es válido. No se registró ninguna asignación.';
const PERSISTENCE_ERROR_MESSAGE =
  'No fue posible asignar el elemento. No se registró ninguna asignación. Intente nuevamente en unos minutos.';

interface AssignItemForm {
  itemId: FormControl<string>;
}

export interface AssignItemBanner {
  severity: 'error' | 'warn';
  message: string;
}

type SubmitResult = { ok: true; assigned: AssignedItem } | { ok: false; error: HttpErrorResponse };

/** Diálogo de un solo campo (HU-004, estados 3, 6, 7, 8A, 11 y 12): el servidor es la fuente de verdad de FR-005..FR-007. */
@Component({
  selector: 'app-assign-item-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, DialogModule, InputTextModule, ButtonModule, MessageModule],
  templateUrl: './assign-item-dialog.component.html',
  styleUrls: ['./assign-item-dialog.component.scss'],
})
export class AssignItemDialogComponent {
  private readonly api = inject(SprintApiService);
  private readonly submit$ = new Subject<string>();

  readonly sprintId = input.required<string>();
  readonly sprintName = input<string>('');
  readonly visible = model(false);

  /** Se emite con el cuerpo 201 (`sprintId`, `itemId`); el padre refresca la grilla desde el servidor. */
  readonly assigned = output<AssignedItem>();
  /** Se emite ante un 401: el padre muestra el diálogo de reautenticación. */
  readonly unauthorized = output<void>();

  readonly form = new FormGroup<AssignItemForm>({
    itemId: new FormControl<string>('', { nonNullable: true }),
  });

  readonly isSubmitting = signal(false);
  readonly banner = signal<AssignItemBanner | null>(null);
  readonly fieldError = signal<string | null>(null);
  /** 404 de Sprint: reintentar con el mismo Sprint es inútil (estado 6). */
  readonly sprintMissing = signal(false);

  constructor() {
    this.submit$
      .pipe(
        exhaustMap((itemId) =>
          this.api.assignItem(this.sprintId(), itemId).pipe(
            map((assigned): SubmitResult => ({ ok: true, assigned })),
            catchError((error: HttpErrorResponse) => of<SubmitResult>({ ok: false, error })),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((result) => this.handleResult(result));
  }

  /** Cada apertura inicia limpia: campo vacío y sin errores previos (estado 5). */
  resetState(): void {
    this.form.reset({ itemId: '' });
    this.banner.set(null);
    this.fieldError.set(null);
    this.sprintMissing.set(false);
    this.isSubmitting.set(false);
  }

  onSubmit(): void {
    if (this.isSubmitting() || this.sprintMissing()) return;

    this.banner.set(null);
    this.fieldError.set(null);
    this.isSubmitting.set(true);
    this.submit$.next(this.form.controls.itemId.value.trim());
  }

  onCancel(): void {
    this.visible.set(false);
  }

  private handleResult(result: SubmitResult): void {
    this.isSubmitting.set(false);

    if (result.ok) {
      this.visible.set(false);
      this.assigned.emit(result.assigned);
      return;
    }

    const { status, error } = result.error;
    const problem = (error ?? null) as ProblemDetails | null;

    switch (status) {
      case 401:
        this.visible.set(false);
        this.unauthorized.emit();
        break;
      case 400:
        this.applyValidationErrors(problem);
        break;
      case 404:
        this.applyNotFound(problem);
        break;
      case 409:
        this.banner.set({ severity: 'warn', message: ALREADY_ASSIGNED_MESSAGE });
        this.fieldError.set(ALREADY_ASSIGNED_FIELD_MESSAGE);
        break;
      default:
        this.banner.set({ severity: 'error', message: PERSISTENCE_ERROR_MESSAGE });
        break;
    }
  }

  /** El 404 distingue Sprint de elemento por el `detail` del servidor; sin pista se asume el elemento (único campo editable). */
  private applyNotFound(problem: ProblemDetails | null): void {
    if (/sprint/i.test(problem?.detail ?? '')) {
      this.sprintMissing.set(true);
      this.banner.set({ severity: 'error', message: SPRINT_NOT_FOUND_MESSAGE });
      return;
    }
    this.banner.set({ severity: 'error', message: ITEM_NOT_FOUND_MESSAGE });
    this.fieldError.set(ITEM_NOT_FOUND_FIELD_MESSAGE);
  }

  private applyValidationErrors(problem: ProblemDetails | null): void {
    const errors = Object.entries(problem?.errors ?? {}).map(([key, messages]) => [key.toLowerCase(), messages] as const);
    const itemMessages = errors.find(([key]) => key === 'itemid')?.[1];
    const sprintInvalid = errors.some(([key]) => key === 'sprintid');

    if (itemMessages?.length) this.fieldError.set(itemMessages.join(' '));
    this.banner.set({
      severity: 'error',
      message: sprintInvalid && !itemMessages?.length ? SPRINT_ID_INVALID_MESSAGE : INVALID_FIELDS_MESSAGE,
    });
  }
}
