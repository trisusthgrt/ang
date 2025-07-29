import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, LoginRequest } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginForm: FormGroup;
  showPassword = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder, 
    private router: Router,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
      rememberMe: [false]
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const credentials: LoginRequest = {
        username: this.loginForm.value.username,
        password: this.loginForm.value.password,
        rememberMe: this.loginForm.value.rememberMe
      };

      this.authService.login(credentials).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.successMessage = response.message;
            console.log('Login successful:', response.user);
            
            // Redirect to dashboard after successful login
            setTimeout(() => {
              this.router.navigate(['/dashboard']);
            }, 1000);
          } else {
            this.errorMessage = response.message;
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = 'Connection error. Please make sure the server is running.';
          console.error('Login error:', error);
        }
      });
    }
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }
} 