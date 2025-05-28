import { Component } from '@angular/core';
import { BasePageComponent } from '../../../shared/components/base-page/base-page.component';

@Component({
  selector: 'app-create-invoices',
  standalone: true,
  imports: [BasePageComponent],
  templateUrl: './create-invoices.component.html',
  styleUrl: './create-invoices.component.scss'
})
export class CreateInvoicesComponent {}
