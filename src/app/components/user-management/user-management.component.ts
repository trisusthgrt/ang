import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { HeaderComponent } from '../header/header.component';
import { AuthService, User } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';

export interface EditableUser extends User {
  editedName?: string;
  editedEmail?: string;
  editedRoles?: string[];
  editedBio?: string;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss'
})
export class UserManagementComponent implements OnInit, OnDestroy {
  
  users: EditableUser[] = [];
  filteredUsers: EditableUser[] = [];
  isLoading = true;
  
  // Tab management
  activeTab = 'user-management';
  tabs = [
    { id: 'user-management', label: 'User Management' },
    { id: 'dynamic-banner', label: 'Dynamic Banner' },
    { id: 'settings', label: 'Settings' }
  ];
  
  // Search and sort
  searchQuery = '';
  sortBy = 'Latest';
  sortOptions = [
    { value: 'Latest', label: 'Latest' },
    { value: 'Oldest', label: 'Oldest' },
    { value: 'A-Z', label: 'A-Z' },
    { value: 'Z-A', label: 'Z-A' }
  ];
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalRecords = 0;
  totalPages = 0;
  
  // Edit User Modal
  showEditUserModal = false;
  selectedUser: EditableUser | null = null;
  activeEditTab = 'profile';
  editTabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'activities', label: 'Activities' }
  ];
  
  // Available roles for editing
  availableRoles = ['Author', 'Admin', 'Blogger', 'Normal User'];
  
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUsers() {
    this.http.get<User[]>('http://localhost:3000/users')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          this.users = users.map(user => ({
            ...user,
            editedName: user.fullName,
            editedEmail: user.email,
            editedRoles: this.parseUserRoles(user.role),
            editedBio: user.bio || ''
          }));
          this.totalRecords = this.users.length;
          this.applyFiltersAndSort();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.isLoading = false;
        }
      });
  }

  parseUserRoles(role: string): string[] {
    // Parse role string into array (handle multiple roles)
    if (!role) return ['Normal User'];
    return role.split(',').map(r => r.trim()).filter(r => r.length > 0);
  }

  private formatUserRoles(roles: string[]): string {
    return roles.join(', ');
  }

  // Tab management
  onTabClick(tabId: string) {
    this.activeTab = tabId;
  }

  // Search and sort functionality
  onSearchChange() {
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }

  onSortChange() {
    this.applyFiltersAndSort();
  }

  private applyFiltersAndSort() {
    // Filter by search query
    let filtered = this.users;
    
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.fullName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query)
      );
    }

    // Sort users
    filtered = this.sortUsers(filtered);

    // Calculate pagination
    this.totalRecords = filtered.length;
    this.totalPages = Math.ceil(this.totalRecords / this.itemsPerPage);
    
    // Apply pagination
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.filteredUsers = filtered.slice(startIndex, endIndex);
  }

  private sortUsers(users: EditableUser[]): EditableUser[] {
    return [...users].sort((a, b) => {
      switch (this.sortBy) {
        case 'Latest':
          return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
        case 'Oldest':
          return new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime();
        case 'A-Z':
          return a.fullName.localeCompare(b.fullName);
        case 'Z-A':
          return b.fullName.localeCompare(a.fullName);
        default:
          return 0;
      }
    });
  }

  // Pagination methods
  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyFiltersAndSort();
    }
  }

  onItemsPerPageChange() {
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }

  getPageNumbers(): number[] {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Edit User Modal methods
  openEditUserModal(user: EditableUser) {
    this.selectedUser = { ...user };
    this.activeEditTab = 'profile';
    this.showEditUserModal = true;
  }

  closeEditUserModal() {
    this.showEditUserModal = false;
    this.selectedUser = null;
  }

  onEditTabClick(tabId: string) {
    this.activeEditTab = tabId;
  }

  toggleRole(role: string) {
    if (this.selectedUser && this.selectedUser.editedRoles) {
      const index = this.selectedUser.editedRoles.indexOf(role);
      if (index > -1) {
        this.selectedUser.editedRoles.splice(index, 1);
      } else {
        this.selectedUser.editedRoles.push(role);
      }
    }
  }

  isRoleSelected(role: string): boolean {
    return this.selectedUser?.editedRoles?.includes(role) || false;
  }

  saveUserChanges() {
    if (this.selectedUser) {
      // Update the original user in the users array
      const userIndex = this.users.findIndex(u => u.id === this.selectedUser!.id);
      if (userIndex > -1) {
        this.users[userIndex] = {
          ...this.users[userIndex],
          fullName: this.selectedUser.editedName || this.selectedUser.fullName,
          email: this.selectedUser.editedEmail || this.selectedUser.email,
          role: this.formatUserRoles(this.selectedUser.editedRoles || []),
          bio: this.selectedUser.editedBio || this.selectedUser.bio
        };
        
        // In a real app, you would make an API call here
        console.log('User updated:', this.users[userIndex]);
        
        // Refresh the filtered list
        this.applyFiltersAndSort();
      }
    }
    this.closeEditUserModal();
  }

  // Utility methods
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getRoleClasses(role: string): string {
    switch (role.toLowerCase()) {
      case 'admin': return 'role-admin';
      case 'author': return 'role-author';
      case 'blogger': return 'role-blogger';
      default: return 'role-user';
    }
  }

  navigateToHome() {
    this.router.navigate(['/dashboard']);
  }

  navigateToAdminConsole() {
    this.router.navigate(['/admin']);
  }

  // Mock data for activities tab
  getMockActivities() {
    return {
      learningHours: '145.5',
      pendingCourses: '3',
      ratedCourses: '12',
      learningHistory: [
        { title: 'React Fundamentals', progress: 85, status: 'In Progress' },
        { title: 'JavaScript Advanced', progress: 100, status: 'Completed' },
        { title: 'Node.js Basics', progress: 45, status: 'In Progress' },
        { title: 'CSS Grid Layout', progress: 100, status: 'Completed' }
      ]
    };
  }
}
