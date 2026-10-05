import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-input-dropdown',
  templateUrl: './input-dropdown.component.html',
  styleUrls: ['./input-dropdown.component.scss']
})
export class InputDropdownComponent {
  @Input() id: string = '';
  @Input() floatLabel: boolean = false;
  @Input() label: string = '';
  @Input() options: any[] | undefined;
  @Input() optionLabel: string = '';
  @Input() optionValue: string = '';
  @Input() showClear: boolean = false;
  @Input() spinner: boolean = false;
  @Input() ngModel: any;
  @Output() onChange = new EventEmitter<any>();
  @Output() ngModelChange = new EventEmitter<any>();

}
