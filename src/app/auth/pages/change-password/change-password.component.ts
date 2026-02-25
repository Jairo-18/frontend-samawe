import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { CustomValidationsService } from '../../../shared/services/customValidations.service';
import { UsersService } from '../../../organizational/services/users.service';
@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    MatIcon,
    CommonModule
  ],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss'
})
export class ChangePasswordComponent implements OnInit {
  changePasswordForm: FormGroup;
  passwordMismatch = false;
  eyeOpen = faEye;
  eyeClose = faEyeSlash;
  showOldPassword: boolean = false;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  private readonly _usersService: UsersService = inject(UsersService);
  private readonly _router: Router = inject(Router);
  private readonly _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
  private readonly _customValidations: CustomValidationsService = inject(
    CustomValidationsService
  );
  private readonly _passwordValidationService: CustomValidationsService =
    inject(CustomValidationsService);
  constructor(private fb: FormBuilder) {
    this.changePasswordForm = this.fb.group(
      {
        userId: [''],
        resetToken: [''],
        newPassword: [
          '',
          [
            Validators.required,
            this._passwordValidationService.passwordStrength()
          ]
        ],
        confirmNewPassword: ['', Validators.required]
      },
      {
        validators: this._customValidations.passwordsMatch(
          'newPassword',
          'confirmNewPassword'
        )
      }
    );
  }
  ngOnInit(): void {
    const userId: string =
      this._activatedRoute.snapshot.paramMap.get('userId')!;
    const resetToken: string =
      this._activatedRoute.snapshot.queryParamMap.get('token')!;
    this.changePasswordForm.patchValue({ userId, resetToken });
  }
  onChangePassword(): void {
    const { userId, newPassword, confirmNewPassword, resetToken } =
      this.changePasswordForm.value;
    if (newPassword !== confirmNewPassword) {
      this.passwordMismatch = true;
      return;
    }
    this.passwordMismatch = false;
    this._usersService
      .recoveryPasswordByUserId({
        userId,
        newPassword,
        confirmNewPassword,
        resetToken
      })
      .subscribe({
        next: () => {
          this._router.navigate(['/auth/login']);
          this.changePasswordForm.reset();
        },
        error: (err) => {
          console.error('Error al cambiar la contraseña:', err);
        }
      });
  }
  toggleOldPasswordVisibility(): void {
    this.showOldPassword = !this.showOldPassword;
  }
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
}

