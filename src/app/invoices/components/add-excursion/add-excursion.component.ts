import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  inject
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import {
  CategoryType,
  TaxeType
} from '../../../shared/interfaces/relatedDataGeneral';
import { InvoiceDetaillService } from '../../services/invoiceDetaill.service';
import { ExcursionsService } from '../../../service-and-product/services/excursions.service';
import { AddedExcursionInvoiceDetaill } from '../../interface/invoiceDetaill.interface';
import { debounceTime, of, switchMap } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-add-excursion',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatOptionModule,
    MatButtonModule,
    CommonModule,
    MatIcon,
    MatProgressSpinnerModule
  ],
  templateUrl: './add-excursion.component.html',
  styleUrl: './add-excursion.component.scss'
})
export class AddExcursionComponent {
  @Input() categoryTypes: CategoryType[] = [];
  @Input() taxeTypes: TaxeType[] = [];
  @Output() excursionAdded = new EventEmitter<void>();

  private readonly _excursionsService = inject(ExcursionsService);
  private readonly _invoiceDetaillService = inject(InvoiceDetaillService);
  private readonly route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private readonly _router: Router = inject(Router);

  form: FormGroup;
  isLoading = false;
  filteredExcursions: AddedExcursionInvoiceDetaill[] = [];

  constructor(private cdr: ChangeDetectorRef) {
    const now = new Date();
    const nowLocal = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    this.form = this.fb.group({
      excursionName: ['', Validators.required],
      excursionId: [null, Validators.required],
      price: [{ value: '', disabled: true }],
      amount: [1, [Validators.required, Validators.min(1)]],
      taxeTypeId: [null, Validators.required],
      startDate: [nowLocal, Validators.required],
      endDate: [nowLocal, Validators.required]
    });

    this.form
      .get('excursionName')
      ?.valueChanges.pipe(
        debounceTime(500),
        switchMap((name: string) => {
          if (!name || name.trim().length < 2) return of({ data: [] });
          return this._excursionsService.getExcursionWithPagination({ name });
        })
      )
      .subscribe((res) => {
        this.filteredExcursions = res.data ?? [];
      });
  }

  onExcursionFocus() {
    if (!this.filteredExcursions.length) {
      this._excursionsService
        .getExcursionWithPagination({})
        .subscribe((res) => {
          this.filteredExcursions = res.data ?? [];
        });
    }
  }

  onExcursionSelected(name: string) {
    const exc = this.filteredExcursions.find((e) => e.name === name);
    if (!exc) return;

    this.form.patchValue({
      excursionId: exc.excursionId,
      price: exc.priceSale,
      taxeTypeId: exc.taxeTypeId
    });
  }

  private getInvoiceIdFromRoute(route: ActivatedRoute): string | null {
    let current = route;
    while (current) {
      const id = current.snapshot.paramMap.get('id');
      if (id) return id;
      current = current.parent!;
    }
    return null;
  }

  resetForm() {
    const now = new Date();
    const nowLocal = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    this.form.reset();
    Object.keys(this.form.controls).forEach((key) => {
      const control = this.form.get(key);
      control?.setErrors(null);
    });

    this.form.patchValue({
      amount: 1,
      startDate: nowLocal,
      endDate: nowLocal
    });

    this._router.navigate([], {
      queryParams: {},
      queryParamsHandling: '',
      replaceUrl: true
    });

    this.cdr.detectChanges();
  }

  addExcursion() {
    if (this.form.valid) {
      const invoiceId = this.getInvoiceIdFromRoute(this.route);
      if (!invoiceId) {
        console.error('Invoice ID not found!');
        return;
      }
      this.isLoading = true;
      const f = this.form.getRawValue();
      const payload = {
        productId: 0,
        accommodationId: 0,
        excursionId: f.excursionId,
        amount: f.amount,
        priceBuy: f.priceBuy,
        priceWithoutTax: Number(f.price),
        taxeTypeId: f.taxeTypeId,
        startDate: new Date(f.startDate).toISOString(),
        endDate: new Date(f.endDate).toISOString()
      };

      this._invoiceDetaillService
        .createInvoiceDetaill(+invoiceId, payload)
        .subscribe({
          next: () => {
            this.isLoading = false;
            this.excursionAdded.emit();
            this.resetForm();
          },
          error: (err) => {
            this.isLoading = false;
            console.error('Error al agregar detalle:', err);
          }
        });
    } else {
      console.log('Formulario inválido');
      this.form.markAllAsTouched();
    }
  }
}
