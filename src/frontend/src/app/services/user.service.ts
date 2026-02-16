import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserDto {
  id: number;
  username: string;
  isAdmin: boolean;
  createdAt: number;
}

export interface CreateUserDto {
  username: string;
  password: string;
}

export interface UpdateUserDto {
  username?: string;
  password?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = '/api/auth/users';

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(this.apiUrl);
  }

  createUser(user: CreateUserDto): Observable<UserDto> {
    return this.http.post<UserDto>(this.apiUrl, user);
  }

  updateUser(id: number, user: UpdateUserDto): Observable<UserDto> {
    return this.http.put<UserDto>(`${this.apiUrl}/${id}`, user);
  }

  deleteUser(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}

