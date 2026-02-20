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
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ActivatedRoute, Router } from '@angular/router';
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
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { UserInterface } from '../../../shared/interfaces/user.interface';
import { UppercaseDirective } from '../../../shared/directives/uppercase.directive';
import { debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';

@Component({
  selector: 'app-create-or-edit-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatAutocompleteModule,
    NgFor,
    MatButtonModule,
    FontAwesomeModule,
    MatIcon,
    BasePageComponent,
    LoaderComponent,
    UppercaseDirective
  ],
  templateUrl: './create-or-edit-users.component.html',
  styleUrl: './create-or-edit-users.component.scss'
})
export class CreateOrEditUsersComponent implements OnInit {
  private readonly _usersService: UsersService = inject(UsersService);
  private readonly _relatedDataService: RelatedDataService =
    inject(RelatedDataService);
  private readonly _customValidations: CustomValidationsService = inject(
    CustomValidationsService
  );
  private readonly _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
  private readonly _router: Router = inject(Router);
  private readonly _authService: AuthService = inject(AuthService);

  userForm: FormGroup;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  userId: string = '';
  identificationType: IdentificationType[] = [];
  roleType: RoleType[] = [];
  phoneCode: PhoneCode[] = [];
  filteredPhoneCodes: PhoneCode[] = [];
  isEditMode: boolean = false;
  loading: boolean = false;
  loadingPhoneCodes: boolean = false;
  userLogged?: UserInterface;

  constructor(private _fb: FormBuilder) {
    this.userForm = this._fb.group({
      roleTypeId: ['', Validators.required],
      identificationTypeId: ['', [Validators.required]],
      identificationNumber: ['', [Validators.required]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.email]],
      phoneCodeId: ['', Validators.required],
      phoneCodeSearch: [''],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{1,15}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
      isActive: [true, Validators.required]
    });
  }

  ngOnInit(): void {
    this.userLogged = this._authService.getUserLoggedIn();
    this.getRelatedData();
    this.setupPhoneCodeSearch();

    this.userId = this._activatedRoute.snapshot.params['id'];
    this.isEditMode = !!this.userId;

    if (this.isEditMode) {
      this.getUserToEdit(this.userId);
    }
  }

  getRelatedData(): void {
    this.loading = true;

    this._relatedDataService.getRelatedData().subscribe({
      next: (res) => {
        const allRoles = res.data?.roleType || [];

        const roleName = this.userLogged?.roleType?.name;

        if (roleName === 'Recepcionista' || roleName === 'RECEPCIONISTA') {
          this.roleType = allRoles.filter(
            (r) => r.name === 'Cliente' || r.name === 'CLIENTE'
          );
        } else if (
          roleName === 'Empleado' ||
          roleName === 'RECEPCIONISTA' ||
          roleName === 'recepcionista'
        ) {
          this.roleType = allRoles.filter(
            (r) => r.name === 'Cliente' || r.name === 'CLIENTE'
          );
        } else {
          this.roleType = allRoles;
        }

        this.identificationType = res.data?.identificationType || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar datos relacionados:', error);
        this.loading = false;
      }
    });
  }

  setupPhoneCodeSearch(): void {
    this.loadPhoneCodes('');

    this.userForm
      .get('phoneCodeSearch')
      ?.valueChanges.pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((searchTerm: string) => {
          if (typeof searchTerm !== 'string') {
            return of({ data: this.filteredPhoneCodes, meta: {} });
          }
          this.loadingPhoneCodes = true;
          return this._relatedDataService.searchPhoneCodes(searchTerm, 1, 20);
        })
      )
      .subscribe({
        next: (response) => {
          this.filteredPhoneCodes = response.data || [];
          this.loadingPhoneCodes = false;
        },
        error: (error) => {
          console.error('Error buscando códigos de país:', error);
          this.filteredPhoneCodes = [];
          this.loadingPhoneCodes = false;
        }
      });
  }

  loadPhoneCodes(search: string = ''): void {
    this.loadingPhoneCodes = true;
    this._relatedDataService.searchPhoneCodes(search, 1, 20).subscribe({
      next: (response) => {
        this.filteredPhoneCodes = response.data || [];
        this.loadingPhoneCodes = false;
      },
      error: (error) => {
        console.error('Error cargando códigos de país:', error);
        this.filteredPhoneCodes = [];
        this.loadingPhoneCodes = false;
      }
    });
  }

  displayPhoneCode(phoneCode: PhoneCode): string {
    return phoneCode ? `${phoneCode.code} ${phoneCode.name}` : '';
  }

  onPhoneCodeSelected(phoneCode: PhoneCode): void {
    if (phoneCode && phoneCode.phoneCodeId) {
      this.userForm.patchValue({
        phoneCodeId: phoneCode.phoneCodeId.toString()
      });
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
    this.loading = true;
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
          phoneCodeSearch: user.phoneCode,
          phone: user.phone,
          isActive: user.isActive
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al obtener usuario:', err.error?.message || err);
      }
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
        confirmPassword: formValue.identificationNumber,
        isActive: formValue.isActive
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

  onEmailInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.userForm
      .get('email')
      ?.setValue(input.value.toLowerCase(), { emitEvent: false });
  }
}
