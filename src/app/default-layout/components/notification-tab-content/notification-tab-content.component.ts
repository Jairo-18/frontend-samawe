import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { OrderNotification } from '../../../shared/interfaces/order-notification.interface';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-notification-tab-content',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    RelativeTimePipe,
    TranslateModule
  ],
  templateUrl: './notification-tab-content.component.html',
  styleUrl: './notification-tab-content.component.scss'
})
export class NotificationTabContentComponent {
  @Input() list: OrderNotification[] = [];
  @Input() stateCode: string = '';
  @Input() loading: boolean = false;

  @Output() scrollContent = new EventEmitter<{
    event: Event;
    stateCode: string;
  }>();
  @Output() itemClick = new EventEmitter<OrderNotification>();
  @Output() toggleRead = new EventEmitter<{
    event: Event;
    notif: OrderNotification;
  }>();
  @Output() delete = new EventEmitter<{
    event: Event;
    notif: OrderNotification;
  }>();

  onScroll(event: Event) {
    this.scrollContent.emit({ event, stateCode: this.stateCode });
  }

  onItemClick(notif: OrderNotification) {
    this.itemClick.emit(notif);
  }

  onToggleRead(event: Event, notif: OrderNotification) {
    this.toggleRead.emit({ event, notif });
  }

  onDelete(event: Event, notif: OrderNotification) {
    this.delete.emit({ event, notif });
  }
}
