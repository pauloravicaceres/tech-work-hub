import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, model, output, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, Subject, catchError, exhaustMap, map, of, startWith, switchMap } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { Fluid } from 'primeng/fluid';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';

import { ProblemDetails, RegisterTeamMemberRequest, TeamMember, TechnicalRole } from '../../models/team.models';
import { TeamApiService } from '../../services/team-api.service';

const INVALID_FIELDS_MESSAGE = 'Revise los campos marcados: hay datos obligatorios ausentes o inválidos.';
const INVALID_ROLE_MESSAGE = 'El rol indicado no es válido. No se registró ningún miembro.';
const INVALID_ROLE_FIELD_MESSAGE = 'El rol seleccionado no existe en el catálogo de roles técnicos.';
const PERSISTENCE_ERROR_MESSAGE =
  'No fue posible registrar al miembro. No se registró ningún dato. Intente nuevamente en unos minutos.';

interface RegisterMemberForm {
  name: FormControl<string>;
  role: FormControl<string | null>;
}

export interface RegisterMemberBanner {
  severity: 'error';
  message: string;
}

interface RolesState {
  loading: boolean;
  roles: TechnicalRole[];
}

type SubmitResult = { ok: true; member: TeamMember } | { ok: false; error: HttpErrorResponse };

/** Diálogo de registro (HU-012, estados 4 a 10): el servidor es la fuente de verdad de FR-006 y FR-007 (UX D-05). */
@Component({
  selector: 'app-register-member-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Fluid, ReactiveFormsModule, DialogModule, InputTextModule, SelectModule, ButtonModule, MessageModule],
  templateUrl: './register-member-dialog.component.html',
  styleUrls: ['./register-member-dialog.component.scss'],
})
export class RegisterMemberDialogComponent {
  private readonly api = inject(TeamApiService);
  private readonly submit$ = new Subject<RegisterTeamMemberRequest>();
  private readonly reloadRoles$ = new BehaviorSubject<void>(undefined);

  readonly visible = model(false);

  /** Se emite con el cuerpo 201; el padre muestra el toast y vuelve a consultar la grilla. */
  readonly registered = output<TeamMember>();
  /** Se emite ante un 401: el padre muestra el diálogo de reautenticación. */
  readonly unauthorized = output<void>();

  readonly form = new FormGroup<RegisterMemberForm>({
    name: new FormControl<string>('', { nonNullable: true }),
    role: new FormControl<string | null>(null),
  });

  readonly isSubmitting = signal(false);
  readonly banner = signal<RegisterMemberBanner | null>(null);
  readonly nameError = signal<string | null>(null);
  readonly roleError = signal<string | null>(null);

  /** Opciones del selector: el catálogo del servidor, consultado de nuevo en cada refresco. */
  readonly rolesState = toSignal(
    this.reloadRoles$.pipe(
      switchMap(() =>
        this.api.listRoles().pipe(
          map((roles): RolesState => ({ loading: false, roles })),
          catchError((error: HttpErrorResponse) => {
            if (error.status === 401) this.onUnauthorized();
            return of<RolesState>({ loading: false, roles: [] });
          }),
          startWith<RolesState>({ loading: true, roles: [] }),
        ),
      ),
    ),
    { initialValue: { loading: true, roles: [] } as RolesState },
  );

  constructor() {
    this.submit$
      .pipe(
        exhaustMap((request) =>
          this.api.registerMember(request).pipe(
            map((member): SubmitResult => ({ ok: true, member })),
            catchError((error: HttpErrorResponse) => of<SubmitResult>({ ok: false, error })),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((result) => this.handleResult(result));
  }

  /** Cada apertura inicia limpia: campos vacíos y sin errores previos (estado 4). El padre monta el diálogo al abrirlo, por lo que el catálogo se consulta en cada apertura. */
  resetState(): void {
    this.form.reset({ name: '', role: null });
    this.clearErrors();
    this.isSubmitting.set(false);
  }

  onSubmit(): void {
    if (this.isSubmitting()) return;

    this.clearErrors();
    this.isSubmitting.set(true);
    this.submit$.next({ name: this.form.controls.name.value, role: this.form.controls.role.value ?? '' });
  }

  onCancel(): void {
    this.visible.set(false);
  }

  private clearErrors(): void {
    this.banner.set(null);
    this.nameError.set(null);
    this.roleError.set(null);
  }

  private onUnauthorized(): void {
    this.visible.set(false);
    this.unauthorized.emit();
  }

  private handleResult(result: SubmitResult): void {
    this.isSubmitting.set(false);

    if (result.ok) {
      this.visible.set(false);
      this.registered.emit(result.member);
      return;
    }

    const { status, error } = result.error;
    const problem = (error ?? null) as ProblemDetails | null;

    switch (status) {
      case 401:
        this.onUnauthorized();
        break;
      case 400:
        this.applyValidationErrors(problem);
        break;
      default:
        // Mensaje genérico: nunca se expone el cuerpo de la respuesta (estado 10).
        this.banner.set({ severity: 'error', message: PERSISTENCE_ERROR_MESSAGE });
        break;
    }
  }

  private applyValidationErrors(problem: ProblemDetails | null): void {
    const errors = new Map(Object.entries(problem?.errors ?? {}).map(([key, messages]) => [key.toLowerCase(), messages]));
    const nameMessages = errors.get('name');
    const roleMessages = errors.get('role');

    if (nameMessages?.length) this.nameError.set(nameMessages.join(' '));
    if (roleMessages?.length) this.roleError.set(roleMessages.join(' '));

    if (nameMessages?.length || roleMessages?.length) {
      this.banner.set({ severity: 'error', message: INVALID_FIELDS_MESSAGE });
      return;
    }

    // 400 por rol fuera del catálogo (estado 7): el catálogo pudo cambiar, se refrescan las opciones.
    this.roleError.set(INVALID_ROLE_FIELD_MESSAGE);
    this.banner.set({ severity: 'error', message: INVALID_ROLE_MESSAGE });
    this.reloadRoles$.next();
  }
}
