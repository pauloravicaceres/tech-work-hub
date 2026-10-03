import { Component } from '@angular/core';
import { CreateBacklogItemComponent } from './features/backlog/components/create-backlog-item/create-backlog-item.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CreateBacklogItemComponent],
  template: '<app-create-backlog-item />',
})
export class AppComponent {}
