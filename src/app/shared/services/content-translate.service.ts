import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ContentTranslateService {
  private readonly _http = inject(HttpClient);
  private readonly _translate = inject(TranslateService);

  translate(text: string): Observable<string> {
    const to = this._translate.currentLang ?? this._translate.defaultLang ?? 'en';
    return this._http
      .post<{ text: string }>(`${environment.apiUrl}translate`, { text, to })
      .pipe(map((res) => res.text));
  }
}
