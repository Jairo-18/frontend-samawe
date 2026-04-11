import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export type ButtonLandingVariant = 'solid' | 'transparent' | 'warning';

@Component({
  selector: 'app-button-landing',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './button-landing.component.html',
  styleUrl: './button-landing.component.scss'
})
export class ButtonLandingComponent {
  @Input() label: string = '';
  @Input() icon: string = '';
  @Input() variant: ButtonLandingVariant = 'solid';
  @Input() type: 'button' | 'submit' = 'button';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Output() clicked = new EventEmitter<void>();

  onClick(): void {
    if (!this.disabled && !this.loading) this.clicked.emit();
  }
}
