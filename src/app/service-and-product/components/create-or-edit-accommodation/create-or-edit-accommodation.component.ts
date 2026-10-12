import { AccommodationComplete } from './../../interface/accommodation.interface';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { CurrencyFormatDirective } from '../../../shared/directives/currency-format.directive';
import {
  AccommodationRate,
  CreateAccommodationPanel
} from '../../interface/accommodation.interface';
import { AccommodationsService } from '../../services/accommodations.service';
import {
  BedType,
  CategoryType,
  StateType,
  TaxeType
} from '../../../shared/interfaces/relatedDataGeneral';
import { SectionHeaderComponent } from '../../../shared/components/section-header/section-header.component';
import { UppercaseDirective } from '../../../shared/directives/uppercase.directive';
import { NormalizeTitleDirective } from '../../../shared/directives/normalize-title.directive';
import { ImageUploaderComponent } from '../../../shared/components/image-uploader/image-uploader.component';
import { ImageItem } from '../../../shared/interfaces/image.interface';
import { TranslateModule } from '@ngx-translate/core';
import { TranslatedPipe } from '../../../shared/pipes/translated.pipe';
import { CapitalizePipe } from '../../../shared/pipes/capitalize.pipe';
@Component({
  selector: 'app-create-or-edit-accommodation',
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
    MatIconModule,
    CurrencyFormatDirective,
    SectionHeaderComponent,
    UppercaseDirective,
    NormalizeTitleDirective,
    ImageUploaderComponent,
    TranslateModule,
    TranslatedPipe,
    CapitalizePipe
  ],
  templateUrl: './create-or-edit-accommodation.component.html',
  styleUrl: './create-or-edit-accommodation.component.scss'
})
export class CreateOrEditAccommodationComponent
  implements OnChanges, OnDestroy
{
  @Input() stateTypes: StateType[] = [];
  @Input() bedTypes: BedType[] = [];
  @Input() taxeTypes: TaxeType[] = [];
  @Input() currentAccommodation?: AccommodationComplete;
  @Output() accommodationSaved = new EventEmitter<void>();
  @Output() accommodationCanceled = new EventEmitter<void>();
  @ViewChild('imageUploader') imageUploader!: ImageUploaderComponent;
  @Input()
  set categoryTypes(value: CategoryType[]) {
    this._categoryTypes = value;
    this.visibleCategoryTypes = value
      .filter((c) => ['Hospedaje', 'HOSPEDAJE'].includes(c.name?.['es'] ?? ''))
      .sort((a, b) => (a.name?.['es'] ?? '').localeCompare(b.name?.['es'] ?? ''));
    if (this.currentAccommodation && this.visibleCategoryTypes.length > 0) {
      this.updateFormWithAccommodation(this.currentAccommodation);
    }
    if (this.pendingAccommodationId && this.visibleCategoryTypes.length > 0) {
      this.getAccommodationToEdit(this.pendingAccommodationId);
      this.pendingAccommodationId = null;
    }
    this.cdr.detectChanges();
  }
  get categoryTypes(): CategoryType[] {
    return this._categoryTypes;
  }
  private _categoryTypes: CategoryType[] = [];
  visibleCategoryTypes: CategoryType[] = [];
  accommodationForm!: FormGroup;
  accommodationId: number = 0;
  isEditMode: boolean = false;
  accommodationImages: ImageItem[] = [];
  isLoadingImages: boolean = false;
  isSaving: boolean = false;
  private pendingAccommodationId: number | null = null;
  private readonly _accommodationService: AccommodationsService = inject(
    AccommodationsService
  );
  private readonly _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
  private readonly _router: Router = inject(Router);
  constructor(
    private _fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeForm();
  }
  private initializeForm(): void {
    this.accommodationForm = this._fb.group({
      categoryTypeId: [null, Validators.required],
      bedTypeId: [null, Validators.required],
      code: ['', Validators.required],
      nameEs: ['', Validators.required],
      descriptionEs: ['', Validators.maxLength(500)],
      amountPerson: [
        1,
        [Validators.required, Validators.pattern('^[0-9]+$'), Validators.min(1)]
      ],
      jacuzzi: [false, Validators.required],
      amountRoom: [
        0,
        [Validators.required, Validators.pattern('^[0-9]+$'), Validators.min(0)]
      ],
      amountBathroom: [
        0,
        [Validators.required, Validators.pattern('^[0-9]+$'), Validators.min(0)]
      ],
      priceBuy: [
        0,
        [Validators.pattern(/^\d+(\.\d{1,2})?$/), Validators.min(0.0)]
      ],
      priceSale: [
        0,
        [Validators.pattern(/^\d+(\.\d{1,2})?$/), Validators.min(0.0)]
      ],
      extraPersonPrice: [
        0,
        [Validators.pattern(/^\d+(\.\d{1,2})?$/), Validators.min(0.0)]
      ],
      hasMotorcycleParking: [false],
      hasCarParking: [false],
      rates: this._fb.array([]),
      stateTypeId: [2, [Validators.required]],
      taxeTypeId: [1, [Validators.required]]
    });
    // La tarifa de 24 h ES el precio de venta (el que usa la factura): editar
    // uno actualiza el otro, para que guardar no pise el cambio con el valor viejo.
    this.accommodationForm.get('priceSale')!.valueChanges.subscribe((price) => {
      const base = this._rateGroup(CreateOrEditAccommodationComponent.BASE_RATE_HOURS);
      if (base && Number(base.get('price')!.value) !== Number(price)) {
        base.get('price')!.setValue(price, { emitEvent: false });
      }
    });
    this.rates.valueChanges.subscribe(() => {
      const base = this._rateGroup(CreateOrEditAccommodationComponent.BASE_RATE_HOURS);
      const priceSale = this.accommodationForm.get('priceSale')!;
      if (base && Number(base.get('price')!.value) !== Number(priceSale.value)) {
        priceSale.setValue(base.get('price')!.value, { emitEvent: false });
      }
    });
  }

  /** Horas de la tarifa que equivale al precio de venta. */
  static readonly BASE_RATE_HOURS = 24;
  /** Tiempos que maneja un motel; se puede escribir cualquier otro. */
  readonly suggestedRateHours = [4, 8, 12, 16, 20, 24];

  get rates(): FormArray {
    return this.accommodationForm.get('rates') as FormArray;
  }

  private _newRate(rate?: Partial<AccommodationRate>): FormGroup {
    return this._fb.group({
      hours: [rate?.hours ?? null, [Validators.required, Validators.min(1), Validators.max(72)]],
      price: [rate?.price ?? 0, [Validators.required, Validators.min(0)]]
    });
  }

  private _rateGroup(hours: number): FormGroup | undefined {
    return this.rates.controls.find(
      (c) => Number(c.get('hours')!.value) === hours
    ) as FormGroup | undefined;
  }

  private _setRates(rates: AccommodationRate[]): void {
    this.rates.clear({ emitEvent: false });
    for (const r of [...rates].sort((a, b) => a.hours - b.hours)) {
      this.rates.push(this._newRate(r), { emitEvent: false });
    }
  }

  /** Agrega una fila con el siguiente tiempo sugerido que falte. */
  addRate(): void {
    const used = new Set(this.rates.controls.map((c) => Number(c.get('hours')!.value)));
    const next = this.suggestedRateHours.find((h) => !used.has(h)) ?? null;
    this.rates.push(this._newRate({ hours: next ?? undefined }));
    this.rates.markAsDirty();
  }

  removeRate(index: number): void {
    this.rates.removeAt(index);
    this.rates.markAsDirty();
  }

  /** Dos filas con las mismas horas: el backend lo rechaza, se avisa antes. */
  get hasDuplicateRateHours(): boolean {
    const hours = this.rates.controls.map((c) => Number(c.get('hours')!.value));
    return new Set(hours).size !== hours.length;
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentAccommodation']) {
      const queryParams = this._activatedRoute.snapshot.queryParams;
      if (this.currentAccommodation) {
        this.accommodationId = this.currentAccommodation.accommodationId;
        this.isEditMode = true;
        if (this.visibleCategoryTypes.length > 0) {
          this.updateFormWithAccommodation(this.currentAccommodation);
        }
      } else if (queryParams['editAccommodation'] === 'true') {
        this.isEditMode = false;
        this.accommodationId = 0;
        this.resetFormToDefaults();
      } else if (!isNaN(+queryParams['editAccommodation'])) {
        this.accommodationId = Number(queryParams['editAccommodation']);
        this.isEditMode = true;
        if (this.visibleCategoryTypes.length > 0) {
          this.getAccommodationToEdit(this.accommodationId);
          this.imageUploader?.resetPending();
        } else {
          this.pendingAccommodationId = this.accommodationId;
        }
      }
    }
  }
  private updateFormWithAccommodation(
    accommodation: AccommodationComplete
  ): void {
    this.accommodationForm.patchValue({
      categoryTypeId: accommodation.categoryType?.categoryTypeId,
      bedTypeId: accommodation.bedType?.bedTypeId,
      code: accommodation.code,
      nameEs: accommodation.name?.['es'] ?? '',
      descriptionEs: accommodation.description?.['es'] ?? '',
      amountPerson: accommodation.amountPerson ?? 1,
      jacuzzi: accommodation.jacuzzi ?? false,
      amountRoom: accommodation.amountRoom ?? 0,
      amountBathroom: accommodation.amountBathroom ?? 0,
      priceBuy: accommodation.priceBuy,
      priceSale: accommodation.priceSale,
      extraPersonPrice: accommodation.extraPersonPrice ?? 0,
      hasMotorcycleParking: accommodation.hasMotorcycleParking ?? false,
      hasCarParking: accommodation.hasCarParking ?? false,
      stateTypeId: accommodation.stateType?.stateTypeId,
      taxeTypeId:
        accommodation.taxeType?.taxeTypeId ?? accommodation.taxeTypeId ?? null
    });
    this._setRates(accommodation.rates ?? []);
    this.accommodationImages = accommodation.images || [];
    this.cdr.detectChanges();
  }
  private resetFormToDefaults(): void {
    this.accommodationForm.reset({
      categoryTypeId: null,
      bedTypeId: null,
      code: '',
      nameEs: '',
      descriptionEs: '',
      amountPerson: 1,
      jacuzzi: false,
      amountRoom: 0,
      amountBathroom: 0,
      priceBuy: 0,
      priceSale: 0,
      extraPersonPrice: 0,
      hasMotorcycleParking: false,
      hasCarParking: false,
      stateTypeId: null,
      taxeTypeId: 1
    });
    this._setRates([]);
    this.accommodationImages = [];
    this.accommodationId = 0;
    if (this.imageUploader) {
      // `clear()` y no `resetPending()`: al cancelar hay que vaciar la galería
      // entera, no solo lo pendiente de subir.
      this.imageUploader.clear();
    }
    this.cdr.detectChanges();
  }
  resetForm() {
    this.resetFormToDefaults();
    // ⚠️ Ver el comentario largo en `create-or-edit-product.component.ts`:
    // `setErrors(null)` sin recálculo deja el formulario vacío y "válido".
    Object.keys(this.accommodationForm.controls).forEach((key) => {
      const control = this.accommodationForm.get(key);
      control?.setErrors(null);
      control?.updateValueAndValidity({ emitEvent: false });
    });
    this.isEditMode = false;
    this.accommodationCanceled.emit();
    this._router.navigate([], {
      queryParams: {},
      queryParamsHandling: '',
      replaceUrl: true
    });
    this.cdr.detectChanges();
  }
  private getAccommodationToEdit(accommodationId: number): void {
    this.isLoadingImages = true;
    this._accommodationService
      .getAccommodationEditPanel(accommodationId)
      .subscribe({
        next: (res) => {
          const accommodation = res.data;
          this.accommodationId = accommodation.accommodationId;
          this.updateFormWithAccommodation(accommodation);
          this.isLoadingImages = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(
            'Error al obtener hospedaje:',
            err.error?.message || err
          );
          this.isLoadingImages = false;
          this.cdr.detectChanges();
        }
      });
  }
  /**
   * Si hay algo que guardar. Ver el comentario largo en
   * `create-or-edit-product.component.ts`: se mira `dirty`, no `valid`, y la
   * galería se pregunta aparte porque tocar fotos no ensucia el `FormGroup`.
   */
  get canSave(): boolean {
    return (
      !this.isSaving &&
      (this.accommodationForm.dirty || !!this.imageUploader?.hasPendingChanges)
    );
  }

  save() {
    if (this.accommodationForm.valid && !this.hasDuplicateRateHours) {
      const formValue = this.accommodationForm.value;
      const nameObj: Record<string, string> = { es: formValue.nameEs };
      const descObj: Record<string, string> | undefined = formValue.descriptionEs?.trim()
        ? { es: formValue.descriptionEs.trim() }
        : undefined;
      const accommodationSave: CreateAccommodationPanel = {
        accommodationId: this.isEditMode ? this.accommodationId : undefined,
        code: formValue.code,
        name: nameObj,
        description: descObj,
        amountPerson: Math.trunc(Number(formValue.amountPerson)),
        jacuzzi: formValue.jacuzzi,
        amountRoom: Math.trunc(Number(formValue.amountRoom)),
        amountBathroom: Math.trunc(Number(formValue.amountBathroom)),
        priceBuy: Math.abs(Number(formValue.priceBuy)),
        priceSale: Math.abs(Number(formValue.priceSale)),
        extraPersonPrice: Math.abs(Number(formValue.extraPersonPrice ?? 0)),
        hasMotorcycleParking: !!formValue.hasMotorcycleParking,
        hasCarParking: !!formValue.hasCarParking,
        // Sin filas no se mandan: el backend deja (o crea) la de 24 h con el
        // precio de venta, que es lo que necesita un hotel como Samawe.
        rates: formValue.rates?.length
          ? formValue.rates.map((r: AccommodationRate) => ({
              hours: Math.trunc(Number(r.hours)),
              price: Math.abs(Number(r.price))
            }))
          : undefined,
        categoryTypeId: formValue.categoryTypeId,
        bedTypeId: formValue.bedTypeId,
        stateTypeId: formValue.stateTypeId,
        taxeTypeId: formValue.taxeTypeId ?? undefined
      };
      if (this.isEditMode) {
        const updateData = { ...accommodationSave };
        delete updateData.accommodationId;
        this.isSaving = true;
        this._accommodationService
          .updateAccommodationPanel(this.accommodationId, updateData)
          .subscribe({
            next: async () => {
              this.isSaving = false;
              if (this.imageUploader) {
                await this.imageUploader.applyChanges(this.accommodationId);
              }
              this.accommodationSaved.emit();
              this.resetForm();
            },
            error: (error) => {
              this.isSaving = false;
              console.error('Error al actualizar el hospedaje', error);
            }
          });
      } else {
        this.isSaving = true;
        this._accommodationService
          .createAccommodationPanel(accommodationSave)
          .subscribe({
            next: async (res) => {
              this.isSaving = false;
              const newId = Number(res.data?.rowId);
              if (newId && this.imageUploader) {
                await this.imageUploader.applyChanges(newId);
              }
              this.accommodationSaved.emit();
              this.resetForm();
            },
            error: (err) => {
              this.isSaving = false;
              if (err.error && err.error.message) {
                console.error(
                  'Error al registrar hospedaje:',
                  err.error.message
                );
              } else {
                console.error('Error desconocido:', err);
              }
            }
          });
      }
    } else {
      console.error('Formulario no válido', this.accommodationForm);
      this.accommodationForm.markAllAsTouched();
    }
  }
  ngOnDestroy(): void {
    this.resetForm();
  }
}
