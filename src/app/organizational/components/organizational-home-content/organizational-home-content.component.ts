import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BenefitSection } from '../../../shared/interfaces/organizational.interface';

@Component({
  selector: 'app-organizational-home-content',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './organizational-home-content.component.html',
  styleUrls: ['./organizational-home-content.component.scss']
})
export class OrganizationalHomeContentComponent {
  @Input() form!: FormGroup;
  @Input() benefitSections: BenefitSection[] = [];
  @Output() save = new EventEmitter<void>();
}
