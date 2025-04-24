import { Component, input, InputSignal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-base-card-without-actions',
  imports: [MatCardModule],
  templateUrl: './base-card-without-actions.component.html',
  styleUrl: './base-card-without-actions.component.scss',
})
export class BaseCardWithoutActionsComponent {
  description: InputSignal<string> = input<string>('');
  image: InputSignal<string> = input<string>('');
  title: InputSignal<string> = input<string>('');
}
