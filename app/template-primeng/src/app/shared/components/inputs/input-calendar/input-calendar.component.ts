import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-input-calendar',
  templateUrl: './input-calendar.component.html',
  styleUrls: ['./input-calendar.component.scss']
})
export class InputCalendarComponent {
  @Input() id: string = '';
  @Input() floatLabel: boolean = false;
  @Input() label: string = '';
  @Input() showClear: boolean = false;
  @Input() ngModel: any;
  @Output() onBlur = new EventEmitter<any>();
  @Output() ngModelChange = new EventEmitter<any>();

}
