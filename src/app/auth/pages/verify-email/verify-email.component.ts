import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RegisterService } from '../../services/register.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { ButtonLandingComponent } from '../../../shared/components/button-landing/button-landing.component';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [RouterModule, LoaderComponent, ButtonLandingComponent],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.scss'
})
export class VerifyEmailComponent implements OnInit {
  private readonly _route: ActivatedRoute = inject(ActivatedRoute);
  private readonly _router: Router = inject(Router);
  private readonly _registerService: RegisterService = inject(RegisterService);

  state: 'loading' | 'success' | 'error' = 'loading';
  errorMessage: string = 'El enlace es inválido o ha expirado.';

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
        this.errorMessage =
          err?.error?.message || 'El enlace es inválido o ha expirado.';
        this.state = 'error';
      }
    });
  }

  goToLogin(): void {
    this._router.navigate(['/auth/login']);
  }
}
