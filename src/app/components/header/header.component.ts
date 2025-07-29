import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';
import { AuthService, User } from '../../services/auth.service';
import { CourseService, Course } from '../../services/course.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput') searchInput!: ElementRef;
  
  currentUser: User | null = null;
  searchQuery = '';
  searchResults: Course[] = [];
  isSearchFocused = false;
  showUserDropdown = false;
  productName = 'LearnTech Academy'; // You can change this
  
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private courseService: CourseService,
    private router: Router
  ) {}

  ngOnInit() {
    // Subscribe to current user
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });

    // Setup search functionality with debounce
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(query => this.courseService.searchCourses(query)),
        takeUntil(this.destroy$)
      )
      .subscribe(results => {
        this.searchResults = results;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    this.searchQuery = query;
    this.searchSubject.next(query);
  }

  onSearchFocus() {
    this.isSearchFocused = true;
  }

  onSearchBlur() {
    // Delay hiding to allow click on search results
    setTimeout(() => {
      this.isSearchFocused = false;
    }, 200);
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchResults = [];
    this.searchInput.nativeElement.focus();
  }

  selectCourse(course: Course) {
    // Handle course selection - for now just clear search
    this.searchQuery = course.title;
    this.searchResults = [];
    this.isSearchFocused = false;
    console.log('Selected course:', course);
  }

  toggleUserDropdown() {
    this.showUserDropdown = !this.showUserDropdown;
  }

  closeUserDropdown() {
    this.showUserDropdown = false;
  }

  navigateToProfile() {
    this.closeUserDropdown();
    console.log('Navigate to profile');
  }

  navigateToAdminConsole() {
    this.closeUserDropdown();
    console.log('Navigate to admin console');
  }

  navigateToMyCourses() {
    this.closeUserDropdown();
    console.log('Navigate to my courses');
  }

  navigateToBlog() {
    this.closeUserDropdown();
    console.log('Navigate to blog');
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.closeUserDropdown();
  }

  // Close dropdowns when clicking outside
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.search-container')) {
      this.isSearchFocused = false;
    }
    if (!target.closest('.user-profile-container')) {
      this.showUserDropdown = false;
    }
  }
} 