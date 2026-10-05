import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-input-auto-complete',
  templateUrl: './input-auto-complete.component.html',
  styleUrls: ['./input-auto-complete.component.scss']
})
export class InputAutoCompleteComponent {
  @Input() id: string = '';
  @Input() floatLabel: boolean = false;
  @Input() label: string = '';
  @Input() field: string = '';
  @Input() ngModel: any;
  @Input() suggestions: any[] | undefined;
  @Output() ngModelChange = new EventEmitter<any>();
  @Output() onBlur = new EventEmitter<any>();
  @Output() completeMethod = new EventEmitter<any>();

}
