import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-input-text',
  templateUrl: './input-text.component.html',
  styleUrls: ['./input-text.component.scss']
})
export class InputTextComponent {
  @Input() id: string = '';
  @Input() floatLabel: boolean = false;
  @Input() label: string = '';
  @Input() ngModel: string = '';
  @Output() ngModelChange = new EventEmitter<string>();
}
