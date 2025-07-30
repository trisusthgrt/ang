import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { HeaderComponent } from '../header/header.component';
import { CourseCardComponent } from '../course-card/course-card.component';
import { AuthService, User } from '../../services/auth.service';
import { CourseService, CourseWithProgress } from '../../services/course.service';

export interface AuthorCourse extends CourseWithProgress {
  status: string;
  createdDate: string;
  lastUpdated: string;
  description: string;
  author: string;
}

@Component({
  selector: 'app-my-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, CourseCardComponent],
  templateUrl: './my-courses.component.html',
  styleUrl: './my-courses.component.scss'
})
export class MyCoursesComponent implements OnInit, OnDestroy {
  
  currentUser: User | null = null;
  isLoading = true;
  
  // Tab management
  activeTab = 'published';
  tabs = [
    { id: 'published', label: 'Published', count: 0 },
    { id: 'draft', label: 'Draft', count: 0 },
    { id: 'archived', label: 'Archived', count: 0 }
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
  
  // Courses data
  allCourses: AuthorCourse[] = [];
  filteredCourses: AuthorCourse[] = [];
  
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private courseService: CourseService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }
    
    // Check if user has Author or Admin role
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
    this.isLoading = true;
    
    this.courseService.getAllCourses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (courses) => {
          // Filter courses based on user role and convert to AuthorCourse
          if (this.currentUser?.role === 'Admin') {
            // Admin can see all courses
            this.allCourses = courses.map(course => this.convertToAuthorCourse(course));
          } else {
            // Author can only see their own courses (simulate by taking first few)
            this.allCourses = courses.slice(0, 3).map(course => this.convertToAuthorCourse(course));
          }
          
          // Load published courses from localStorage (from course creation wizard)
          this.loadPublishedCourses();
          
          this.updateTabCounts();
          this.applyFilters();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading courses:', error);
          this.isLoading = false;
        }
      });
  }

  private convertToAuthorCourse(course: CourseWithProgress): AuthorCourse {
    return {
      ...course,
      status: this.getRandomStatus(),
      createdDate: this.getRandomDate(),
      lastUpdated: this.getRandomDate(),
      description: course.subtitle || 'No description available',
      author: course.provider?.name || 'Unknown Author'
    };
  }

  private loadPublishedCourses() {
    const publishedCourses = localStorage.getItem('publishedCourses');
    if (publishedCourses) {
      try {
        const courses = JSON.parse(publishedCourses);
        courses.forEach((course: any) => {
          this.allCourses.push({
            ...course,
            progressPercent: 0,
            status: 'published',
            createdDate: course.createdAt || new Date().toISOString(),
            lastUpdated: course.updatedAt || new Date().toISOString(),
            description: course.description || 'No description available',
            author: course.author || 'Unknown Author'
          });
        });
      } catch (error) {
        console.error('Error loading published courses:', error);
      }
    }
  }

  private getRandomStatus(): string {
    const statuses = ['published', 'draft', 'archived'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  private getRandomDate(): string {
    const start = new Date(2024, 0, 1);
    const end = new Date();
    const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return date.toISOString();
  }

  private updateTabCounts() {
    this.tabs.forEach(tab => {
      tab.count = this.allCourses.filter(course => course.status === tab.id).length;
    });
  }

  // Navigation
  navigateToHome() {
    this.router.navigate(['/dashboard']);
  }

  // Tab management
  onTabClick(tabId: string) {
    this.activeTab = tabId;
    this.applyFilters();
  }

  // Search and sort
  onSearchChange() {
    this.applyFilters();
  }

  onSortChange() {
    this.applyFilters();
  }

  private applyFilters() {
    let filtered = this.allCourses;
    
    // Filter by tab (status)
    filtered = filtered.filter(course => course.status === this.activeTab);
    
    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query) ||
        course.author.toLowerCase().includes(query)
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
          return (b.rating || 0) - (a.rating || 0);
        case 'Highest Reviewed':
          return (b.reviewCount || 0) - (a.reviewCount || 0);
        case 'A-Z':
          return a.title.localeCompare(b.title);
        case 'Z-A':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });
  }

  // Course actions
  createNewCourse() {
    this.router.navigate(['/create-course']);
  }

  onCourseCardClick(course: AuthorCourse) {
    this.router.navigate(['/course', course.id]);
  }

  // Utility methods
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'published': return 'status-published';
      case 'draft': return 'status-draft';
      case 'archived': return 'status-archived';
      default: return 'status-published';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
