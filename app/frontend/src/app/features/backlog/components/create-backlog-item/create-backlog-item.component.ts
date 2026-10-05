import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, catchError, exhaustMap, map, of } from 'rxjs';

import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { Fluid } from 'primeng/fluid';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';

import {
  BACKLOG_ITEM_PRIORITIES,
  BACKLOG_ITEM_TYPES,
  isTechnicalType,
} from '../../models/backlog-item.constants';
import {
  BacklogItemPriority,
  BacklogItemType,
  CreateBacklogItemRequest,
  CreateBacklogItemResponse,
  ProblemDetails,
  RegisteredApplication,
} from '../../models/backlog-item.models';
import { AuthService } from '../../../../core/auth/auth.service';
import { BacklogApiService } from '../../services/backlog-api.service';

interface BacklogItemForm {
  title: FormControl<string>;
  type: FormControl<BacklogItemType>;
  priority: FormControl<BacklogItemPriority>;
  applicationId: FormControl<string | null>;
  status: FormControl<string>;
  devPoints: FormControl<number | null>;
  qaPoints: FormControl<number | null>;
  description: FormControl<string>;
  acceptanceCriteria: FormControl<string>;
}

type FormField = keyof BacklogItemForm;
type FieldErrors = Partial<Record<FormField, string>>;

type SubmitResult =
  | { ok: true; response: CreateBacklogItemResponse }
  | { ok: false; error: HttpErrorResponse };

/** Claves de `ProblemDetails.errors` (nombres de propiedad del comando) → control del formulario. */
const SERVER_FIELD_MAP: Readonly<Record<string, FormField>> = {
  Title: 'title',
  Type: 'type',
  Priority: 'priority',
  DevPoints: 'devPoints',
  QAPoints: 'qaPoints',
  ApplicationId: 'applicationId',
  Description: 'description',
  AcceptanceCriteria: 'acceptanceCriteria',
};

@Component({
  selector: 'app-create-backlog-item',
  standalone: true,
  imports: [
    Fluid,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    SelectModule,
    InputNumberModule,
    TextareaModule,
    ButtonModule,
    ToastModule,
    MessageModule,
    DialogModule,
  ],
  providers: [MessageService],
  templateUrl: './create-backlog-item.component.html',
  styleUrls: ['./create-backlog-item.component.scss'],
})
export class CreateBacklogItemComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(BacklogApiService);
  private readonly messageService = inject(MessageService);
  private readonly auth = inject(AuthService);
  private readonly submit$ = new Subject<CreateBacklogItemRequest>();

  readonly form = this.fb.group<BacklogItemForm>({
    title: this.fb.control('', [Validators.required, Validators.maxLength(200)]),
    type: this.fb.control<BacklogItemType>('UserStory', Validators.required),
    priority: this.fb.control<BacklogItemPriority>('Medium', Validators.required),
    applicationId: new FormControl<string | null>(null),
    status: this.fb.control({ value: 'Backlog', disabled: true }),
    devPoints: new FormControl<number | null>(0, [Validators.min(0)]),
    qaPoints: new FormControl<number | null>(null, [Validators.min(0)]),
    description: this.fb.control(''),
    acceptanceCriteria: this.fb.control(''),
  });

  readonly isSubmitting = signal(false);
  readonly sessionExpired = signal(false);
  readonly serverError = signal(false);
  readonly applicationsLoadFailed = signal(false);
  readonly fieldErrors = signal<FieldErrors>({});

  readonly types = [...BACKLOG_ITEM_TYPES];
  readonly priorities = [...BACKLOG_ITEM_PRIORITIES];

  private readonly applicationList = toSignal(
    this.api.getApplications().pipe(
      catchError(() => {
        this.applicationsLoadFailed.set(true);
        return of<RegisteredApplication[]>([]);
      }),
    ),
    { initialValue: [] as RegisteredApplication[] },
  );
  readonly applications = computed(() =>
    this.applicationList().map((app) => ({ label: app.name, value: app.id })),
  );

  readonly selectedType = toSignal(this.form.controls.type.valueChanges, {
    initialValue: this.form.controls.type.value,
  });
  readonly isQaNotApplicable = computed(() => isTechnicalType(this.selectedType()));

  private readonly titleValue = toSignal(this.form.controls.title.valueChanges, {
    initialValue: this.form.controls.title.value,
  });
  readonly charsCount = computed(() => this.titleValue().length);

  constructor() {
    this.form.controls.type.valueChanges.pipe(takeUntilDestroyed()).subscribe((type) => {
      const qaPoints = this.form.controls.qaPoints;
      if (isTechnicalType(type)) {
        qaPoints.setValue(null);
        qaPoints.disable();
      } else {
        qaPoints.enable();
      }
    });

    this.submit$
      .pipe(
        exhaustMap((request) =>
          this.api.createItem(request).pipe(
            map((response): SubmitResult => ({ ok: true, response })),
            catchError((error: HttpErrorResponse) => of<SubmitResult>({ ok: false, error })),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((result) => this.handleResult(result));
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isSubmitting.set(true);
    this.serverError.set(false);
    this.fieldErrors.set({});

    const raw = this.form.getRawValue();
    this.submit$.next({
      title: raw.title,
      description: raw.description || null,
      type: raw.type,
      priority: raw.priority,
      acceptanceCriteria: raw.acceptanceCriteria || null,
      devPoints: raw.devPoints,
      qaPoints: isTechnicalType(raw.type) ? null : raw.qaPoints,
      applicationId: raw.applicationId,
    });
  }

  onCancel(): void {
    this.form.reset();
    this.fieldErrors.set({});
    this.serverError.set(false);
  }

  reauthenticate(): void {
    void this.auth.reauthenticate();
  }

  private handleResult(result: SubmitResult): void {
    this.isSubmitting.set(false);

    if (result.ok) {
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: `Elemento registrado en Backlog con UUID ${result.response.id}`,
      });
      this.form.reset();
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

  /** Lee `errors` del `ProblemDetails` y los asigna por campo (FR-013). */
  private applyProblemDetails(problem: ProblemDetails | null): void {
    const fieldErrors: FieldErrors = {};
    const general: string[] = [];

    for (const [key, messages] of Object.entries(problem?.errors ?? {})) {
      const field = SERVER_FIELD_MAP[key];
      if (field) {
        fieldErrors[field] = messages.join(' ');
        this.form.controls[field].setErrors({ server: true });
        this.form.controls[field].markAsTouched();
      } else {
        general.push(...messages);
      }
    }

    this.fieldErrors.set(fieldErrors);
    this.messageService.add({
      severity: 'error',
      summary: 'Error de Validación',
      detail: general.join(' ') || problem?.title || 'Datos inválidos',
    });
  }
}
