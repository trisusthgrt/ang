import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil, switchMap } from 'rxjs';
import { HeaderComponent } from '../header/header.component';
import { CourseService, Course } from '../../services/course.service';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, HeaderComponent, RouterModule],
  templateUrl: './course-detail.component.html',
  styleUrl: './course-detail.component.scss'
})
export class CourseDetailComponent implements OnInit, OnDestroy {
  course: Course | null = null;
  isLoading = true;
  activeTab = 'overview';
  
  // Curriculum accordion state
  expandedSections = new Set<string>();
  allSectionsExpanded = false;
  
  tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'content', label: 'Course Content' },
    { id: 'author', label: 'Author Details' },
    { id: 'testimonials', label: 'Testimonials' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService
  ) {}

  ngOnInit() {
    // Get course ID from route and load course data
    this.route.params
      .pipe(
        switchMap(params => {
          const courseId = params['id'];
          return this.courseService.getCourseById(courseId);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (course) => {
          this.course = course;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading course:', error);
          this.isLoading = false;
          // Redirect to dashboard if course not found
          this.router.navigate(['/dashboard']);
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTabClick(tabId: string) {
    this.activeTab = tabId;
  }

  onEnrollClick() {
    // Handle enrollment logic
    console.log('Enrolling in course:', this.course?.title);
    // This could trigger enrollment API call, modal, etc.
  }

  navigateToHome() {
    this.router.navigate(['/dashboard']);
  }

  getBreadcrumbs(): string[] {
    if (!this.course) return ['Home'];
    return ['Home', this.course.title];
  }

  getFormattedNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  }

  getDifficultyColor(): string {
    if (!this.course) return '#6B7280';
    switch (this.course.difficulty) {
      case 'Beginner': return '#22C55E';
      case 'Intermediate': return '#F59E0B';
      case 'Advanced': return '#EF4444';
      default: return '#6B7280';
    }
  }

  getStarArray(): number[] {
    return Array(5).fill(0).map((_, i) => i + 1);
  }

  isStarFilled(starIndex: number): boolean {
    return this.course ? starIndex <= this.course.rating : false;
  }

  // Curriculum accordion methods
  toggleSection(sectionId: string) {
    if (this.expandedSections.has(sectionId)) {
      this.expandedSections.delete(sectionId);
    } else {
      this.expandedSections.add(sectionId);
    }
    this.updateAllSectionsExpandedState();
  }

  isSectionExpanded(sectionId: string): boolean {
    return this.expandedSections.has(sectionId);
  }

  toggleAllSections() {
    if (this.allSectionsExpanded) {
      // Collapse all
      this.expandedSections.clear();
      this.allSectionsExpanded = false;
    } else {
      // Expand all
      this.course?.curriculum?.sections.forEach(section => {
        this.expandedSections.add(section.id);
      });
      this.allSectionsExpanded = true;
    }
  }

  private updateAllSectionsExpandedState() {
    const totalSections = this.course?.curriculum?.sections.length || 0;
    this.allSectionsExpanded = this.expandedSections.size === totalSections;
  }

  // Testimonials methods
  getTestimonialStars(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i + 1);
  }

  isTestimonialStarFilled(starIndex: number, rating: number): boolean {
    return starIndex <= rating;
  }

  // Related courses methods
  getRelatedCourseBadgeClass(badgeType: string): string {
    switch (badgeType) {
      case 'highest-rated': return 'badge-highest-rated';
      case 'bestseller': return 'badge-bestseller';
      case 'recruiter': return 'badge-recruiter';
      case 'new': return 'badge-new';
      default: return 'badge-default';
    }
  }
}
