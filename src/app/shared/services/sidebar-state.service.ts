import { Injectable } from '@angular/core';
import { UserComplete } from '../../organizational/interfaces/create.interface';

@Injectable({ providedIn: 'root' })
export class SidebarStateService {
  private _isCollapsed: boolean = true;
  private _sessionOpen: boolean = false;
  private _cachedUserId: string | null = null;
  private _cachedUserComplete: UserComplete | null = null;

  get isCollapsed(): boolean {
    return this._isCollapsed;
  }

  set isCollapsed(value: boolean) {
    this._isCollapsed = value;
  }

  openForSession(): void {
    if (!this._sessionOpen) {
      this._isCollapsed = false;
      this._sessionOpen = true;
    }
  }

  closeForLogout(): void {
    this._isCollapsed = true;
    this._sessionOpen = false;
  }

  getCachedUser(userId: string): UserComplete | null {
    return this._cachedUserId === userId ? this._cachedUserComplete : null;
  }

  setCachedUser(userId: string, data: UserComplete): void {
    this._cachedUserId = userId;
    this._cachedUserComplete = data;
  }

  clearCache(): void {
    this._cachedUserId = null;
    this._cachedUserComplete = null;
  }
}
