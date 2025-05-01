import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-base-page',
  standalone: true,
  imports: [MatButtonModule, RouterLink, MatIconModule, MatTooltipModule],
  templateUrl: './base-page.component.html',
  styleUrl: './base-page.component.scss'
})
export class BasePageComponent {
  @Input() title: string = '';
  @Input() subtitle?: string;
  @Input() previusUrl?: string = '';
}
