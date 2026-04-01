import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { IdentificationType, PhoneCode } from '../../../shared/interfaces/relatedDataGeneral';

@Component({
  selector: 'app-organizational-general-info',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatAutocompleteModule
  ],
  templateUrl: './organizational-general-info.component.html'
})
export class OrganizationalGeneralInfoComponent {
  @Input() form!: FormGroup;
  @Input() identificationTypes: IdentificationType[] = [];
  @Input() filteredPhoneCodes: PhoneCode[] = [];
  @Input() loadingPhoneCodes: boolean = false;
  @Output() phoneCodeSelected = new EventEmitter<PhoneCode>();
  @Output() save = new EventEmitter<void>();

  displayPhoneCode(phoneCode: PhoneCode): string {
    return phoneCode ? `${phoneCode.name} ${phoneCode.code}` : '';
  }
}
