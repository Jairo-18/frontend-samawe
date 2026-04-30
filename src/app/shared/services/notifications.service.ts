import { inject, Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import {
  NotificationInterface,
  NotificationsTypes
} from '../interfaces/notifications.interface';
@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private _toastrService: ToastrService = inject(ToastrService);
  private _translateService: TranslateService = inject(TranslateService);
  showNotification(
    type: NotificationsTypes,
    information: string,
    title?: string
  ): void {
    const notification: NotificationInterface = {
      title: title ? this._translateService.instant(title) : undefined,
      type,
      information: this._translateService.instant(information)
    };
    this._showToast(notification);
  }
  private _showToast(notification: NotificationInterface): void {
    const iconMap = {
      success: '<i class="fas fa-check-circle"></i>',
      error: '<i class="fas fa-exclamation-circle"></i>'
    };
    const template = `
      <div class="flex items-center">
        <div class="toast-icon">${iconMap[notification.type]}</div>
        <div class="toast-body">
          <div class="toast-title">${notification.title || ''}</div>
          <div class="toast-message">${notification.information}</div>
        </div>
      </div>
    `;
    this._toastrService.show(template, '', {
      timeOut: 5000,
      tapToDismiss: true,
      enableHtml: true,
      progressBar: true,
      progressAnimation: 'increasing',
      toastClass: `toast-container ngx-toastr brand-toast-${notification.type}`,
      positionClass: 'toast-top-right',
      extendedTimeOut: 5000
    });
  }
}
