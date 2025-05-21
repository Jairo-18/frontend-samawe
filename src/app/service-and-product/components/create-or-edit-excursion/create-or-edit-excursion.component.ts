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
import {
  CategoryType,
  StateType
} from '../../../shared/interfaces/relatedDataServiceAndProduct.interface';
import {
  CreateExcursionPanel,
  ExcursionComplete
} from '../../interface/excursion.interface';
import { ExcursionsService } from '../../services/excursions.service';

@Component({
  selector: 'app-create-or-edit-excursion',
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
    CurrencyFormatDirective
  ],
  templateUrl: './create-or-edit-excursion.component.html',
  styleUrl: './create-or-edit-excursion.component.scss'
})
export class CreateOrEditExcursionComponent implements OnChanges {
  @Input() categoryTypes: CategoryType[] = [];
  @Input() stateTypes: StateType[] = [];
  @Input() currentExcursion?: ExcursionComplete;
  @Output() excursionSaved = new EventEmitter<void>();

  excursionForm: FormGroup;
  excursionId: number = 0;
  isEditMode: boolean = false;

  private readonly _excursionService: ExcursionsService =
    inject(ExcursionsService);
  private readonly _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
  private readonly _router: Router = inject(Router);

  constructor(private _fb: FormBuilder, private cdr: ChangeDetectorRef) {
    this.excursionForm = this._fb.group({
      categoryTypeId: [
        this.currentExcursion?.categoryType.categoryTypeId ?? null,
        Validators.required
      ],

      code: [this.currentExcursion?.code ?? '', Validators.required],
      name: [this.currentExcursion?.name ?? '', Validators.required],
      description: [
        this.currentExcursion?.description ?? '',
        Validators.maxLength(250)
      ],
      amountPerson: [
        this.currentExcursion?.amountPerson ?? 1,
        [Validators.required, Validators.pattern('^[0-9]+$'), Validators.min(1)]
      ],
      priceBuy: [
        this.currentExcursion?.priceBuy ?? 0.01,
        [
          Validators.required,
          Validators.pattern('^\\d+(\\.\\d{1,2})?$'),
          Validators.min(0.01)
        ]
      ],
      priceSale: [
        this.currentExcursion?.priceSale ?? 0.01,
        [
          Validators.required,
          Validators.pattern('^\\d+(\\.\\d{1,2})?$'),
          Validators.min(0.01)
        ]
      ],
      stateTypeId: [
        this.currentExcursion?.stateType?.stateTypeId ?? null,
        Validators.required
      ]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentExcursion']) {
      if (!this.currentExcursion) {
        const queryParams = this._activatedRoute.snapshot.queryParams;
        if (queryParams['editExcursion']) {
          this.excursionId = Number(queryParams['editExcursion']);
          this.isEditMode = true;
          this.getExcursionToEdit(this.excursionId);
        }
      } else {
        this.excursionId = this.currentExcursion.excursionId;
        this.excursionForm.patchValue(this.currentExcursion);
        this.isEditMode = true;
      }
    }
  }

  resetForm() {
    this.excursionForm.reset();
    Object.keys(this.excursionForm.controls).forEach((key) => {
      const control = this.excursionForm.get(key);
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

  private getExcursionToEdit(excursionId: number): void {
    this._excursionService.getExcursionEditPanel(excursionId).subscribe({
      next: (res) => {
        const excursion = res.data;
        // Aseguramos que el excursionId esté correctamente configurado
        this.excursionId = excursion.excursionId; // Asegúrate de que el excursionId se establezca aquí

        this.excursionForm.patchValue({
          categoryTypeId: excursion.categoryType?.categoryTypeId,
          code: excursion.code,
          name: excursion.name,
          description: excursion.description,
          amountPerson: excursion.amountPerson,
          priceBuy: excursion.priceBuy,
          priceSale: excursion.priceSale,
          stateTypeId: excursion.stateType?.stateTypeId
        });
      },
      error: (err) => {
        console.error(
          'Error al obtener la pasadía:',
          err.error?.message || err
        );
      }
    });
  }

  save() {
    if (this.excursionForm.valid) {
      const formValue = this.excursionForm.value;

      // Creamos un objeto base con todos los campos necesarios
      const excursionSave: CreateExcursionPanel = {
        excursionId: this.isEditMode ? this.excursionId : undefined,
        code: formValue.code,
        name: formValue.name,
        description: formValue.description,
        amountPerson: Math.trunc(Number(formValue.amountPerson)),
        priceBuy: Math.abs(Number(formValue.priceBuy)),
        priceSale: Math.abs(Number(formValue.priceSale)),
        categoryTypeId: formValue.categoryTypeId,
        stateTypeId: formValue.stateTypeId
      };

      if (this.isEditMode) {
        // Para actualizar, podemos quitar el excursionId del objeto que enviamos
        const updateData = { ...excursionSave };
        delete updateData.excursionId; // Lo quitamos para la actualización

        this._excursionService
          .updateExcursionPanel(this.excursionId, updateData)
          .subscribe({
            next: () => {
              this.excursionSaved.emit();
              this.resetForm();
            },
            error: (error) => {
              console.error('Error al actualizar la pasadía', error);
            }
          });
      } else {
        // Para crear, enviamos el objeto completo con excursionId = 0
        this._excursionService.createExcursionPanel(excursionSave).subscribe({
          next: () => {
            this.excursionSaved.emit();
            this.resetForm();
          },
          error: (err) => {
            if (err.error && err.error.message) {
              console.error(
                'Error al registrar la pasadía:',
                err.error.message
              );
            } else {
              console.error('Error desconocido:', err);
            }
          }
        });
      }
    } else {
      console.error('Formulario no válido', this.excursionForm);
      this.excursionForm.markAllAsTouched();
    }
  }
}
