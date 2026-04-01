import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CorporateValue } from '../../../shared/interfaces/organizational.interface';

@Component({
  selector: 'app-organizational-web-content',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './organizational-web-content.component.html',
  styleUrls: ['./organizational-web-content.component.scss']
})
export class OrganizationalWebContentComponent {
  @Input() form!: FormGroup;
  @Input() corporateValues: CorporateValue[] = [];
  @Input() corporateValueForm!: FormGroup;
  @Input() editingValue: CorporateValue | null = null;
  @Input() corporateValueImageLoading: Record<string, boolean> = {};
  @Output() save = new EventEmitter<void>();
  @Output() saveValue = new EventEmitter<void>();
  @Output() deleteValue = new EventEmitter<string>();
  @Output() editValue = new EventEmitter<CorporateValue>();
  @Output() cancelEdit = new EventEmitter<void>();
  @Output() uploadValueImage = new EventEmitter<{ valueId: string; file: File }>();
  @Output() deleteValueImage = new EventEmitter<string>();

  triggerImageInput(valueId: string): void {
    const input = document.getElementById(`cv-img-${valueId}`) as HTMLInputElement;
    input?.click();
  }

  onImageSelected(event: Event, valueId: string): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.uploadValueImage.emit({ valueId, file });
    }
  }
}
