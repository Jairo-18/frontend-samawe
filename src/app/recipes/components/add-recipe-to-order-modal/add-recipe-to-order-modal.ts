import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule
} from '@angular/material/dialog';
import { InvoiceService } from '../../../invoices/services/invoice.service';
import { InvoiceComplete } from '../../../invoices/interface/invoice.interface';
import { debounceTime, switchMap, of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { BaseDialogComponent } from '../../../shared/components/base-dialog/base-dialog.component';

@Component({
  selector: 'app-add-recipe-to-order-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    CommonModule,
    BaseDialogComponent
  ],
  templateUrl: './add-recipe-to-order-modal.html',
  styleUrl: './add-recipe-to-order-modal.scss'
})
export class AddRecipeToOrderModalComponent implements OnInit {
  invoices: InvoiceComplete[] = [];
  selectedInvoice: InvoiceComplete | null = null;
  searchForm: FormGroup;

  isLoadingInvoices: boolean = false;
  isSubmitting: boolean = false;

  constructor(
    private fb: FormBuilder,
    private invoiceService: InvoiceService,
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<AddRecipeToOrderModalComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { productId: number; productName: string }
  ) {
    this.searchForm = this.fb.group({
      search: [''],
      amount: [1, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.setupAutocomplete();
  }

  private fetchInitialInvoices(): void {
    this.isLoadingInvoices = true;
    this.invoiceService
      .getInvoiceWithPagination({ page: 1, perPage: 15, hasTable: true })
      .subscribe({
        next: (res) => {
          this.invoices = res.data || [];
          this.isLoadingInvoices = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.isLoadingInvoices = false;
          this.cdr.detectChanges();
        }
      });
  }

  private setupAutocomplete(): void {
    this.searchForm
      .get('search')
      ?.valueChanges.pipe(
        debounceTime(500),
        switchMap((value: string | InvoiceComplete) => {
          if (typeof value !== 'string') {
            return of({ data: this.invoices });
          }

          if (!value || value.trim().length < 1) {
            return of({ data: [] });
          }

          const query = value.trim();
          this.isLoadingInvoices = true;
          this.cdr.detectChanges();

          return this.invoiceService.getInvoiceWithPagination({
            page: 1,
            perPage: 15,
            hasTable: true,
            clientName: query
          });
        })
      )
      .subscribe({
        next: (res) => {
          this.invoices = res.data || [];
          if (this.selectedInvoice) {
            const stillExists = this.invoices.find(
              (i) => i.invoiceId === this.selectedInvoice?.invoiceId
            );
            if (!stillExists) {
              this.selectedInvoice = null;
            }
          }
          this.isLoadingInvoices = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.isLoadingInvoices = false;
          this.cdr.detectChanges();
        }
      });
  }

  onInvoiceFocus(): void {
    if (!this.invoices.length) {
      this.isLoadingInvoices = true;
      this.invoiceService
        .getInvoiceWithPagination({ page: 1, perPage: 15, hasTable: true })
        .subscribe((res) => {
          this.invoices = res.data || [];
          this.isLoadingInvoices = false;
          this.cdr.detectChanges();
        });
    }
  }

  displayInvoice(invoice: InvoiceComplete | null): string {
    if (!invoice) return '';
    const tableStr = invoice.tableNumber ? `Mesa ${invoice.tableNumber}` : '';
    const clientStr = invoice.user
      ? `${invoice.user.firstName} ${invoice.user.lastName}`.trim()
      : '';
    return `${tableStr} - ${clientStr}`;
  }

  onInvoiceSelected(invoice: InvoiceComplete): void {
    this.selectedInvoice = invoice;
    this.cdr.detectChanges();
  }

  clearInvoiceSelection(): void {
    this.selectedInvoice = null;
    this.searchForm.get('search')?.setValue('');
    this.invoices = [];
    this.cdr.detectChanges();
  }

  get showNoResultsMessage(): boolean {
    const value = this.searchForm.get('search')?.value;
    const searchText = typeof value === 'string' ? value : '';
    return (
      !this.isLoadingInvoices && this.invoices.length === 0 && !!searchText
    );
  }

  confirm() {
    if (!this.selectedInvoice || this.searchForm.invalid) return;

    this.isSubmitting = true;
    const amount = this.searchForm.get('amount')?.value;

    const details = [
      {
        productId: this.data.productId,
        amount: amount,
        priceSale: 0
      }
    ];

    this.invoiceService
      .addDetails(this.selectedInvoice.invoiceId, details)
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.dialogRef.close(true);
        },
        error: () => {
          this.isSubmitting = false;
        }
      });
  }
}
