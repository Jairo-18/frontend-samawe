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
import {
  MatAutocompleteSelectedEvent,
  MatAutocompleteModule
} from '@angular/material/autocomplete';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  Observable,
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
  filteredUsers: CreateUserPanel[] = [];
  userFilterControl: FormControl<string | null> = new FormControl('');
  selectedUser: CreateUserPanel | null = null;
  isLoadingUsers = false;

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
    this.setupUserAutocomplete();
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
      payTypeId: ['', Validators.required]
    });
  }

  private setupUserAutocomplete(): void {
    this.userFilterControl.valueChanges
      .pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          // Si no hay query o es muy corto, limpiar resultados
          if (!query || typeof query !== 'string' || query.length < 2) {
            this.isLoadingUsers = false;
            return of([]);
          }

          this.isLoadingUsers = true;
          return this.searchUsers(query).pipe(
            catchError((error) => {
              console.error('Error searching users:', error);
              return of([]);
            })
          );
        })
      )
      .subscribe((users) => {
        this.filteredUsers = users;
        this.isLoadingUsers = false;
      });
  }

  private searchUsers(query: string): Observable<CreateUserPanel[]> {
    return this._userService
      .getUserWithPagination({
        search: query.trim(),
        page: 1
      })
      .pipe(
        map((response) => {
          return response.data || [];
        }),
        catchError((error) => {
          console.error('Error in searchUsers:', error);
          return of([]);
        })
      );
  }

  displayUser(user?: CreateUserPanel | string): string {
    if (!user || typeof user === 'string') {
      return typeof user === 'string' ? user : '';
    }

    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return fullName || 'Usuario sin nombre';
  }

  onUserSelected(event: MatAutocompleteSelectedEvent): void {
    if (!event.option.value) {
      return;
    }

    const user: CreateUserPanel = event.option.value;
    this.selectedUser = user;

    // Verificar que el usuario tenga userId
    if (user.userId) {
      this.form.patchValue({ userId: user.userId });
    } else {
      console.error('El usuario seleccionado no tiene userId:', user);
    }

    const displayValue = this.displayUser(user);
    this.userFilterControl.setValue(displayValue, { emitEvent: false });
  }

  get showNoResultsMessage(): boolean {
    const searchText = this.userFilterControl.value || '';
    return (
      !this.isLoadingUsers &&
      this.filteredUsers.length === 0 &&
      typeof searchText === 'string' &&
      searchText.length >= 2
    );
  }

  private getCurrentUserId(): string | null {
    // Usar el método del AuthService si existe
    const userId = this._authService.getCurrentUserId?.();
    if (userId) {
      return userId;
    }

    // Fallback manual si el método no existe aún
    try {
      const rawUserData = localStorage.getItem(this._tokensStorageKey);
      if (!rawUserData) {
        console.error('No hay datos de usuario en localStorage');
        return null;
      }

      const parsed = JSON.parse(rawUserData);

      if (parsed.user && parsed.user.userId) {
        return parsed.user.userId;
      }

      console.error(
        'No se encontró user.userId en la estructura de datos:',
        parsed
      );
      return null;
    } catch (e) {
      console.error('Error parsing user data from localStorage', e);
      return null;
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // El servidor no acepta creatorUserId, así que no lo incluimos
    const payload: CreateInvoice = {
      userId: this.form.value.userId,
      invoiceTypeId: this.form.value.invoiceTypeId,
      code: this.form.value.code,
      invoiceElectronic: this.form.value.invoiceElectronic, // Aquí se añade
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

  // Método helper para limpiar la selección
  clearUserSelection(): void {
    this.selectedUser = null;
    this.form.patchValue({ userId: '' });
    this.userFilterControl.setValue('');
    this.filteredUsers = [];
  }
}
