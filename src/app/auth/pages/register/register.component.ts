import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import * as uuid from 'uuid';
import { CustomValidationsService } from '../../../shared/validators/customValidations.service';
import { RegisterUser } from '../../interfaces/register.interface';
import { RegisterService } from '../../services/register.service';
import { RelatedDataService } from '../../../shared/services/relatedData.service';
import {
  IdentificationType,
  PersonType,
  PhoneCode
} from '../../../shared/interfaces/relatedDataGeneral';
import { ApplicationService } from '../../../organizational/services/application.service';
import { Subscription } from 'rxjs';
import { ButtonLandingComponent } from '../../../shared/components/button-landing/button-landing.component';
import { CapitalizePipe } from '../../../shared/pipes/capitalize.pipe';
import { NormalizeNameDirective } from '../../../shared/directives/normalize-name.directive';
import { NoSpacesDirective } from '../../../shared/directives/no-spaces.directive';
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    MatIconModule,
    FontAwesomeModule,
    MatButtonModule,
    CommonModule,
    RouterModule,
    MatStepperModule,
    MatSelectModule,
    MatAutocompleteModule,
    NgOptimizedImage,
    ButtonLandingComponent,
    CapitalizePipe,
    NormalizeNameDirective,
    NoSpacesDirective
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit, OnDestroy {
  @ViewChild('stepper') stepper!: MatStepper;
  formStep1: FormGroup;
  formStep2: FormGroup;
  currentStep: string = 'one';
  registered: boolean = false;
  registeredTitle: string = '¡Revisa tu correo!';
  registeredSubtitle: string =
    'Te enviamos un enlace de verificación. Haz clic en él para activar tu cuenta.';
  isSaving: boolean = false;
  eyeOpen = faEye;
  eyeClose = faEyeSlash;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  identificationType: IdentificationType[] = [];
  phoneCode: PhoneCode[] = [];
  filteredPhoneCodes: PhoneCode[] = [];
  loadingPhoneCodes: boolean = false;
  personType: PersonType[] = [];
  registerBgUrl: string = '';
  private _subscription: Subscription = new Subscription();
  private readonly _applicationService: ApplicationService =
    inject(ApplicationService);
  private readonly _registerService: RegisterService = inject(RegisterService);
  private readonly _router: Router = inject(Router);
  private readonly _relatedDataService: RelatedDataService =
    inject(RelatedDataService);
  private readonly _customValidations: CustomValidationsService = inject(
    CustomValidationsService
  );
  private readonly _passwordValidationService: CustomValidationsService =
    inject(CustomValidationsService);
  constructor(private _fb: FormBuilder) {
    this.formStep1 = this._fb.group({
      identificationTypeId: ['', Validators.required],
      identificationNumber: [
        '',
        [Validators.required, Validators.pattern(/^[a-zA-Z0-9-]+$/)]
      ],
      firstName: [
        '',
        [Validators.required, Validators.pattern(/^\S.*\S$|^\S$/)]
      ],
      lastName: [
        '',
        [Validators.required, Validators.pattern(/^\S.*\S$|^\S$/)]
      ],
      personTypeId: ['']
    });
    this.formStep2 = this._fb.group(
      {
        email: ['', [Validators.required, Validators.email, Validators.pattern(/^\S+$/)]],
        phoneCodeId: ['', Validators.required],
        phoneCodeSearch: [''],
        phone: ['', [Validators.required, Validators.pattern(/^[0-9]{1,15}$/)]],
        password: [
          '',
          [
            Validators.required,
            this._passwordValidationService.passwordStrength()
          ]
        ],
        confirmPassword: ['', [Validators.required]]
      },
      {
        validators: this._customValidations.passwordsMatch(
          'password',
          'confirmPassword'
        )
      }
    );
  }
  ngOnInit(): void {
    this.getRelatedData();
    this.loadRegisterBg();
    this.setupIdentificationTypeListener();
    this.setupPhoneCodeSearch();
    this.formStep2.get('confirmPassword')?.disable();
    this.formStep2.get('password')?.valueChanges.subscribe((value) => {
      if (!value) {
        this.formStep2.get('confirmPassword')?.disable();
      } else {
        this.formStep2.get('confirmPassword')?.enable();
      }
    });
  }
  setupPhoneCodeSearch(): void {
    this.formStep2
      .get('phoneCodeSearch')
      ?.valueChanges.pipe(debounceTime(150), distinctUntilChanged())
      .subscribe((term) => {
        if (typeof term !== 'string') return;
        const q = term.trim().toLowerCase();
        if (!q) {
          this.filteredPhoneCodes = this.phoneCode.slice(0, 20);
          return;
        }
        this.filteredPhoneCodes = this.phoneCode
          .filter(
            (pc) =>
              (pc.name || '').toLowerCase().includes(q) ||
              (pc.code || '').toLowerCase().includes(q)
          )
          .slice(0, 20);
      });
  }

  displayPhoneCode(phoneCode: PhoneCode): string {
    return phoneCode ? `${phoneCode.code} ${phoneCode.name}` : '';
  }

  onEmailInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.formStep2
      .get('email')
      ?.setValue(input.value.toLowerCase().replace(/\s/g, ''), { emitEvent: false });
  }

  onPhoneCodeBlur(): void {
    if (!this.formStep2.get('phoneCodeId')?.value) {
      this.formStep2.get('phoneCodeSearch')?.setErrors({ required: true });
      this.formStep2.get('phoneCodeSearch')?.markAsTouched();
    }
  }

  get isPhoneCodeSelected(): boolean {
    const val = this.formStep2.get('phoneCodeSearch')?.value;
    return typeof val === 'object' && val !== null;
  }

  onPhoneCodeSelected(phoneCode: PhoneCode): void {
    if (phoneCode?.phoneCodeId) {
      this.formStep2.patchValue({
        phoneCodeId: phoneCode.phoneCodeId.toString()
      });
      this.formStep2.get('phoneCodeSearch')?.setErrors(null);
    }
  }

  clearPhoneCodeSelection(): void {
    this.formStep2.patchValue({ phoneCodeId: '', phoneCodeSearch: '' });
    this.formStep2.get('phoneCodeSearch')?.setErrors(null);
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cleaned = input.value.replace(/\s/g, '');
    this.formStep2.get('phone')?.setValue(cleaned, { emitEvent: false });
  }

  getRelatedData(): void {
    this._relatedDataService.getRelatedData().subscribe({
      next: (res) => {
        this.identificationType = res.data?.identificationType || [];
        this.phoneCode = res.data?.phoneCode || [];
        this.personType = res.data?.personType || [];
        this.filteredPhoneCodes = this.phoneCode.slice(0, 20);
      }
    });
  }

  private setupIdentificationTypeListener(): void {
    this.formStep1
      .get('identificationTypeId')
      ?.valueChanges.subscribe((id: string) => {
        const selected = this.identificationType.find(
          (t) => t.identificationTypeId?.toString() === id
        );
        if (!selected) return;
        const isNit = selected.name?.toUpperCase().includes('NIT');
        const match = isNit
          ? this.personType.find(
              (p) =>
                p.name?.toUpperCase().includes('JUR\u00CDDICA') ||
                p.name?.toUpperCase().includes('JURIDICA')
            )
          : this.personType.find((p) =>
              p.name?.toUpperCase().includes('NATURAL')
            );
        if (match) {
          this.formStep1.patchValue(
            { personTypeId: match.personTypeId.toString() },
            { emitEvent: false }
          );
        }
      });
  }
  loadRegisterBg(): void {
    this._subscription.add(
      this._applicationService.mediaMap$.subscribe((mediaMap) => {
        if (mediaMap && mediaMap['REGISTER_BG']) {
          const bg = mediaMap['REGISTER_BG'];
          if (bg && bg.length > 0) {
            this.registerBgUrl = bg[0].url;
          }
        }
      })
    );
  }
  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }
  nextStep() {
    this.formStep1.markAllAsTouched();
    if (this.formStep1.valid) {
      this.currentStep = 'two';
      this.stepper.next();
    }
  }

  prevStep() {
    this.currentStep = 'one';
    this.stepper.previous();
  }
  save() {
    if (!this.formStep2.get('phoneCodeId')?.value) {
      this.formStep2.get('phoneCodeSearch')?.setErrors({ required: true });
    }
    this.formStep2.markAllAsTouched();
    if (this.formStep2.valid && this.formStep1.valid) {
      const userToRegister: RegisterUser = {
        userId: uuid.v4(),
        identificationType: this.formStep1.value.identificationTypeId,
        identificationNumber: this.formStep1.value.identificationNumber,
        firstName: this.formStep1.value.firstName,
        lastName: this.formStep1.value.lastName,
        email: this.formStep2.value.email,
        phoneCode: this.formStep2.value.phoneCodeId,
        phone: this.formStep2.value.phone,
        password: this.formStep2.value.password,
        confirmPassword: this.formStep2.get('confirmPassword')?.value,
        ...(this.formStep1.value.personTypeId && {
          personType: this.formStep1.value.personTypeId
        })
      };
      this.isSaving = true;
      this._registerService.registerUser(userToRegister).subscribe({
        next: () => {
          this.registered = true;
          this.isSaving = false;
        },
        error: (err) => {
          this.isSaving = false;
          const code = err?.error?.code;
          if (code === 'PENDING_VERIFICATION') {
            this.registeredTitle = '¡Ya tienes un registro pendiente!';
            this.registeredSubtitle =
              'Ya te enviamos un correo de verificación. Revísalo y haz clic en el enlace para activar tu cuenta.';
            this.registered = true;
          } else if (code === 'VERIFICATION_RESENT') {
            this.registeredTitle = '¡Te reenviamos el correo!';
            this.registeredSubtitle =
              'Tu enlace anterior había expirado. Te enviamos uno nuevo, revisa tu correo y haz clic en el enlace.';
            this.registered = true;
          }
        }
      });
    }
  }
  goToLogin(): void {
    this._router.navigate(['/auth/login']);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
}
