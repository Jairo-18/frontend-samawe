import { Component, inject, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormControl
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { InvoiceService } from '../../services/invoice.service';
import { AuthService } from '../../../auth/services/auth.service';
import {
  InvoiceType,
  PaidType,
  PayType
} from '../../../shared/interfaces/relatedDataGeneral';
import { CreateUserPanel } from '../../../organizational/interfaces/create.interface';
import { UsersService } from '../../../organizational/services/users.service';
import { CreateInvoice } from '../../interface/invoice.interface';
import { MatButtonModule } from '@angular/material/button';
import { BaseDialogComponent } from '../../../shared/components/base-dialog/base-dialog.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  of,
  catchError,
  map,
  startWith
} from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-invoice-dialog',
  standalone: true,
  imports: [
    MatButtonModule,
    BaseDialogComponent,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatOptionModule,
    MatInputModule,
    CommonModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './create-invoice-dialog.component.html',
  styleUrls: ['./create-invoice-dialog.component.scss']
})
export class CreateInvoiceDialogComponent implements OnInit {
  form!: FormGroup;
  invoiceTypes: InvoiceType[] = [];
  paidTypes: PaidType[] = [];
  payTypes: PayType[] = [];
  filteredClients: CreateUserPanel[] = [];
  clientFilterControl: FormControl<string | null> = new FormControl('');
  selectedClient: CreateUserPanel | null = null;
  isLoadingClients = false;

  private readonly _dialogRef: MatDialogRef<CreateInvoiceDialogComponent> =
    inject(MatDialogRef<CreateInvoiceDialogComponent>);
  private readonly _fb: FormBuilder = inject(FormBuilder);
  private readonly _invoiceService: InvoiceService = inject(InvoiceService);
  private readonly _userService: UsersService = inject(UsersService);
  private readonly _authService: AuthService = inject(AuthService);
  private readonly _tokensStorageKey = '_sessionData';
  private readonly _router: Router = inject(Router);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  ngOnInit(): void {
    this.initForm();
    this.setupClientAutocomplete();
    this.invoiceTypes = this.data?.relatedData?.invoiceType || [];
    this.paidTypes = this.data?.relatedData?.paidType || [];
    this.payTypes = this.data?.relatedData?.payType || [];
  }

  private initForm(): void {
    this.form = this._fb.group({
      invoiceTypeId: ['', Validators.required],
      code: ['', Validators.required],
      userId: ['', Validators.required],
      invoiceElectronic: [false, Validators.required],
      paidTypeId: ['', Validators.required],
      payTypeId: ['', Validators.required],
      clientName: ['']
    });
  }

  private setupClientAutocomplete(): void {
    this.clientFilterControl.valueChanges
      .pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          if (!query || typeof query !== 'string' || query.length < 2) {
            this.isLoadingClients = false;
            return of([]);
          }

          this.isLoadingClients = true;
          return this._userService
            .getUserWithPagination({
              search: query.trim(),
              page: 1
            })
            .pipe(
              map((response) => response.data || []),
              catchError((error) => {
                console.error('Error searching clients:', error);
                return of([]);
              })
            );
        })
      )
      .subscribe((clients) => {
        this.filteredClients = clients;
        this.isLoadingClients = false;
      });
  }

  displayClient(client?: CreateUserPanel | string): string {
    if (!client || typeof client === 'string') {
      return typeof client === 'string' ? client : '';
    }
    return (
      `${client.firstName || ''} ${client.lastName || ''}`.trim() ||
      'Cliente sin nombre'
    );
  }

  onClientFocus(): void {
    if (!this.filteredClients.length) {
      this._userService.getUserWithPagination({}).subscribe({
        next: (res) => (this.filteredClients = res.data || []),
        error: (err) => console.error('Error loading clients:', err)
      });
    }
  }

  onClientSelected(fullName: string): void {
    const client = this.filteredClients.find(
      (c) => `${c.firstName} ${c.lastName}` === fullName
    );

    if (!client) return;

    this.selectedClient = client;
    this.form.patchValue({
      userId: client.userId,
      clientName: fullName
    });
  }

  clearClientSelection(): void {
    this.selectedClient = null;
    this.form.patchValue({
      userId: '',
      clientName: ''
    });
    this.clientFilterControl.setValue('');
    this.filteredClients = [];
  }

  get showNoResultsMessage(): boolean {
    const searchText = this.clientFilterControl.value || '';
    return (
      !this.isLoadingClients &&
      this.filteredClients.length === 0 &&
      typeof searchText === 'string' &&
      searchText.length >= 2
    );
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: CreateInvoice = {
      userId: this.form.value.userId,
      invoiceTypeId: this.form.value.invoiceTypeId,
      code: this.form.value.code,
      invoiceElectronic: this.form.value.invoiceElectronic,
      payTypeId: this.form.value.payTypeId,
      paidTypeId: this.form.value.paidTypeId,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    };

    this._invoiceService.createInvoice(payload).subscribe({
      next: (res) => {
        this._dialogRef.close(res.data.rowId);
        this._router.navigateByUrl(`/invoice/invoices/${res.data.rowId}/edit`);
      },
      error: (err) => {
        console.error('Error creating invoice', err);
      }
    });
  }

  cancel(): void {
    this._dialogRef.close(null);
  }
}
