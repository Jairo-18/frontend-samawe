import { Component, OnInit, inject, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonLandingComponent } from '../button-landing/button-landing.component';
import { LocalStorageService } from '../../services/localStorage.service';
import { LangService } from '../../services/lang.service';

const COOKIE_CONSENT_KEY = '_cookieConsent';

@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule, ButtonLandingComponent, TranslateModule],
  templateUrl: './cookie-consent.component.html',
  styleUrl: './cookie-consent.component.scss'
})
export class CookieConsentComponent implements OnInit {
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _localStorage: LocalStorageService = inject(LocalStorageService);
  private readonly _langService: LangService = inject(LangService);

  visible = signal(false);

  get privacyRoute(): string {
    return this._langService.route('legal/privacity');
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this._platformId)) return;
    if (!this._localStorage.getItem(COOKIE_CONSENT_KEY)) {
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
