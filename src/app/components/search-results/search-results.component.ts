import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap, combineLatest } from 'rxjs';
import { HeaderComponent } from '../header/header.component';
import { FilterSidebarComponent } from '../filter-sidebar/filter-sidebar.component';
import { CourseCardComponent } from '../course-card/course-card.component';
import { CourseService, SearchFilters, FilterCounts, SearchResult, Course } from '../../services/course.service';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FilterSidebarComponent, CourseCardComponent],
  templateUrl: './search-results.component.html',
  styleUrl: './search-results.component.scss'
})
export class SearchResultsComponent implements OnInit, OnDestroy {
  searchQuery = '';
  activeFilters: SearchFilters = {};
  sortBy = 'latest';
  currentPage = 1;
  pageSize = 12;
  
  searchResults: SearchResult | null = null;
  filterCounts: FilterCounts | null = null;
  isLoading = true;
  
  sortOptions = [
    { value: 'latest', label: 'Latest' },
    { value: 'rating', label: 'Highest Rating' },
    { value: 'reviews', label: 'Highest Reviewed' },
    { value: 'a-z', label: 'A-Z' },
    { value: 'z-a', label: 'Z-A' }
  ];

  private searchSubject = new Subject<void>();
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService
  ) {}

  ngOnInit() {
    // Get query from URL parameters
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.searchQuery = params['q'] || '';
        this.loadData();
      });

    // Setup search debouncing
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(() => this.performSearch()),
        takeUntil(this.destroy$)
      )
      .subscribe(result => {
        this.searchResults = result;
        this.isLoading = false;
      });

    // Load filter counts
    this.loadFilterCounts();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData() {
    this.isLoading = true;
    this.loadFilterCounts();
    this.searchSubject.next();
  }

  private loadFilterCounts() {
    this.courseService.getFilterCounts(this.searchQuery)
      .pipe(takeUntil(this.destroy$))
      .subscribe(counts => {
        this.filterCounts = counts;
      });
  }

  private performSearch() {
    return this.courseService.searchCoursesAdvanced(
      this.searchQuery,
      this.activeFilters,
      this.sortBy,
      this.currentPage,
      this.pageSize
    );
  }

  onFiltersChange(filters: SearchFilters) {
    this.activeFilters = filters;
    this.currentPage = 1; // Reset to first page
    this.isLoading = true;
    this.searchSubject.next();
    this.loadFilterCounts(); // Update filter counts
  }

  onSortChange(sortBy: string) {
    this.sortBy = sortBy;
    this.currentPage = 1; // Reset to first page
    this.isLoading = true;
    this.searchSubject.next();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.isLoading = true;
    this.searchSubject.next();
    
    // Scroll to top of results
    document.querySelector('.search-results-container')?.scrollIntoView({ 
      behavior: 'smooth' 
    });
  }

  getTotalPages(): number {
    if (!this.searchResults) return 0;
    return Math.ceil(this.searchResults.filteredCount / this.pageSize);
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  getResultsText(): string {
    if (!this.searchResults) return '';
    
    const { filteredCount } = this.searchResults;
    const queryText = this.searchQuery ? ` for "${this.searchQuery}"` : '';
    
    return `${filteredCount} Result${filteredCount !== 1 ? 's' : ''}${queryText}`;
  }

  hasNewLaunchBadge(course: Course): boolean {
    const publishedDate = new Date(course.publishedDate);
    const now = new Date();
    const diffTime = now.getTime() - publishedDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= 30; // Show "New Launch" for courses published within 30 days
  }
} 