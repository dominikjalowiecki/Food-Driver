import { Injectable, inject } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { JwtPayload, jwtDecode } from 'jwt-decode';
import { Roles } from '../../core/utils/roles.enum';
@Injectable({
  providedIn: 'root',
})
export class JwtService {
  private cookies = inject(CookieService);
  private tokenPath = 'token';
  private refreshTokenPath = 'refreshToken';
  getToken(): string {
    return this.cookies.get(this.tokenPath);
  }
  checkToken(): boolean {
    return this.cookies.check('token');
  }
  checkRefreshToken(): boolean {
    return this.cookies.check('refreshToken');
  }
  getRefreshToken(): string {
    return this.cookies.get(this.refreshTokenPath);
  }
  setToken(token: string): void {
    this.cookies.set(this.tokenPath, token, undefined, '/');
  }
  setRefreshToken(token: string): void {
    this.cookies.set(this.refreshTokenPath, token, undefined, '/');
  }
  getRole(): Roles {
    return this.decodeJwt().user.role;
  }
  getUserId(): number {
    return this.decodeJwt().user.idUser;
  }
  removeToken() {
    this.cookies.delete(this.tokenPath, '/');
  }
  removeRefreshToken() {
    this.cookies.delete(this.refreshTokenPath, '/');
  }
  private decodeJwt() {
    return jwtDecode(this.getToken()) as JwtPayload & {
      user: {
        idUser: number;
        role: Roles;
      };
    };
  }
}
