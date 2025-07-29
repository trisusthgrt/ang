import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, map, tap, switchMap, of } from 'rxjs';

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  fullName: string;
  track: string | null;
  avatarUrl: string;
  joinDate: string;
  role: string;
  bio: string | null;
  location: string | null;
}

export interface LoginRequest {
  username: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  agreeToTerms: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:3000';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  login(credentials: LoginRequest): Observable<{ success: boolean; user?: User; message: string }> {
    return this.http.get<User[]>(`${this.baseUrl}/users`).pipe(
      map(users => {
        // Find user by username or email
        const user = users.find(u => 
          (u.username === credentials.username || u.email === credentials.username) &&
          u.password === credentials.password
        );

        if (user) {
          // Store user in localStorage if remember me is checked
          if (credentials.rememberMe) {
            localStorage.setItem('currentUser', JSON.stringify(user));
          }
          
          this.currentUserSubject.next(user);
          return { 
            success: true, 
            user, 
            message: 'Login successful!' 
          };
        } else {
          return { 
            success: false, 
            message: 'Invalid username/email or password' 
          };
        }
      })
    );
  }

  register(userData: RegisterRequest): Observable<{ success: boolean; user?: User; message: string }> {
    return this.http.get<User[]>(`${this.baseUrl}/users`).pipe(
      switchMap(users => {
        // Check if username or email already exists
        const existingUser = users.find(u => 
          u.username === userData.username || u.email === userData.email
        );

        if (existingUser) {
          return of({
            success: false,
            message: 'Username or email already exists'
          });
        }

        // Create new user
        const newUser: User = {
          id: Math.max(...users.map(u => u.id)) + 1,
          username: userData.username,
          email: userData.email,
          password: userData.password, // In real app, this should be hashed
          fullName: userData.username, // Default to username
          track: null,
          avatarUrl: `https://i.pravatar.cc/150?u=${userData.username}`,
          joinDate: new Date().toISOString(),
          role: 'Learner',
          bio: null,
          location: null
        };

        // Add user to database
        return this.http.post<User>(`${this.baseUrl}/users`, newUser).pipe(
          map((createdUser) => {
            this.currentUserSubject.next(createdUser);
            return {
              success: true,
              user: createdUser,
              message: 'Registration successful!'
            };
          })
        );
      })
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
} 