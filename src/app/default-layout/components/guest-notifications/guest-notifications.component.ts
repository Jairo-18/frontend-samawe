import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  PLATFORM_ID,
  inject
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { NotificationApiService } from '../../../shared/services/notification-api.service';
import { OrdersSocketService } from '../../../shared/services/orders-socket.service';
import { LangService } from '../../../shared/services/lang.service';
import { UserInterface } from '../../../shared/interfaces/user.interface';
import { GuestNotification } from '../../../shared/interfaces/order-socket.interface';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';

const STATUS_ICON: Record<string, string> = {
  PENDING: 'hourglass_top',
  APPROVED: 'check_circle',
  EXPIRED: 'event_busy',
  CANCELLED: 'cancel'
};

/**
 * Avisos del huésped sobre su reserva (en espera, aprobada, vencida o no
 * aceptada), en una campana flotante justo debajo del navbar.
 *
 * A diferencia de la del personal: NO suena, no se pueden eliminar (solo marcar
 * como leídas) y el único aviso de que llegó algo nuevo es un gesto del número.
 * Siempre visible para el huésped; sin avisos, el panel lo dice.
 */
@Component({
  selector: 'app-guest-notifications',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    TranslateModule,
    RelativeTimePipe
  ],
  templateUrl: './guest-notifications.component.html',
  styleUrl: './guest-notifications.component.scss'
})
export class GuestNotificationsComponent implements OnChanges, OnDestroy {
  @Input() userInfo?: UserInterface;

  private readonly _api = inject(NotificationApiService);
  private readonly _socket = inject(OrdersSocketService);
  private readonly _router = inject(Router);
  private readonly _lang = inject(LangService);
  private readonly _elementRef = inject(ElementRef);
  private readonly _platformId = inject(PLATFORM_ID);

  list: GuestNotification[] = [];
  isOpen = false;
  /** Se enciende un instante cuando llega un aviso en vivo, para el gesto. */
  nudge = false;

  private _loadedFor: string | null = null;
  private _sub = new Subscription();
  private _nudgeTimer?: ReturnType<typeof setTimeout>;

  get unread(): number {
    return this.list.filter((n) => !n.read).length;
  }

  ngOnChanges(): void {
    const userId = this.userInfo?.userId;
    if (!userId || !isPlatformBrowser(this._platformId)) return;
    if (this._loadedFor === userId) return;
    this._loadedFor = userId;

    // Otra sesión en la misma pantalla: nada de los avisos ni de la
    // suscripción de la anterior debe sobrevivir.
    this.list = [];
    this.isOpen = false;
    this._sub.unsubscribe();
    this._sub = new Subscription();

    this._socket.joinUserRoom(userId);
    this._load();
    this._sub.add(
      this._socket.onGuestNotification().subscribe((n) => this._onLive(n))
    );
  }

  ngOnDestroy(): void {
    this._sub.unsubscribe();
    clearTimeout(this._nudgeTimer);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isOpen && !this._elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  toggle(event: Event): void {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
  }

  iconOf(n: GuestNotification): string {
    return STATUS_ICON[n.metadata?.status] ?? 'notifications';
  }

  toggleRead(event: Event, n: GuestNotification): void {
    event.stopPropagation();
    this._api.toggleRead(n.notificationId).subscribe((res) => {
      n.read = res.data.read;
    });
  }

  markAllRead(): void {
    this._api.markAllAsRead().subscribe(() => {
      this.list.forEach((n) => (n.read = true));
    });
  }

  /** Una reserva vencida o no aceptada ya no existe: solo las demás abren el detalle. */
  canOpen(n: GuestNotification): boolean {
    return ['PENDING', 'APPROVED'].includes(n.metadata?.status);
  }

  open(n: GuestNotification): void {
    if (!this.canOpen(n)) return;
    this.isOpen = false;
    this._router.navigateByUrl(
      this._lang.route(`user/invoices/${n.metadata.invoiceId}`)
    );
  }

  private _load(): void {
    this._api.getNotifications({ page: 1, perPage: 20 }).subscribe({
      next: (res) => {
        this.list = (res.data ?? []) as unknown as GuestNotification[];
      },
      error: () => {
        this.list = [];
      }
    });
  }

  private _onLive(n: GuestNotification): void {
    if (this.list.some((x) => x.notificationId === n.notificationId)) return;
    this.list = [n, ...this.list];
    this.nudge = true;
    clearTimeout(this._nudgeTimer);
    this._nudgeTimer = setTimeout(() => (this.nudge = false), 1600);
  }
}
