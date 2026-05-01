import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormControl
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent
} from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  of,
  catchError,
  map,
  startWith
} from 'rxjs';

import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { UppercaseDirective } from '../../../shared/directives/uppercase.directive';
import { PaginationPartialService } from '../../../shared/services/paginationPartial.service';
import { Router } from '@angular/router';
import {
  PaidType,
  PayType,
  StateType,
  AppRelatedData
} from '../../../shared/interfaces/relatedDataGeneral';
import { CreateUserPanel } from '../../../organizational/interfaces/create.interface';
import { PaginatedUserPartial } from '../../../shared/interfaces/paginatedPartial.interface';
import { InvoiceComplete } from '../../../invoices/interface/invoice.interface';
import { ApiResponseCreateInterface } from '../../../shared/interfaces/api-response.interface';
import { InvoiceService } from '../../../invoices/services/invoice.service';
import { RelatedDataService } from '../../../shared/services/relatedData.service';
import { SectionHeaderComponent } from '../../../shared/components/section-header/section-header.component';
import { TranslateModule } from '@ngx-translate/core';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-create-or-edit-order',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatOptionModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatIconModule,
    LoaderComponent,
    UppercaseDirective,
    SectionHeaderComponent,
    TranslateModule,
    MatTooltipModule
  ],
  templateUrl: './create-or-edit-order.component.html',
  styleUrls: ['./create-or-edit-order.component.scss']
})
export class CreateOrEditOrderComponent implements OnInit {
  form: FormGroup;
  stateTypes: StateType[] = [];
  paidTypes: PaidType[] = [];
  payTypes: PayType[] = [];
  tableOptions: number[] = Array.from({ length: 20 }, (_, i) => i + 1);
  filteredClients: PaginatedUserPartial[] = [];
  clientFilterControl = new FormControl<string | CreateUserPanel>('');
  isLoadingClients: boolean = false;
  isLoading: boolean = false;
  order!: InvoiceComplete;
  editMode: boolean = false;
  orderId?: number;

  private readonly _fb: FormBuilder = inject(FormBuilder);
  private readonly _invoiceService: InvoiceService = inject(InvoiceService);
  private readonly _paginationPartialService: PaginationPartialService = inject(
    PaginationPartialService
  );
  private readonly _router: Router = inject(Router);
  private readonly _relatedDataService: RelatedDataService =
    inject(RelatedDataService);

  constructor() {
    this.form = this._fb.group({
      userId: ['', Validators.required],
      observations: ['', [Validators.maxLength(500)]],
      paidTypeId: ['', Validators.required],
      payTypeId: ['', Validators.required],
      stateTypeId: ['', Validators.required],
      tableNumber: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadRelatedData();
    this.setupClientAutocomplete();
  }

  private loadRelatedData(): void {
    const cachedData = this._relatedDataService.relatedData();
    if (cachedData) {
      this.stateTypes = (cachedData.data.stateType || []).filter((type) =>
        [7, 9].includes(Number(type.stateTypeId))
      );
      this.paidTypes = cachedData.data.paidType || [];
      this.payTypes = cachedData.data.payType || [];
      this.setDefaultValues();
    } else {
      this._relatedDataService.getRelatedData().subscribe({
        next: (res: { data: AppRelatedData }) => {
          this.stateTypes = (res.data.stateType || []).filter((type) =>
            [7, 9].includes(Number(type.stateTypeId))
          );
          this.paidTypes = res.data.paidType || [];
          this.payTypes = res.data.payType || [];
          this.setDefaultValues();
        },
        error: (err: unknown) =>
          console.error('Error loading related data', err)
      });
    }
  }

  private setDefaultValues(): void {
    if (this.editMode) return;

    const defaultState = this.stateTypes.find(
      (s) => s.name?.toUpperCase() === 'EN COCINA'
    );
    const defaultPaid = this.paidTypes.find(
      (p) => p.name?.toUpperCase() === 'PENDIENTE'
    );
    const defaultPay = this.payTypes.find(
      (p) => p.name?.toUpperCase() === 'EFECTIVO'
    );

    if (defaultState && !this.form.get('stateTypeId')?.value) {
      this.form.patchValue({ stateTypeId: defaultState.stateTypeId });
    }
    if (defaultPaid && !this.form.get('paidTypeId')?.value) {
      this.form.patchValue({ paidTypeId: defaultPaid.paidTypeId });
    }
    if (defaultPay && !this.form.get('payTypeId')?.value) {
      this.form.patchValue({ payTypeId: defaultPay.payTypeId });
    }
  }

  private setupClientAutocomplete(): void {
    this.clientFilterControl.valueChanges
      .pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((value) => {
          const query =
            typeof value === 'string' ? value : this.displayClient(value);
          if (!query || query.length < 2) {
            this.isLoadingClients = false;
            return of([]);
          }
          this.isLoadingClients = true;
          return this._paginationPartialService
            .getUserPartial({ search: query.trim(), page: 1 })
            .pipe(
              map((response) => response.data || []),
              catchError(() => of([]))
            );
        })
      )
      .subscribe((clients) => {
        this.filteredClients = clients;
        this.isLoadingClients = false;
      });
  }

  onClientFocus(): void {
    if (
      !this.filteredClients.length &&
      typeof this.clientFilterControl.value === 'string' &&
      !this.clientFilterControl.value
    ) {
      this.isLoadingClients = true;
      this._paginationPartialService
        .getUserPartial({ page: 1, perPage: 5 })
        .subscribe({
          next: (res) => {
            this.filteredClients = res.data || [];
            this.isLoadingClients = false;
          },
          error: (err) => {
            console.error('Error loading initial clients:', err);
            this.isLoadingClients = false;
          }
        });
    }
  }

  onClientSelected(event: MatAutocompleteSelectedEvent): void {
    const client = event.option.value as CreateUserPanel;
    this.form.patchValue({ userId: client.userId });
  }

  clearClientSelection(): void {
    this.form.patchValue({ userId: '' });
    this.clientFilterControl.setValue('');
  }

  get showNoResultsMessage(): boolean {
    const value = this.clientFilterControl.value;
    const searchText = typeof value === 'string' ? value : '';
    return (
      !this.isLoadingClients &&
      this.filteredClients.length === 0 &&
      !!searchText &&
      searchText.length >= 2
    );
  }

  displayClient(client: CreateUserPanel | null): string {
    return client
      ? `${client.firstName || ''} ${client.lastName || ''}`.trim()
      : '';
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    if (this.editMode) {
      this.updateOrder();
    } else {
      this.createOrder();
    }
  }

  private updateOrder(): void {}

  private createOrder(): void {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-CA');

    const payload = {
      ...this.form.value,

      invoiceTypeId: 1,
      invoiceElectronic: false,
      startDate: formattedDate,
      endDate: formattedDate
    };

    this._invoiceService.createInvoice(payload).subscribe({
      next: (res: ApiResponseCreateInterface) => {
        this.isLoading = false;
        if (res.data?.rowId) {
          this._router.navigateByUrl(
            `/recipes/restaurant-order/${res.data.rowId}/edit`
          );
        }
      },
      error: (error: unknown) => {
        console.error('Error creating order:', error);
        this.isLoading = false;
      }
    });
  }

  get observationsLength(): number {
    return this.form.get('observations')?.value?.length || 0;
  }

  resetForm(): void {
    this.form.reset();
    this.clearClientSelection();
    this.editMode = false;
    this.orderId = undefined;
  }
}
