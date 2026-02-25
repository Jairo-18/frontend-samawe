import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
@Injectable({
  providedIn: 'root'
})
export class CustomValidationsService {
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
  isLessThanToday(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      const inputDate = new Date(control.value);
      const today = new Date();
      inputDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      return inputDate < today ? { futureDate: true } : null;
    };
  }
  isLessThanOrEqualToday(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      const inputDate = new Date(control.value);
      const today = new Date();
      inputDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      return inputDate <= today ? { futureDate: true } : null;
    };
  }
  isDateInRange(minDate: Date, maxDate: Date = new Date()): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      const inputDate = new Date(control.value);
      inputDate.setHours(0, 0, 0, 0);
      minDate.setHours(0, 0, 0, 0);
      maxDate.setHours(0, 0, 0, 0);
      if (inputDate < minDate) {
        return { beforeMinDate: true };
      }
      if (inputDate > maxDate) {
        return { afterMaxDate: true };
      }
      return null;
    };
  }
}

