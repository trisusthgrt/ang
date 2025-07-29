import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, RegisterRequest } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  registerForm: FormGroup;
  showPassword = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder, 
    private router: Router,
    private authService: AuthService
  ) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      agreeToTerms: [false, [Validators.requiredTrue]]
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const userData: RegisterRequest = {
        username: this.registerForm.value.username,
        email: this.registerForm.value.email,
        password: this.registerForm.value.password,
        agreeToTerms: this.registerForm.value.agreeToTerms
      };

      this.authService.register(userData).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.successMessage = response.message;
            console.log('Registration successful:', response.user);
            
            // Redirect to login page after successful registration
            setTimeout(() => {
              alert('Registration successful! Welcome ' + response.user?.fullName + '. Redirecting to login...');
              this.router.navigate(['/login']);
            }, 2000);
          } else {
            this.errorMessage = response.message;
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = 'Connection error. Please make sure the server is running.';
          console.error('Registration error:', error);
        }
      });
    }
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
} 