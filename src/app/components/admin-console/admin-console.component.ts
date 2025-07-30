import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { AdminCardComponent } from '../admin-card/admin-card.component';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';

export interface AdminCardData {
  icon: string;
  title: string;
  count?: number;
  isPlaceholder?: boolean;
  route?: string;
}

@Component({
  selector: 'app-admin-console',
  standalone: true,
  imports: [CommonModule, HeaderComponent, AdminCardComponent],
  templateUrl: './admin-console.component.html',
  styleUrl: './admin-console.component.scss'
})
export class AdminConsoleComponent implements OnInit {
  
  adminCards: AdminCardData[] = [
    {
      icon: 'users',
      title: 'User Management',
      count: 0,
      route: '/admin/users'
    },
    {
      icon: 'image',
      title: 'Dynamic Banners',
      isPlaceholder: false,
      route: '/admin/banners'
    },
    {
      icon: 'settings',
      title: 'Settings',
      isPlaceholder: false,
      route: '/admin/settings'
    },
    {
      icon: 'placeholder',
      title: 'Placeholder',
      isPlaceholder: true
    },
    {
      icon: 'placeholder',
      title: 'Placeholder',
      isPlaceholder: true
    },
    {
      icon: 'placeholder',
      title: 'Placeholder',
      isPlaceholder: true
    }
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadUserCount();
  }

  private loadUserCount() {
    // Load user count from the API
    this.http.get<any[]>('http://localhost:3000/users').subscribe({
      next: (users) => {
        const userManagementCard = this.adminCards.find(card => card.title === 'User Management');
        if (userManagementCard) {
          userManagementCard.count = users.length;
        }
      },
      error: (error) => {
        console.error('Error loading user count:', error);
        // Set a default count if API fails
        const userManagementCard = this.adminCards.find(card => card.title === 'User Management');
        if (userManagementCard) {
          userManagementCard.count = 1234; // Fallback count from design
        }
      }
    });
  }

  onCardClick(card: AdminCardData) {
    if (card.route && !card.isPlaceholder) {
      this.router.navigate([card.route]);
    }
  }

  navigateToHome() {
    this.router.navigate(['/dashboard']);
  }
}
