import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  Input,
  HostListener,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { OrdersSocketService } from '../../../shared/services/orders-socket.service';
import { NotificationApiService } from '../../../shared/services/notification-api.service';
import { UserInterface } from '../../../shared/interfaces/user.interface';
import { OrderUpdate } from '../../../shared/interfaces/order-socket.interface';
import { OrderNotification } from '../../../shared/interfaces/order-notification.interface';
import { PaginationInterface } from '../../../shared/interfaces/pagination.interface';
import { NotificationTabContentComponent } from '../notification-tab-content/notification-tab-content.component';

@Component({
  selector: 'app-notification-button',
  standalone: true,
  imports: [
    CommonModule,
    MatMenuModule,
    MatBadgeModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    NotificationTabContentComponent
  ],
  templateUrl: './notification-button.component.html',
  styleUrl: './notification-button.component.scss'
})
export class NotificationButtonComponent implements OnInit, OnDestroy {
  @Input() showNotificationsIcon: boolean = false;
  @Input() userInfo?: UserInterface;

  isMenuOpen: boolean = false;
  private readonly _elementRef: ElementRef = inject(ElementRef);
  private readonly _router: Router = inject(Router);
  private _ordersSocket: OrdersSocketService = inject(OrdersSocketService);
  private _notificationApi: NotificationApiService = inject(
    NotificationApiService
  );

  private _subscription: Subscription = new Subscription();
  private audioReminderInterval: ReturnType<typeof setInterval> | undefined;

  unreadNotifications: number = 0;

  tabStates: Record<
    string,
    {
      data: OrderNotification[];
      pagination: PaginationInterface | null;
      loading: boolean;
    }
  > = {
    ENC: { data: [], pagination: null, loading: false },
    ENT: { data: [], pagination: null, loading: false }
  };

  private hasLoadedNotifications: boolean = false;
  private hasJoinedSocketRoom: boolean = false;

  toggleMenu(event: Event) {
    event.stopPropagation();
    this.isMenuOpen = !this.isMenuOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (
      this.isMenuOpen &&
      !this._elementRef.nativeElement.contains(event.target)
    ) {
      this.isMenuOpen = false;
    }
  }

  ngOnInit(): void {
    if (this.showNotificationsIcon && this.userInfo) {
      this.checkRolesForNotifications();
    }

    this._subscription.add(
      this._ordersSocket.onOrderUpdated().subscribe((liveUpdate) => {
        this.handleLiveNotification(liveUpdate);
      })
    );

    this.setupAudioReminder();
  }

  ngOnDestroy(): void {
    if (this.audioReminderInterval) {
      clearInterval(this.audioReminderInterval);
    }
    this._subscription.unsubscribe();
  }

  private setupAudioReminder() {
    this.audioReminderInterval = setInterval(() => {
      if (this.unreadNotifications > 0 && this.showNotificationsIcon) {
        this.playNotificationSound();
      }
    }, 60000);
  }

  private loadNotifications() {
    if (!this.showNotificationsIcon || this.hasLoadedNotifications) return;

    const states = ['ENC', 'ENT'];
    states.forEach((stateCode) => {
      this.tabStates[stateCode].loading = true;
    });

    this._notificationApi.getInitialNotifications().subscribe({
      next: (res) => {
        this.unreadNotifications = res.data.unreadCount;
        const notifs = res.data.notifications;
        states.forEach((stateCode) => {
          if (notifs[stateCode]) {
            this.tabStates[stateCode].data = notifs[stateCode].data;
            this.tabStates[stateCode].pagination = notifs[stateCode].pagination;
          }
          this.tabStates[stateCode].loading = false;
        });
        this.hasLoadedNotifications = true;
      },
      error: () => {
        states.forEach((stateCode) => {
          this.tabStates[stateCode].loading = false;
        });
      }
    });
  }

  private loadNotificationsForState(stateCode: string, page: number) {
    if (this.tabStates[stateCode].loading) return;

    this.tabStates[stateCode].loading = true;
    this._notificationApi
      .getNotifications({ stateCode, page, perPage: 10 })
      .subscribe({
        next: (res) => {
          if (page === 1) {
            this.tabStates[stateCode].data = res.data;
          } else {
            this.tabStates[stateCode].data = [
              ...this.tabStates[stateCode].data,
              ...res.data
            ];
          }
          this.tabStates[stateCode].pagination = res.pagination;
          this.tabStates[stateCode].loading = false;
        },
        error: () => {
          this.tabStates[stateCode].loading = false;
        }
      });
  }

  onScroll(event: Event, stateCode: string) {
    const target = event.target as HTMLElement;
    if (
      target.scrollTop + target.clientHeight >= target.scrollHeight - 10 &&
      !this.tabStates[stateCode].loading &&
      this.tabStates[stateCode].pagination?.hasNextPage
    ) {
      const nextPage = (this.tabStates[stateCode].pagination?.page || 1) + 1;
      this.loadNotificationsForState(stateCode, nextPage);
    }
  }

