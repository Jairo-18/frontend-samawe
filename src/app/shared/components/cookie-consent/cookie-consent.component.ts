import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { ButtonLandingComponent } from '../button-landing/button-landing.component';

const COOKIE_CONSENT_KEY = '_cookieConsent';

@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule, ButtonLandingComponent],
  templateUrl: './cookie-consent.component.html',
  styleUrl: './cookie-consent.component.scss'
})
export class CookieConsentComponent implements OnInit {
  visible = signal(false);

  ngOnInit(): void {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      this.visible.set(true);
    }
  }

  accept(): void {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    this.visible.set(false);
  }

  reject(): void {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected');
    this.visible.set(false);
  }
}
