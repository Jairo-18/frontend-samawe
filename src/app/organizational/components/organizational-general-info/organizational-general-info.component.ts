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
import { TranslateModule } from '@ngx-translate/core';
import { MatTooltipModule } from '@angular/material/tooltip';

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
    MatAutocompleteModule,
    TranslateModule,
    MatTooltipModule
  ],
  templateUrl: './organizational-general-info.component.html',
  styleUrls: ['./organizational-general-info.component.scss']
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

  onNameInput(): void {
    const name = this.form.get('name')?.value || '';
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');
    this.form.get('slug')?.setValue(slug);
  }

  get isPhoneCodeSelected(): boolean {
    const val = this.form.get('phoneCodeSearch')?.value;
    return typeof val === 'object' && val !== null;
  }

  clearPhoneCodeSelection(): void {
    this.form.patchValue({ phoneCodeId: '', phoneCodeSearch: '' });
  }
}
