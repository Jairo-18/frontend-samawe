import { PhoneCode } from './../../../auth/interfaces/register.interface';
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
import {
  IdentificationType,
  RoleType
} from '../../../auth/interfaces/register.interface';
import { UsersService } from '../../services/users.service';
import { AuthService } from '../../../auth/services/auth.service';
import { RelatedDataService } from '../../../shared/services/relatedData.service';
import { CreateUserPanel } from '../../interfaces/create.interface';

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
    RouterLink
  ],
  templateUrl: './create-users-or-edit-users.component.html',
  styleUrl: './create-users-or-edit-users.component.scss'
})
export class CreateUsersOrEditUsersComponent implements OnInit {
  userForm: FormGroup;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  userId: string = '';
  user?: CreateUserPanel;
  identificationType: IdentificationType[] = [];
  roleType: RoleType[] = [];
  phoneCode: PhoneCode[] = [];

  private readonly _usersService: UsersService = inject(UsersService);
  private readonly _relatedDataService: RelatedDataService =
    inject(RelatedDataService);
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
      email: ['', [Validators.required, Validators.email]],
      phoneCodeId: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{1,15}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    this.getRelatedData();
    this.userId = this._activatedRoute.snapshot.params['id'];
    if (this.userId) this._getUserToEdit(this.userId);
  }

  private _getUserToEdit(userId: string): void {
    this._usersService.getUserProfile(userId).subscribe({
      next: (res) => {
        this.user = res.data;
        this._patchForm(this.user);
      },
      error: (err) => {
        if (err.error && err.error.message) {
          console.error('Error al obtener usuario:', err.error.message);
        } else {
          console.error('Error al obtener usuario:', err);
        }
      }
    });
  }

  private _patchForm(user: CreateUserPanel) {
    this.userForm.patchValue(user);
    this.setPassword();
  }

  /**
   * @param getRelatedData - Obtiene los tipos de identificación.
   */
  getRelatedData(): void {
    this._relatedDataService.createRelatedData().subscribe({
      next: (res) => {
        this.roleType = res.data?.roleType || [];
        this.identificationType = res.data?.identificationType || [];
        this.phoneCode = res.data?.phoneCode || [];
      },
      error: (error) =>
        console.error('Error al cargar datos relacionados:', error)
    });
  }

  setPassword() {
    const identificationValue = this.userForm.get('identification')?.value;
    if (identificationValue) {
      this.userForm.patchValue({
        password: identificationValue,
        passwordConfirmation: identificationValue
      });
    }
  }

  save() {
    if (this.userForm.valid) {
      const userToRegister: CreateUserPanel = {
        userId: uuid.v4(),
        roleType: this.userForm.value.roleTypeId,
        identificationType: this.userForm.value.identificationTypeId,
        identificationNumber: this.userForm.value.identificationNumber,
        firstName: this.userForm.value.firstName,
        lastName: this.userForm.value.lastName,
        email: this.userForm.value.email,
        phoneCode: this.userForm.value.phoneCodeId,
        phone: this.userForm.value.phone,
        password: this.userForm.value.password,
        confirmPassword: this.userForm.get('confirmPassword')?.value
      };

      this._usersService.createUser(userToRegister).subscribe({
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
    } else {
      console.error('Formulario no válido', this.userForm.errors);
      return this.userForm.markAllAsTouched();
    }
  }
}
