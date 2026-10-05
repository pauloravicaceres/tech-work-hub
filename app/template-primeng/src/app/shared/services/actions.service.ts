import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ActionsService {
  private subject$ = new Subject<any>();
  message = '';
  type = '';

  sendClickEvent(response?: any) {
    this.subject$.next(response);
  }

  getClickEvent(): Observable<any> {
    return this.subject$.asObservable();
  }

}
