// confirmation.service.ts
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ConfirmationService {
  private confirmationSubject = new Subject<boolean>();
  private deleteSubject = new Subject<void>();
  private retiroSubject = new Subject<void>();
  private comentariosub = new Subject<void>();
  private pagosub = new Subject<void>();

  getDeleteEvent(): Observable<void> {
    return this.deleteSubject.asObservable();
  }

  getRetiroEvent(): Observable<void> {
    return this.retiroSubject.asObservable();
  }

  emitRetiroEvent(): void {
    this.retiroSubject.next();
  }

  emitDeleteEvent(): void {
    this.deleteSubject.next();
  }
  emitAddPagoEvent(): void {
    this.pagosub.next();
  }
  getAddPagoEvent(): Observable<void> {
    return this.pagosub.asObservable();
  }

  emitAddComentarioEvent(): void {
    this.comentariosub.next();
  }
  getAddComentarioEvent(): Observable<void> {
    return this.comentariosub.asObservable();
  }

  getConfirmationState() {
    return this.confirmationSubject.asObservable();
  }

  setConfirmationState(state: boolean) {
    this.confirmationSubject.next(state);
  }
}
