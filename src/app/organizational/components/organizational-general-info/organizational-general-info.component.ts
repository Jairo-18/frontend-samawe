import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent
} from '@angular/material/autocomplete';
import { IdentificationType, PhoneCode } from '../../../shared/interfaces/relatedDataGeneral';
import { TranslateModule } from '@ngx-translate/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatedPipe } from '../../../shared/pipes/translated.pipe';
import { PaginationPartialService } from '../../../shared/services/paginationPartial.service';
import { PaginatedUserPartial } from '../../../shared/interfaces/paginatedPartial.interface';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  startWith,
  switchMap
} from 'rxjs';

/** Datos mínimos del representante legal para mostrar la selección actual. */
export interface LegalRepresentativePartial {
  userId: string;
  firstName?: string;
  lastName?: string;
  identificationNumber?: string;
  email?: string;
}

@Component({
  selector: 'app-organizational-general-info',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatAutocompleteModule,
    TranslateModule,
    MatTooltipModule,
    TranslatedPipe
  ],
  templateUrl: './organizational-general-info.component.html',
  styleUrls: ['./organizational-general-info.component.scss']
})
export class OrganizationalGeneralInfoComponent implements OnInit, OnChanges {
  @Input() form!: FormGroup;
  @Input() identificationTypes: IdentificationType[] = [];
  @Input() filteredPhoneCodes: PhoneCode[] = [];
  @Input() loadingPhoneCodes: boolean = false;
  /** Representante legal actualmente vinculado (para mostrarlo precargado). */
  @Input() legalRepresentative?: LegalRepresentativePartial | null;
  @Output() phoneCodeSelected = new EventEmitter<PhoneCode>();
  @Output() save = new EventEmitter<void>();

  private readonly _paginationPartialService: PaginationPartialService = inject(
    PaginationPartialService
  );

  /** Buscador del representante legal (separado del form principal). */
  legalRepSearchControl = new FormControl<
    string | PaginatedUserPartial | LegalRepresentativePartial
  >('');
  filteredReps: PaginatedUserPartial[] = [];
  isLoadingReps: boolean = false;

  ngOnInit(): void {
    this.setupLegalRepAutocomplete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Cuando llega el representante ya vinculado, se precarga en el buscador
    // sin disparar una búsqueda.
    if (changes['legalRepresentative'] && this.legalRepresentative) {
      this.legalRepSearchControl.setValue(this.legalRepresentative, {
        emitEvent: false
      });
    }
  }

  private setupLegalRepAutocomplete(): void {
    this.legalRepSearchControl.valueChanges
      .pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((value) => {
          const query =
            typeof value === 'string' ? value : this.displayRep(value);
          if (!query || query.length < 2) {
            this.isLoadingReps = false;
            return of([]);
          }
          this.isLoadingReps = true;
          return this._paginationPartialService
            .getUserPartial({ search: query.trim(), page: 1 })
            .pipe(
              map((response) => response.data || []),
              catchError(() => of([]))
            );
        })
      )
      .subscribe((reps) => {
        this.filteredReps = reps;
        this.isLoadingReps = false;
      });
  }

  /** Al enfocar (campo vacío) precarga usuarios, igual que el diálogo de factura. */
  onLegalRepFocus(): void {
    if (
      !this.filteredReps.length &&
      typeof this.legalRepSearchControl.value === 'string' &&
      !this.legalRepSearchControl.value
    ) {
      this.isLoadingReps = true;
      this._paginationPartialService
        .getUserPartial({ page: 1, perPage: 10 })
        .subscribe({
          next: (res) => {
            this.filteredReps = res.data || [];
            this.isLoadingReps = false;
          },
          error: () => {
            this.isLoadingReps = false;
          }
        });
    }
  }

  displayRep(user: PaginatedUserPartial | LegalRepresentativePartial | null): string {
    if (!user) return '';
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return user.identificationNumber
      ? `${name} (${user.identificationNumber})`
      : name;
  }

  onLegalRepSelected(event: MatAutocompleteSelectedEvent): void {
    const user = event.option.value as PaginatedUserPartial;
    this.form.patchValue({ legalRepresentativeUserId: user.userId });
  }

  clearLegalRep(): void {
    this.form.patchValue({ legalRepresentativeUserId: null });
    this.legalRepSearchControl.setValue('');
    this.filteredReps = [];
  }

  get isLegalRepSelected(): boolean {
    const val = this.legalRepSearchControl.value;
    return typeof val === 'object' && val !== null;
  }

  displayPhoneCode(phoneCode: PhoneCode): string {
    return phoneCode ? `${phoneCode.name} ${phoneCode.code}` : '';
  }

  onNameInput(): void {
    const name = this.form.get('name')?.value || '';
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');
    this.form.get('slug')?.setValue(slug);
  }

  get isPhoneCodeSelected(): boolean {
    const val = this.form.get('phoneCodeSearch')?.value;
    return typeof val === 'object' && val !== null;
  }

  clearPhoneCodeSelection(): void {
    this.form.patchValue({ phoneCodeId: '', phoneCodeSearch: '' });
  }
}
