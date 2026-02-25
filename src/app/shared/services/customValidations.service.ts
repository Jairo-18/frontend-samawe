import { Injectable } from '@angular/core';
import {
  AbstractControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms';
@Injectable({
  providedIn: 'root'
})
export class CustomValidationsService {
  passwordStrength(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = control.value;
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      const isValidLength = password?.length >= 6;
      if (!hasUpperCase || !hasLowerCase || !hasSpecialChar || !isValidLength) {
        return {
          passwordStrength:
            'La contraseña debe tener al menos 6 caracteres, una mayúscula, una minúscula y un carácter especial'
        };
      }
      return null;
    };
  }
  passwordsMatch(password: string, confirmPassword: string): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const pass = formGroup.get(password);
      const confirmPass = formGroup.get(confirmPassword);
      if (!pass?.value || !confirmPass?.value) {

        return { passwordMismatch: null };
      }
      if (pass.value !== confirmPass.value) {
        confirmPass.setErrors({ passwordMismatch: true });
        return { passwordMismatch: true };
      } else {
        confirmPass.setErrors(null);
        return null;
      }
    };
  }
  static PasswordMatch(
    controlName: string,
    matchingControlName: string
  ): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      if (!(formGroup instanceof FormGroup)) {
        return null;
      }
      const control = formGroup.controls[controlName];
      const matchingControl = formGroup.controls[matchingControlName];
      if (!control || !matchingControl) {
        return null;
      }
      if (matchingControl.errors && !matchingControl.errors['passwordMatch']) {
        return null;
      }
      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({
          ...matchingControl.errors,
          passwordMatch: true
        });
      } else {
        if (matchingControl.errors) {
          delete matchingControl.errors['passwordMatch'];
          if (Object.keys(matchingControl.errors).length === 0) {
            matchingControl.setErrors(null);
          }
        }
      }
      return null;
    };
  }
  static PasswordRegex(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      if (control?.value?.length < 8) {
        return null;
      }
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;
      return passwordRegex.test(control.value) ? null : { passwordRegex: true };
    };
  }
  lowercaseValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value && value !== value.toLowerCase()) {
      return { lowercase: true };
    }
    return null;
  }
}