  private updateGlobalUnreadCount() {
    this._notificationApi.getUnreadCount().subscribe((res) => {
      this.unreadNotifications = res.data.count;
    });
  }

  markAllRead() {
    this._notificationApi.markAllAsRead().subscribe(() => {
      Object.values(this.tabStates).forEach((state) => {
        state.data.forEach((n) => (n.read = true));
      });
      this.updateGlobalUnreadCount();
    });
  }

  markAllUnread() {
    this._notificationApi.markAllAsUnread().subscribe(() => {
      Object.values(this.tabStates).forEach((state) => {
        state.data.forEach((n) => (n.read = false));
      });
      this.updateGlobalUnreadCount();
    });
  }

  private playNotificationSound() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      const AudioContext = w.AudioContext || w.webkitAudioContext;
      if (!AudioContext) return;

      const audioCtx = new AudioContext();

      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(1046.5, audioCtx.currentTime);

      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioCtx.currentTime + 0.5
      );

      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      console.warn('AudioContext playback failed', e);
    }
  }

  private handleLiveNotification(liveUpdate: OrderUpdate) {
    if (!this.showNotificationsIcon) return;

    if (
      liveUpdate.stateCode &&
      !['ENC', 'ENT'].includes(liveUpdate.stateCode.toUpperCase())
    ) {
      return;
    }

    this.playNotificationSound();

    const newNotif: OrderNotification = {
      notificationId: liveUpdate.notificationId || Math.random().toString(),
      title: 'Actualización de Orden',
      message: `La orden de la mesa ${liveUpdate.tableNumber || 'N/A'} cambió a ${liveUpdate.state}.`,
      read: false,
      type: 'ORDER_STATE_CHANGED',
      metadata: {
        invoiceId: liveUpdate.invoiceId,
        code: liveUpdate.code,
        tableNumber: liveUpdate.tableNumber,
        state: liveUpdate.state,
        stateCode: liveUpdate.stateCode,
        orderTime: liveUpdate.orderTime
          ? String(liveUpdate.orderTime)
          : undefined,
        readyTime: liveUpdate.readyTime
          ? String(liveUpdate.readyTime)
          : undefined,
        servedTime: liveUpdate.servedTime
          ? String(liveUpdate.servedTime)
          : undefined
      },
      createdAt: new Date()
    };

    const stateCode = liveUpdate.stateCode.toUpperCase();
    if (this.tabStates[stateCode]) {
      this.tabStates[stateCode].data = [
        newNotif,
        ...this.tabStates[stateCode].data
      ];
      if (this.tabStates[stateCode].pagination) {
        this.tabStates[stateCode].pagination!.total += 1;
      }
    }

    this.updateGlobalUnreadCount();
  }

  private checkRolesForNotifications() {
    if (!this.userInfo?.roleType?.name || !this.showNotificationsIcon) {
      this.hasLoadedNotifications = false;
      this.hasJoinedSocketRoom = false;
      return;
    }

    if (this.userInfo.userId && !this.hasJoinedSocketRoom) {
      this._ordersSocket.joinUserRoom(this.userInfo.userId);
      this.hasJoinedSocketRoom = true;
    }

    this.loadNotifications();
  }

  toggleRead(event: Event, notif: OrderNotification) {
    event.stopPropagation();
    this._notificationApi.toggleRead(notif.notificationId).subscribe((res) => {
      notif.read = res.data.read;
      this.updateGlobalUnreadCount();
    });
  }

  deleteNotification(event: Event, notif: OrderNotification) {
    event.stopPropagation();
    this._notificationApi
      .deleteNotification(notif.notificationId)
      .subscribe(() => {
        const stateCode = notif.metadata?.stateCode?.toUpperCase();
        if (stateCode && this.tabStates[stateCode]) {
          this.tabStates[stateCode].data = this.tabStates[
            stateCode
          ].data.filter((n) => n.notificationId !== notif.notificationId);
          if (this.tabStates[stateCode].pagination) {
            this.tabStates[stateCode].pagination!.total = Math.max(
              0,
              this.tabStates[stateCode].pagination!.total - 1
            );
          }
        }
        this.updateGlobalUnreadCount();
      });
  }

  deleteAll() {
    this._notificationApi.deleteAll().subscribe(() => {
      Object.keys(this.tabStates).forEach((key) => {
        this.tabStates[key].data = [];
        if (this.tabStates[key].pagination) {
          this.tabStates[key].pagination!.total = 0;
        }
      });
      this.updateGlobalUnreadCount();
    });
  }

  goToOrder(notif: OrderNotification) {
    if (notif.metadata?.invoiceId) {
      this._router.navigate([
        `/recipes/restaurant-order/${notif.metadata.invoiceId}/edit`
      ]);
    }
  }
}
