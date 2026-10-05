import { Injectable } from '@angular/core';
import { IConfirmDialog } from '@data/interfaces';
import { ConfirmationService } from 'primeng/api';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppConfirmationService {

  private confirmDialogSubject = new BehaviorSubject<any>(null);

  confirmDialog$: Observable<any> = this.confirmDialogSubject.asObservable();

  openConfirmation(confirmDialog: any): void {
    this.confirmDialogSubject.next(confirmDialog);
  }
  
  // constructor(private confirmationService: ConfirmationService) {}

  // // openConfirmation(message: string, onAccept: () => void, onReject: () => void): void {
  // //   this.confirmDialog.message = 'cxxxxxxxxx'
  // //   this.confirmationService.confirm({
  // //     message: message,
  // //     accept: onAccept,
  // //     reject: onReject
  // //   });
  // // }

  // private confirmDialogSubject = new BehaviorSubject<any>(null);

  // confirmDialog$: Observable<any> = this.confirmDialogSubject.asObservable();

  // openConfirmation(confirmDialog: IConfirmDialog): void {
  //   this.confirmDialogSubject.next(confirmDialog);

  //   console.log(confirmDialog)
  //   this.confirmationService.confirm({
  //     header: confirmDialog.header,
  //     message: confirmDialog.message,
  //     accept: confirmDialog.onAccept,
  //     reject: confirmDialog.onReject
  //   });

  // }
}
