import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { HeaderComponent } from '../header/header.component';
import { CourseCardComponent } from '../course-card/course-card.component';
import { AuthService, User } from '../../services/auth.service';
import { CourseService, CourseWithProgress, UserStats, Course } from '../../services/course.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HeaderComponent, CourseCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  userStats: UserStats | null = null;
  lastViewedCourses: CourseWithProgress[] = [];
  newlyLaunchedCourses: Course[] = [];
  isLoading = true;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private courseService: CourseService
  ) {}

  ngOnInit() {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        if (user) {
          this.loadDashboardData();
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDashboardData() {
    if (!this.currentUser) return;

    this.isLoading = true;
    
    forkJoin({
      stats: this.courseService.getUserStats(this.currentUser.id.toString()),
      lastViewed: this.courseService.getLastViewedCourses(this.currentUser.id.toString()),
      newlyLaunched: this.courseService.getNewlyLaunchedCourses()
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: ({ stats, lastViewed, newlyLaunched }) => {
        this.userStats = stats;
        this.lastViewedCourses = lastViewed;
        this.newlyLaunchedCourses = newlyLaunched;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.isLoading = false;
      }
    });
  }

  // Carousel scroll functionality
  scrollCarousel(carouselId: string, direction: 'left' | 'right') {
    const carousel = document.getElementById(carouselId);
    if (carousel) {
      const scrollAmount = 300;
      const newScrollPosition = direction === 'left' 
        ? carousel.scrollLeft - scrollAmount 
        : carousel.scrollLeft + scrollAmount;
      
      carousel.scrollTo({
        left: newScrollPosition,
        behavior: 'smooth'
      });
    }
  }
} 