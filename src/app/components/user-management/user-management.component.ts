import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { HeaderComponent } from '../header/header.component';
import { FileUploaderComponent, FileUploadResult } from '../file-uploader/file-uploader.component';
import { AuthService, User } from '../../services/auth.service';
import { BannerService, Banner, BannerUpload } from '../../services/banner.service';
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
  imports: [CommonModule, FormsModule, HeaderComponent, FileUploaderComponent],
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
  
  // Search and sort (for users)
  searchQuery = '';
  sortBy = 'Latest';
  sortOptions = [
    { value: 'Latest', label: 'Latest' },
    { value: 'Oldest', label: 'Oldest' },
    { value: 'A-Z', label: 'A-Z' },
    { value: 'Z-A', label: 'Z-A' }
  ];
  
  // Pagination (for users)
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
  
  // Banner Management
  banners: Banner[] = [];
  isBannerLoading = false;
  bannerUploads: BannerUpload[] = [];
  showAddBannerForm = false;
  
  // Banner form
  currentBannerUpload: BannerUpload = {
    file: new File([], ''),
    preview: '',
    title: '',
    description: '',
    visibility: 'draft',
    scheduleDate: '',
    expiryDate: ''
  };
  
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private authService: AuthService,
    private bannerService: BannerService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadUsers();
    this.loadBanners();
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

  private loadBanners() {
    this.isBannerLoading = true;
    this.bannerService.getAllBanners()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (banners) => {
          this.banners = banners.sort((a, b) => a.order - b.order);
          this.isBannerLoading = false;
        },
        error: (error) => {
          console.error('Error loading banners:', error);
          this.isBannerLoading = false;
        }
      });
  }

  // Banner Management Methods
  onBannerFileSelected(files: FileUploadResult[]) {
    if (files.length > 0) {
      const file = files[0];
      this.currentBannerUpload = {
        file: file.file,
        preview: file.preview,
        title: file.name.split('.')[0], // Remove extension for title
        description: '',
        visibility: 'draft',
        scheduleDate: '',
        expiryDate: ''
      };
      this.showAddBannerForm = true;
    }
  }

  onBannerUploadError(error: string) {
    console.error('Banner upload error:', error);
    // You could show a toast notification here
  }

  saveBanner() {
    if (!this.currentBannerUpload.file.name) {
      return;
    }

    this.isBannerLoading = true;
    this.bannerService.createBannerFromUpload(this.currentBannerUpload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (banner) => {
          this.banners.push(banner);
          this.resetBannerForm();
          this.isBannerLoading = false;
        },
        error: (error) => {
          console.error('Error saving banner:', error);
          this.isBannerLoading = false;
        }
      });
  }

  updateBannerImage(bannerId: string, event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      this.isBannerLoading = true;
      this.bannerService.uploadBannerImage(file)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: ({ imageUrl }) => {
            this.bannerService.updateBanner(bannerId, { imageUrl })
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (updatedBanner) => {
                  const index = this.banners.findIndex(b => b.id === bannerId);
                  if (index > -1) {
                    this.banners[index] = updatedBanner;
                  }
                  this.isBannerLoading = false;
                },
                error: (error) => {
                  console.error('Error updating banner:', error);
                  this.isBannerLoading = false;
                }
              });
          },
          error: (error) => {
            console.error('Error uploading image:', error);
            this.isBannerLoading = false;
          }
        });
    }
  }

  deleteBanner(bannerId: string) {
    if (confirm('Are you sure you want to delete this banner?')) {
      this.isBannerLoading = true;
      this.bannerService.deleteBanner(bannerId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.banners = this.banners.filter(b => b.id !== bannerId);
            this.isBannerLoading = false;
          },
          error: (error) => {
            console.error('Error deleting banner:', error);
            this.isBannerLoading = false;
          }
        });
    }
  }

  updateBannerVisibility(bannerId: string, visibility: Banner['visibility']) {
    const banner = this.banners.find(b => b.id === bannerId);
    if (banner) {
      banner.visibility = visibility;
      
      // Clear dates if not scheduled
      if (visibility !== 'scheduled') {
        banner.scheduleDate = undefined;
        banner.expiryDate = undefined;
      }
      
      this.bannerService.updateBanner(bannerId, {
        visibility,
        scheduleDate: banner.scheduleDate,
        expiryDate: banner.expiryDate
      }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedBanner) => {
          const index = this.banners.findIndex(b => b.id === bannerId);
          if (index > -1) {
            this.banners[index] = updatedBanner;
          }
        },
        error: (error) => {
          console.error('Error updating banner visibility:', error);
        }
      });
    }
  }

  updateBannerSchedule(bannerId: string, field: 'scheduleDate' | 'expiryDate', value: string) {
    const banner = this.banners.find(b => b.id === bannerId);
    if (banner) {
      banner[field] = value;
      
      this.bannerService.updateBanner(bannerId, { [field]: value })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedBanner) => {
            const index = this.banners.findIndex(b => b.id === bannerId);
            if (index > -1) {
              this.banners[index] = updatedBanner;
            }
          },
          error: (error) => {
            console.error('Error updating banner schedule:', error);
          }
        });
    }
  }

  resetBannerForm() {
    this.currentBannerUpload = {
      file: new File([], ''),
      preview: '',
      title: '',
      description: '',
      visibility: 'draft',
      scheduleDate: '',
      expiryDate: ''
    };
    this.showAddBannerForm = false;
  }

  addAnotherBanner() {
    this.resetBannerForm();
    // This will show the file uploader again
  }

  // Banner event handlers
  onBannerVisibilityChange(event: Event, bannerId: string) {
    const target = event.target as HTMLSelectElement;
    const visibility = target.value as Banner['visibility'];
    this.updateBannerVisibility(bannerId, visibility);
  }

  onScheduleDateChange(event: Event, bannerId: string) {
    const target = event.target as HTMLInputElement;
    const dateValue = target.value + 'T00:00:00.000Z';
    this.updateBannerSchedule(bannerId, 'scheduleDate', dateValue);
  }

  onExpiryDateChange(event: Event, bannerId: string) {
    const target = event.target as HTMLInputElement;
    const dateValue = target.value + 'T23:59:59.999Z';
    this.updateBannerSchedule(bannerId, 'expiryDate', dateValue);
  }

  // Existing user management methods remain the same...
  parseUserRoles(role: string): string[] {
    if (!role) return ['Normal User'];
    return role.split(',').map(r => r.trim()).filter(r => r.length > 0);
  }

  private formatUserRoles(roles: string[]): string {
    return roles.join(', ');
  }

  // Tab management
  onTabClick(tabId: string) {
    this.activeTab = tabId;
    if (tabId === 'dynamic-banner') {
      this.loadBanners();
    }
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
      const userIndex = this.users.findIndex(u => u.id === this.selectedUser!.id);
      if (userIndex > -1) {
        this.users[userIndex] = {
          ...this.users[userIndex],
          fullName: this.selectedUser.editedName || this.selectedUser.fullName,
          email: this.selectedUser.editedEmail || this.selectedUser.email,
          role: this.formatUserRoles(this.selectedUser.editedRoles || []),
          bio: this.selectedUser.editedBio || this.selectedUser.bio
        };
        
        console.log('User updated:', this.users[userIndex]);
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
