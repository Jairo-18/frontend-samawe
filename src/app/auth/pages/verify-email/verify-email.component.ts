import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RegisterService } from '../../services/register.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { ButtonLandingComponent } from '../../../shared/components/button-landing/button-landing.component';
import { TranslateModule } from '@ngx-translate/core';
import { LangService } from '../../../shared/services/lang.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [
    RouterModule,
    LoaderComponent,
    ButtonLandingComponent,
    TranslateModule
  ],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.scss'
})
export class VerifyEmailComponent implements OnInit {
  private readonly _route: ActivatedRoute = inject(ActivatedRoute);
  private readonly _router: Router = inject(Router);
  private readonly _registerService: RegisterService = inject(RegisterService);
  private readonly _langService = inject(LangService);

  state: 'loading' | 'success' | 'error' = 'loading';
  errorMessage: string = 'verify_email.error_msg';

  ngOnInit(): void {
    const token = this._route.snapshot.queryParamMap.get('token');
    const userId = this._route.snapshot.queryParamMap.get('userId');

    if (!token || !userId) {
      this.state = 'error';
      return;
    }

    this._registerService.verifyEmail(token, userId).subscribe({
      next: () => {
        this.state = 'success';
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'verify_email.error_msg';
        this.state = 'error';
      }
    });
  }

  goToLogin(): void {
    this._router.navigateByUrl(this._langService.route('auth/login'));
  }
}
