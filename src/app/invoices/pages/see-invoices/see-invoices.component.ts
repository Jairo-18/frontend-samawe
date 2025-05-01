import { Component } from '@angular/core';
import { BasePageComponent } from '../../../shared/components/base-page/base-page.component';

@Component({
  selector: 'app-see-invoices',
  standalone: true,
  imports: [BasePageComponent],
  templateUrl: './see-invoices.component.html',
  styleUrl: './see-invoices.component.scss'
})
export class SeeInvoicesComponent {}
