import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import * as uuid from 'uuid';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UsersService } from '../../services/users.service';
import { AuthService } from '../../../auth/services/auth.service';
import { RelatedDataService } from '../../../shared/services/relatedData.service';
import { CreateUserPanel } from '../../interfaces/create.interface';
import { CustomValidationsService } from '../../../shared/validators/customValidations.service';
import {
  IdentificationType,
  PhoneCode,
  RoleType
} from '../../../shared/interfaces/relatedDataGeneral';
import { BasePageComponent } from '../../../shared/components/base-page/base-page.component';

@Component({
  selector: 'app-create-users-or-edit-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    NgFor,
    MatButtonModule,
    FontAwesomeModule,
    MatIcon,
    RouterLink,
    BasePageComponent
  ],
  templateUrl: './create-users-or-edit-users.component.html',
  styleUrl: './create-users-or-edit-users.component.scss'
})
export class CreateUsersOrEditUsersComponent implements OnInit {
  userForm: FormGroup;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  userId: string = '';
  identificationType: IdentificationType[] = [];
  roleType: RoleType[] = [];
  phoneCode: PhoneCode[] = [];
  isEditMode: boolean = false;

  private readonly _usersService: UsersService = inject(UsersService);
  private readonly _relatedDataService: RelatedDataService =
    inject(RelatedDataService);
  private readonly _customValidations: CustomValidationsService = inject(
    CustomValidationsService
  );
  private readonly _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
  private readonly _router: Router = inject(Router);
  private readonly _authService: AuthService = inject(AuthService);

  constructor(private _fb: FormBuilder) {
    this.userForm = this._fb.group({
      roleTypeId: ['', Validators.required],
      identificationTypeId: ['', [Validators.required]],
      identificationNumber: ['', [Validators.required]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required]],
      phoneCodeId: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{1,15}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    this.getRelatedData();
    this.userId = this._activatedRoute.snapshot.params['id'];
    this.isEditMode = !!this.userId;

    if (this.isEditMode) {
      this.getUserToEdit(this.userId);
    }
  }

  setPassword() {
    const identificationValue = this.userForm.get(
      'identificationNumber'
    )?.value;
    if (identificationValue) {
      this.userForm.patchValue({
        password: identificationValue,
        confirmPassword: identificationValue
      });
    }
  }

  private getUserToEdit(userId: string): void {
    this._usersService.getUserEditPanel(userId).subscribe({
      next: (res) => {
        const user = res.data;

        this.userForm.patchValue({
          userId: user.userId,
          roleTypeId: user.roleType?.roleTypeId,
          identificationTypeId:
            user.identificationType?.identificationTypeId.toString(),
          identificationNumber: user.identificationNumber,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneCodeId: user.phoneCode?.phoneCodeId.toString(),
          phone: user.phone
        });
      },
      error: (err) => {
        console.error('Error al obtener usuario:', err.error?.message || err);
      }
    });
  }

  /**
   * @param getRelatedData - Obtiene los tipos de identificación.
   */
  getRelatedData(): void {
    this._relatedDataService.createUserRelatedData().subscribe({
      next: (res) => {
        this.roleType = res.data?.roleType || [];
        this.identificationType = res.data?.identificationType || [];
        this.phoneCode = res.data?.phoneCode || [];
      },
      error: (error) =>
        console.error('Error al cargar datos relacionados:', error)
    });
  }

  save() {
    if (this.userForm.get('identificationNumber')?.value) {
      this.setPassword();
    }
    if (this.userForm.valid) {
      const formValue = this.userForm.value;
      const userSave: CreateUserPanel = {
        userId: this.isEditMode ? this.userId : uuid.v4(),
        roleType: formValue.roleTypeId,
        identificationType: formValue.identificationTypeId,
        identificationNumber: formValue.identificationNumber,
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email,
        phoneCode: formValue.phoneCodeId,
        phone: formValue.phone,
        password: formValue.identificationNumber,
        confirmPassword: formValue.identificationNumber
      };
      if (this.userId) {
        if (this.userForm.invalid) return;
        delete userSave.userId;
        delete userSave.password;
        delete userSave.confirmPassword;
        this._usersService.updateUser(this.userId, userSave).subscribe({
          next: () => {
            this._router.navigateByUrl('/organizational/users/list');
          },
          error: (error) => {
            console.error('Error al actualizar el usuario', error);
          }
        });
      } else {
        this._usersService.createUser(userSave).subscribe({
          next: () => {
            this._router.navigateByUrl('/organizational/users/list');
          },
          error: (err) => {
            if (err.error && err.error.message) {
              console.error('Error al registrar usuario:', err.error.message);
            } else {
              console.error('Error desconocido:', err);
            }
          }
        });
      }
    } else {
      console.error('Formulario no válido', this.userForm);
      this.userForm.markAllAsTouched();
    }
  }
}
