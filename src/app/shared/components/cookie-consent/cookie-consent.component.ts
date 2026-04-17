import { Component, OnInit, inject, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { ButtonLandingComponent } from '../button-landing/button-landing.component';
import { LocalStorageService } from '../../services/localStorage.service';

const COOKIE_CONSENT_KEY = '_cookieConsent';

@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule, ButtonLandingComponent],
  templateUrl: './cookie-consent.component.html',
  styleUrl: './cookie-consent.component.scss'
})
export class CookieConsentComponent implements OnInit {
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _localStorage: LocalStorageService = inject(LocalStorageService);
  visible = signal(false);

  ngOnInit(): void {
    if (!isPlatformBrowser(this._platformId)) return;
    const consent = this._localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      this.visible.set(true);
    }
  }

  accept(): void {
    this._localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    this.visible.set(false);
  }

  reject(): void {
    this._localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected');
    this.visible.set(false);
  }
}
