import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-section-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './section-header.component.html',
  styleUrl: './section-header.component.scss'
})
export class SectionHeaderComponent {
  @Input() label?: string = '';
  @Input() title?: string = '';
  @Input() description?: string;
  @Input() variant: 'centered' | 'left' = 'centered';
}
