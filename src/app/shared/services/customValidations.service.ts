import { Injectable } from '@angular/core';
import {
  AbstractControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

@Injectable({
  providedIn: 'root',
})
export class CustomValidationsService {
  constructor() {}

  /**
   * Validator para checa el match de las contraseñas
   * @param controlName Nombre del control de la constraseña
   * @param matchingControlName Nombre del control de la confirmación de la constraseña
   * @returns null si los controles coinciden, de lo contrario retorna el error "passwordMatch"
   */
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
          passwordMatch: true,
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
}
