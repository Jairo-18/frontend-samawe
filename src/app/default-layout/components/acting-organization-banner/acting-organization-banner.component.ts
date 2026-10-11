import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../auth/services/auth.service';
import { ActingOrganization } from '../../../auth/interfaces/login.interface';

/**
 * Franja fija mientras el super administrador está DENTRO de otra organización:
 * todo lo que cree o edite queda en ella, así que tiene que verse siempre.
 */
@Component({
  selector: 'app-acting-organization-banner',
  standalone: true,
  imports: [MatIconModule, TranslateModule],
  template: `
    @if (acting) {
      <div
        role="status"
        class="sticky top-0 z-40 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-sm font-medium text-white bg-[var(--warning)]"
      >
        <mat-icon class="!text-base">visibility</mat-icon>
        <span>
          {{ 'sidebar.organization_switcher.banner' | translate: { name: acting.name } }}
        </span>
        <button
          type="button"
          class="underline font-bold disabled:opacity-60"
          [disabled]="switching || !homeId"
          (click)="backHome()"
        >
          {{ 'sidebar.organization_switcher.back' | translate }}
        </button>
      </div>
    }
  `
})
export class ActingOrganizationBannerComponent implements OnInit {
  private readonly _authService: AuthService = inject(AuthService);
  private readonly _platformId = inject(PLATFORM_ID);
  acting: ActingOrganization | null = null;
  homeId: string | null = null;
  switching = false;

  ngOnInit(): void {
    this.acting = this._authService.getActingOrganization();
    this.homeId = this._authService.getHomeOrganizationalId();
  }

  backHome(): void {
    if (!this.homeId || this.switching) return;
    this.switching = true;
    this._authService.switchOrganization(this.homeId).subscribe({
      next: () => {
        if (isPlatformBrowser(this._platformId)) {
          window.location.assign('/home');
        }
      },
      error: () => {
        this.switching = false;
      }
    });
  }
}
