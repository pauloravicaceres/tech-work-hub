import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, catchError, exhaustMap, map, of } from 'rxjs';

import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { Fluid } from 'primeng/fluid';
import { MessageModule } from 'primeng/message';

import { AuthService } from '../../../../core/auth/auth.service';
import { toIsoDate } from '../../models/sprint-date';
import { CreateSprintRequest, ProblemDetails, Sprint } from '../../models/sprint.models';
import { SprintApiService } from '../../services/sprint-api.service';

const IDENTIFICATION_MAX_LENGTH = 100;
const INVALID_FIELDS_MESSAGE = 'Revise los campos marcados: hay datos obligatorios ausentes o inválidos.';
const PERSISTENCE_ERROR_MESSAGE = 'No fue posible crear el Sprint. No se registró ningún Sprint. Intente nuevamente en unos minutos.';

interface SprintForm {
  identification: FormControl<string>;
  startDate: FormControl<Date | null>;
  endDate: FormControl<Date | null>;
}

type FormField = keyof SprintForm;
type FieldErrors = Partial<Record<FormField, string>>;

type SubmitResult = { ok: true; sprint: Sprint } | { ok: false; error: HttpErrorResponse };

/** Claves de `ProblemDetails.errors` (camelCase o PascalCase, en minúsculas) → control del formulario. */
const SERVER_FIELD_MAP: Readonly<Record<string, FormField>> = {
  identification: 'identification',
  startdate: 'startDate',
  enddate: 'endDate',
};

@Component({
  selector: 'app-sprint-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Fluid, ReactiveFormsModule, CardModule, InputTextModule, DatePickerModule, ButtonModule, MessageModule, DialogModule],
  templateUrl: './sprint-form.component.html',
  styleUrls: ['./sprint-form.component.scss'],
})
export class SprintFormComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(SprintApiService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly auth = inject(AuthService);
  private readonly submit$ = new Subject<CreateSprintRequest>();

  readonly form = this.fb.group<SprintForm>({
    identification: this.fb.control('', [Validators.required, Validators.maxLength(IDENTIFICATION_MAX_LENGTH)]),
    startDate: new FormControl<Date | null>(null, Validators.required),
    endDate: new FormControl<Date | null>(null, Validators.required),
  });

  readonly identificationMaxLength = IDENTIFICATION_MAX_LENGTH;
  readonly isSubmitting = signal(false);
  readonly sessionExpired = signal(false);
  readonly serverError = signal(false);
  readonly submitAttempted = signal(false);
  readonly fieldErrors = signal<FieldErrors>({});

  /** Banner del formulario: fallo de persistencia, mensaje del servidor para la ventana, o aviso de campos inválidos. */
  readonly bannerMessage = computed(() => {
    if (this.serverError()) return PERSISTENCE_ERROR_MESSAGE;
    const serverMessage = this.fieldErrors().endDate;
    if (serverMessage) return serverMessage;
    return this.submitAttempted() && (this.hasClientErrors() || Object.keys(this.fieldErrors()).length > 0)
      ? INVALID_FIELDS_MESSAGE
      : null;
  });

  private readonly hasClientErrors = signal(false);

  constructor() {
    this.submit$
      .pipe(
        exhaustMap((request) =>
          this.api.create(request).pipe(
            map((sprint): SubmitResult => ({ ok: true, sprint })),
            catchError((error: HttpErrorResponse) => of<SubmitResult>({ ok: false, error })),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((result) => this.handleResult(result));
  }

  /** La regla de la ventana de 2 semanas la decide el servidor; el cliente solo valida presencia. */
  onSubmit(): void {
    if (this.isSubmitting()) return;

    this.submitAttempted.set(true);
    this.serverError.set(false);
    this.fieldErrors.set({});

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.hasClientErrors.set(true);
      return;
    }
    this.hasClientErrors.set(false);

    const { identification, startDate, endDate } = this.form.getRawValue();
    if (!startDate || !endDate) return;

    this.isSubmitting.set(true);
    this.submit$.next({
      identification: identification.trim(),
      startDate: toIsoDate(startDate),
      endDate: toIsoDate(endDate),
    });
  }

  onCancel(): void {
    void this.router.navigate(['/sprints']);
  }

  reauthenticate(): void {
    void this.auth.reauthenticate();
  }

  private handleResult(result: SubmitResult): void {
    this.isSubmitting.set(false);

    if (result.ok) {
      const { identification, id } = result.sprint;
      // El toast se emite tras la navegación: `p-toast` del listado se suscribe al montarse.
      void this.router.navigate(['/sprints']).then(() =>
        this.messageService.add({
          severity: 'success',
          summary: 'Sprint creado',
          detail: `Sprint "${identification}" registrado con identificador ${id}`,
          life: 5000,
        }),
      );
      return;
    }

    const { status, error } = result.error;
    if (status === 401) {
      this.sessionExpired.set(true);
    } else if (status === 400) {
      this.applyProblemDetails(error as ProblemDetails | null);
    } else {
      this.serverError.set(true);
    }
  }

  /** Asigna cada mensaje de `errors` a su campo; conserva los valores ingresados. */
  private applyProblemDetails(problem: ProblemDetails | null): void {
    const fieldErrors: FieldErrors = {};

    for (const [key, messages] of Object.entries(problem?.errors ?? {})) {
      const field = SERVER_FIELD_MAP[key.toLowerCase()];
      if (!field) continue;
      fieldErrors[field] = messages.join(' ');
      this.form.controls[field].setErrors({ server: true });
      this.form.controls[field].markAsTouched();
    }

    this.fieldErrors.set(fieldErrors);
  }
}
