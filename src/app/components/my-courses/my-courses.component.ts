import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { HeaderComponent } from '../header/header.component';
import { AuthService, User } from '../../services/auth.service';
import { CourseService, CourseWithProgress } from '../../services/course.service';

export interface AuthorCourse extends CourseWithProgress {
  status: 'Published' | 'Draft' | 'Archived';
  createdDate: string;
  lastUpdated: string;
}

@Component({
  selector: 'app-my-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './my-courses.component.html',
  styleUrl: './my-courses.component.scss'
})
export class MyCoursesComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  courses: AuthorCourse[] = [];
  filteredCourses: AuthorCourse[] = [];
  isLoading = true;

  // Tab management
  activeTab: 'Published' | 'Draft' | 'Archived' = 'Published';
  tabs = [
    { id: 'Published' as const, label: 'Published', count: 0 },
    { id: 'Draft' as const, label: 'Draft', count: 0 },
    { id: 'Archived' as const, label: 'Archived', count: 0 }
  ];

  // Search and sort
  searchQuery = '';
  sortBy = 'Latest';
  sortOptions = [
    { value: 'Latest', label: 'Latest' },
    { value: 'Highest Rating', label: 'Highest Rating' },
    { value: 'Highest Reviewed', label: 'Highest Reviewed' },
    { value: 'A-Z', label: 'A-Z' },
    { value: 'Z-A', label: 'Z-A' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private courseService: CourseService,
    private router: Router
  ) {}

  ngOnInit() {
    // Check if user has access
    this.currentUser = this.authService.getCurrentUser();
    
    if (!this.isAuthorOrAdmin()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loadAuthorCourses();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private isAuthorOrAdmin(): boolean {
    return this.currentUser?.role === 'Author' || this.currentUser?.role === 'Admin';
  }

  private loadAuthorCourses() {
    // Load published courses from localStorage
    const publishedCourses = JSON.parse(localStorage.getItem('publishedCourses') || '[]');
    
    // For demo purposes, we'll also create mock courses for the current author
    this.courseService.getAllCourses()
      .pipe(takeUntil(this.destroy$))
      .subscribe(allCourses => {
        // Combine published courses with mock courses
        const mockCourses = this.createMockAuthorCourses(allCourses.slice(0, 5));
        const authorPublishedCourses = publishedCourses.map((course: any) => ({
          ...course,
          status: 'Published' as const,
          createdDate: course.createdAt || new Date().toISOString(),
          lastUpdated: course.updatedAt || new Date().toISOString(),
          progressPercent: 0
        }));
        
        this.courses = [...authorPublishedCourses, ...mockCourses];
        this.updateTabCounts();
        this.applyFiltersAndSort();
        this.isLoading = false;
      });
  }

  private createMockAuthorCourses(allCourses: CourseWithProgress[]): AuthorCourse[] {
    const statuses: Array<'Published' | 'Draft' | 'Archived'> = ['Published', 'Draft', 'Archived'];
    
    return allCourses.slice(0, 8).map((course, index) => ({
      ...course,
      status: statuses[index % 3],
      createdDate: new Date(Date.now() - (index * 7 * 24 * 60 * 60 * 1000)).toISOString(),
      lastUpdated: new Date(Date.now() - (index * 2 * 24 * 60 * 60 * 1000)).toISOString()
    }));
  }

  private updateTabCounts() {
    this.tabs.forEach(tab => {
      tab.count = this.courses.filter(course => course.status === tab.id).length;
    });
  }

  onTabClick(tabId: 'Published' | 'Draft' | 'Archived') {
    this.activeTab = tabId;
    this.applyFiltersAndSort();
  }

  onSearchChange() {
    this.applyFiltersAndSort();
  }

  onSortChange() {
    this.applyFiltersAndSort();
  }

  private applyFiltersAndSort() {
    // Filter by tab
    let filtered = this.courses.filter(course => course.status === this.activeTab);

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(course => 
        course.title.toLowerCase().includes(query) ||
        course.subtitle.toLowerCase().includes(query) ||
        course.provider.name.toLowerCase().includes(query)
      );
    }

    // Sort courses
    filtered = this.sortCourses(filtered);

    this.filteredCourses = filtered;
  }

  private sortCourses(courses: AuthorCourse[]): AuthorCourse[] {
    return [...courses].sort((a, b) => {
      switch (this.sortBy) {
        case 'Latest':
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        case 'Highest Rating':
          return b.rating - a.rating;
        case 'Highest Reviewed':
          return b.reviewCount - a.reviewCount;
        case 'A-Z':
          return a.title.localeCompare(b.title);
        case 'Z-A':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });
  }

  navigateToHome() {
    this.router.navigate(['/dashboard']);
  }

  createNewCourse() {
    this.router.navigate(['/create-course']);
  }

  onCourseCardClick(course: AuthorCourse) {
    // Navigate to course editing/management page or course detail
    if (course.status === 'Published') {
      this.router.navigate(['/course', course.id]);
    } else {
      // For draft/archived, would typically navigate to course editor
      alert(`Edit course: ${course.title} - Course editor coming soon!`);
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Published': return 'status-published';
      case 'Draft': return 'status-draft';
      case 'Archived': return 'status-archived';
      default: return '';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
}
