import { Component, inject, Input, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  GoogleBusinessService,
  GoogleBusinessStatus,
  GoogleBusinessAccount,
  GoogleBusinessLocation,
} from '../../services/google-business.service';
import { NotificationsService } from '../../../shared/services/notifications.service';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-organizational-google-business',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './organizational-google-business.component.html',
})
export class OrganizationalGoogleBusinessComponent implements OnInit {
  @Input() organizationalId!: string;
  @Input() successFromCallback: boolean = false;

  private readonly _gbService = inject(GoogleBusinessService);
  private readonly _notifications = inject(NotificationsService);
  private readonly _platformId = inject(PLATFORM_ID);

  status: GoogleBusinessStatus | null = null;
  loading: boolean = true;
  accounts: GoogleBusinessAccount[] = [];
  locations: GoogleBusinessLocation[] = [];
  loadingAccounts: boolean = false;
  loadingLocations: boolean = false;
  selectedAccount: string = '';
  selectedLocation: string = '';
  saving: boolean = false;
  disconnecting: boolean = false;

  ngOnInit(): void {
    this._loadStatus();
    if (this.successFromCallback) {
      this._notifications.showNotification('success', 'Google Business conectado correctamente');
    }
  }

  private _loadStatus(): void {
    this.loading = true;
    this._gbService.getStatus(this.organizationalId).subscribe({
      next: (res) => {
        this.status = res.data;
        this.loading = false;
        if (this.status?.connected && !this.status.locationName) {
          this._loadAccounts();
        }
      },
      error: () => { this.loading = false; },
    });
  }

  connect(): void {
    if (!isPlatformBrowser(this._platformId)) return;
    this._gbService.getOAuthUrl(this.organizationalId).subscribe({
      next: (res) => { window.location.href = res.data.url; },
    });
  }

  private _loadAccounts(): void {
    this.loadingAccounts = true;
    this._gbService.getAccounts(this.organizationalId).subscribe({
      next: (res) => {
        this.accounts = res.data;
        this.loadingAccounts = false;
        if (this.accounts.length === 1) {
          this.selectedAccount = this.accounts[0].name;
          this._loadLocations(this.selectedAccount);
        }
      },
      error: () => { this.loadingAccounts = false; },
    });
  }

  onAccountChange(accountName: string): void {
    this.selectedAccount = accountName;
    this.selectedLocation = '';
    this.locations = [];
    if (accountName) this._loadLocations(accountName);
  }

  private _loadLocations(accountName: string): void {
    this.loadingLocations = true;
    this._gbService.getLocations(this.organizationalId, accountName).subscribe({
      next: (res) => {
        this.locations = res.data;
        this.loadingLocations = false;
        if (this.locations.length === 1) {
          this.selectedLocation = this.locations[0].name;
        }
      },
      error: () => { this.loadingLocations = false; },
    });
  }

  saveLocation(): void {
    if (!this.selectedAccount || !this.selectedLocation) return;
    this.saving = true;
    this._gbService
      .saveLocation(this.organizationalId, this.selectedAccount, this.selectedLocation)
      .subscribe({
        next: () => {
          this._notifications.showNotification('success', 'Ubicación guardada correctamente');
          this.saving = false;
          this._loadStatus();
        },
        error: () => { this.saving = false; },
      });
  }

  disconnect(): void {
    this.disconnecting = true;
    this._gbService.disconnect(this.organizationalId).subscribe({
      next: () => {
        this._notifications.showNotification('success', 'Google Business desconectado');
        this.disconnecting = false;
        this.status = { connected: false, accountName: null, locationName: null };
        this.accounts = [];
        this.locations = [];
        this.selectedAccount = '';
        this.selectedLocation = '';
      },
      error: () => { this.disconnecting = false; },
    });
  }

  get locationLabel(): string {
    if (!this.status?.locationName) return '';
    return this.status.locationName.split('/').pop() ?? this.status.locationName;
  }
}
