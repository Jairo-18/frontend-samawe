import { AccommodationComplete } from './../../interface/accommodation.interface';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import {
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
import { CreateAccommodationPanel } from '../../interface/accommodation.interface';
import { AccommodationsService } from '../../services/accommodations.service';
import {
  BedType,
  CategoryType,
  StateType
} from '../../../shared/interfaces/relatedDataGeneral';
import { SectionHeaderComponent } from '../../../shared/components/section-header/section-header.component';

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
    SectionHeaderComponent
  ],
  templateUrl: './create-or-edit-accommodation.component.html',
  styleUrl: './create-or-edit-accommodation.component.scss'
})
export class CreateOrEditAccommodationComponent implements OnChanges {
  @Input() categoryTypes: CategoryType[] = [];
  @Input() stateTypes: StateType[] = [];
  @Input() bedTypes: BedType[] = [];
  @Input() currentAccommodation?: AccommodationComplete;
  @Output() accommodationSaved = new EventEmitter<void>();

  accommodationForm: FormGroup;
  accommodationId: number = 0;
  isEditMode: boolean = false;

  private readonly _accommodationService: AccommodationsService = inject(
    AccommodationsService
  );
  private readonly _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
  private readonly _router: Router = inject(Router);

  constructor(private _fb: FormBuilder, private cdr: ChangeDetectorRef) {
    this.accommodationForm = this._fb.group({
      categoryTypeId: [
        this.currentAccommodation?.categoryType.categoryTypeId ?? null,
        Validators.required
      ],
      bedTypeId: [
        this.currentAccommodation?.bedType.bedTypeId ?? null,
        Validators.required
      ],
      code: [this.currentAccommodation?.code ?? '', Validators.required],
      name: [this.currentAccommodation?.name ?? '', Validators.required],
      description: [
        this.currentAccommodation?.description ?? '',
        Validators.maxLength(250)
      ],
      amountPerson: [
        this.currentAccommodation?.amountPerson ?? 1,
        [Validators.required, Validators.pattern('^[0-9]+$'), Validators.min(1)]
      ],
      jacuzzi: [
        this.currentAccommodation?.jacuzzi ?? false,
        Validators.required
      ],
      amountRoom: [
        this.currentAccommodation?.amountRoom ?? 0,
        [Validators.required, Validators.pattern('^[0-9]+$'), Validators.min(0)]
      ],
      amountBathroom: [
        this.currentAccommodation?.amountBathroom ?? 0,
        [Validators.required, Validators.pattern('^[0-9]+$'), Validators.min(0)]
      ],
      priceBuy: [
        this.currentAccommodation?.priceBuy,
        [
          Validators.required,
          Validators.pattern(/^\d+(\.\d{1,2})?$/),
          Validators.min(0.01)
        ]
      ],
      priceSale: [
        this.currentAccommodation?.priceSale,
        [
          Validators.required,
          Validators.pattern(/^\d+(\.\d{1,2})?$/),
          Validators.min(0.01)
        ]
      ],
      stateTypeId: [
        this.currentAccommodation?.stateType?.stateTypeId ?? null,
        Validators.required
      ]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentAccommodation']) {
      if (!this.currentAccommodation) {
        const queryParams = this._activatedRoute.snapshot.queryParams;
        if (queryParams['editAccommodation']) {
          this.accommodationId = Number(queryParams['editAccommodation']);
          this.isEditMode = true;
          this.getProductToEdit(this.accommodationId);
        }
      } else {
        this.accommodationId = this.currentAccommodation.accommodationId;
        this.accommodationForm.patchValue(this.currentAccommodation);
        this.isEditMode = true;
      }
    }
  }

  resetForm() {
    this.accommodationForm.reset();
    Object.keys(this.accommodationForm.controls).forEach((key) => {
      const control = this.accommodationForm.get(key);
      control?.setErrors(null);
    });
    this.isEditMode = false;
    this._router.navigate(
      [], // La misma ruta actual (segmentos de ruta)
      {
        queryParams: {}, // Pasa un objeto vacío para eliminar los query parameters
        queryParamsHandling: '', // 'merge' es el comportamiento predeterminado, pero explícito por claridad
        replaceUrl: true // Importante: Reemplaza la URL actual en el historial sin recargar
      }
    );
    this.cdr.detectChanges();
  }

  private getProductToEdit(accommodationId: number): void {
    this._accommodationService
      .getAccommodationEditPanel(accommodationId)
      .subscribe({
        next: (res) => {
          const accommodation = res.data;
          // Aseguramos que el accommodationId esté correctamente configurado
          this.accommodationId = accommodation.accommodationId; // Asegúrate de que el accommodationId se establezca aquí

          this.accommodationForm.patchValue({
            categoryTypeId: accommodation.categoryType?.categoryTypeId,
            bedTypeId: accommodation.bedType?.bedTypeId,
            code: accommodation.code,
            name: accommodation.name,
            description: accommodation.description,
            amountPerson: accommodation.amountPerson,
            jacuzzi: accommodation.jacuzzi,
            amountRoom: accommodation.amountRoom,
            amountBathroom: accommodation.amountBathroom,
            priceBuy: accommodation.priceBuy,
            priceSale: accommodation.priceSale,
            stateTypeId: accommodation.stateType?.stateTypeId
          });
        },
        error: (err) => {
          console.error(
            'Error al obtener hospedaje:',
            err.error?.message || err
          );
        }
      });
  }

  save() {
    if (this.accommodationForm.valid) {
      const formValue = this.accommodationForm.value;

      // Creamos un objeto base con todos los campos necesarios
      const accommodationSave: CreateAccommodationPanel = {
        accommodationId: this.isEditMode ? this.accommodationId : undefined,
        code: formValue.code,
        name: formValue.name,
        description: formValue.description,
        amountPerson: Math.trunc(Number(formValue.amountPerson)),
        jacuzzi: formValue.jacuzzi,
        amountRoom: Math.trunc(Number(formValue.amountRoom)),
        amountBathroom: Math.trunc(Number(formValue.amountBathroom)),
        priceBuy: Math.abs(Number(formValue.priceBuy)),
        priceSale: Math.abs(Number(formValue.priceSale)),
        categoryTypeId: formValue.categoryTypeId,
        bedTypeId: formValue.bedTypeId,
        stateTypeId: formValue.stateTypeId
      };

      if (this.isEditMode) {
        // Para actualizar, podemos quitar el accommodationId del objeto que enviamos
        const updateData = { ...accommodationSave };
        delete updateData.accommodationId; // Lo quitamos para la actualización

        this._accommodationService
          .updateAccommodationPanel(this.accommodationId, updateData)
          .subscribe({
            next: () => {
              this.accommodationSaved.emit();
              this.resetForm();
              // this._router.navigateByUrl('/service-and-product/general');
            },
            error: (error) => {
              console.error('Error al actualizar el producto', error);
            }
          });
      } else {
        // Para crear, enviamos el objeto completo con accommodationId = 0
        this._accommodationService
          .createAccommodationPanel(accommodationSave)
          .subscribe({
            next: () => {
              this.accommodationSaved.emit();
              this.resetForm();
              // this._router.navigateByUrl('/service-and-product/general');
            },
            error: (err) => {
              if (err.error && err.error.message) {
                console.error(
                  'Error al registrar producto:',
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
}
