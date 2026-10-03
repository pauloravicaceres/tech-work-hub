import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageModule } from 'primeng/message';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-create-backlog-item',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    DropdownModule,
    InputNumberModule,
    TextareaModule,
    ButtonModule,
    ToastModule,
    MessageModule,
    DialogModule
  ],
  providers: [MessageService],
  templateUrl: './create-backlog-item.component.html',
  styleUrls: ['./create-backlog-item.component.scss']
})
export class CreateBacklogItemComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private messageService = inject(MessageService);

  form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    type: ['UserStory', Validators.required],
    priority: ['Medium', Validators.required],
    applicationId: [null],
    status: [{ value: 'Backlog', disabled: true }],
    devPoints: [0, [Validators.min(0)]],
    qaPoints: [0, [Validators.min(0)]],
    description: [''],
    acceptanceCriteria: ['']
  });

  isSubmitting = signal(false);
  sessionExpired = signal(false);
  serverError = signal(false);

  types = ['UserStory', 'Bug', 'TechEvolution', 'TechRequirement', 'TechDebt', 'Research', 'Spike'];
  priorities = ['Low', 'Medium', 'High', 'Critical'];
  applications = [{ label: 'app-id-101 (Tech Gateway)', value: 'app-id-101' }];

  selectedType = computed(() => this.form.get('type')?.value || 'UserStory');
  isQaNotApplicable = computed(() => ['Spike', 'Research', 'TechDebt', 'TechEvolution', 'TechRequirement'].includes(this.selectedType()));

  charsCount = computed(() => this.form.get('title')?.value?.length || 0);

  constructor() {
    this.form.get('type')?.valueChanges.subscribe(type => {
      if (['Spike', 'Research', 'TechDebt', 'TechEvolution', 'TechRequirement'].includes(type!)) {
        this.form.get('qaPoints')?.setValue(null);
        this.form.get('qaPoints')?.disable();
      } else {
        this.form.get('qaPoints')?.enable();
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.isSubmitting.set(true);
    this.serverError.set(false);

    const payload = this.form.getRawValue();
    // Enforce qaPoints null for technical items
    if (this.isQaNotApplicable()) {
        payload.qaPoints = null;
    }

    this.http.post('/api/backlog/items', payload).subscribe({
      next: (res: any) => {
        this.isSubmitting.set(false);
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Elemento registrado en Backlog con UUID ${res.id || ''}` });
        this.form.reset({ type: 'UserStory', priority: 'Medium', status: 'Backlog', devPoints: 0, qaPoints: 0 });
      },
      error: (err) => {
        this.isSubmitting.set(false);
        if (err.status === 401) {
          this.sessionExpired.set(true);
        } else if (err.status === 400) {
          this.messageService.add({ severity: 'error', summary: 'Error de Validación', detail: err.error?.message || 'Datos inválidos' });
          if (err.error?.message?.includes('aplicación')) {
            this.form.get('applicationId')?.setErrors({ invalidApp: true });
          }
        } else {
          this.serverError.set(true);
        }
      }
    });
  }

  reauthenticate() {
    // Redirige al login de Keycloak
    window.location.href = '/auth/login';
  }
}
