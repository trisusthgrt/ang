import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil, interval } from 'rxjs';
import { HeaderComponent } from '../header/header.component';
import { CourseCardComponent } from '../course-card/course-card.component';
import { AuthService, User } from '../../services/auth.service';
import { CourseService, CourseWithProgress } from '../../services/course.service';
import { BannerService, Banner } from '../../services/banner.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HeaderComponent, CourseCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  
  currentUser: User | null = null;
  isLoading = true;
  
  // Statistics
  myGoals = 0;
  enrolledCourses = 0;
  certificatesEarned = 0;
  
  // Courses
  lastViewedCourses: CourseWithProgress[] = [];
  newlyLaunchedCourses: CourseWithProgress[] = [];
  
  // Banner Carousel
  activeBanners: Banner[] = [];
  currentBannerIndex = 0;
  autoPlayInterval: any;
  showBannerCarousel = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private courseService: CourseService,
    private bannerService: BannerService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadDashboardData();
    this.loadActiveBanners();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }
  }

  private loadDashboardData() {
    // Load user statistics
    this.myGoals = 3;
    this.enrolledCourses = 8;
    this.certificatesEarned = 2;

    // Load courses
    this.courseService.getAllCourses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (courses) => {
          // Simulate last viewed courses (first 5 with progress)
          this.lastViewedCourses = courses.slice(0, 5).map(course => ({
            ...course,
            progressPercent: Math.floor(Math.random() * 100) + 1
          }));

          // Simulate newly launched courses (last 5)
          this.newlyLaunchedCourses = courses.slice(-5).map(course => ({
            ...course,
            progressPercent: 0
          }));

          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading courses:', error);
          this.isLoading = false;
        }
      });
  }

  private loadActiveBanners() {
    this.bannerService.getActiveBanners()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (banners) => {
          this.activeBanners = banners;
          this.showBannerCarousel = banners.length > 0;
          
          if (this.showBannerCarousel) {
            this.startAutoPlay();
          }
        },
        error: (error) => {
          console.error('Error loading banners:', error);
          this.showBannerCarousel = false;
        }
      });
  }

  // Banner Carousel Methods
  private startAutoPlay() {
    if (this.activeBanners.length <= 1) return;
    
    this.autoPlayInterval = setInterval(() => {
      this.nextBanner();
    }, 5000); // Change banner every 5 seconds
  }

  private stopAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
  }

  nextBanner() {
    if (this.activeBanners.length > 1) {
      this.currentBannerIndex = (this.currentBannerIndex + 1) % this.activeBanners.length;
    }
  }

  prevBanner() {
    if (this.activeBanners.length > 1) {
      this.currentBannerIndex = this.currentBannerIndex === 0 
        ? this.activeBanners.length - 1 
        : this.currentBannerIndex - 1;
    }
  }

  goToBanner(index: number) {
    this.currentBannerIndex = index;
    this.stopAutoPlay();
    setTimeout(() => this.startAutoPlay(), 3000); // Restart autoplay after user interaction
  }

  onBannerMouseEnter() {
    this.stopAutoPlay();
  }

  onBannerMouseLeave() {
    this.startAutoPlay();
  }

  // Course Carousel Methods
  scrollCourses(direction: 'left' | 'right', carouselType: 'lastViewed' | 'newlyLaunched') {
    const carousel = document.querySelector(`.${carouselType}-carousel .courses-list`) as HTMLElement;
    if (carousel) {
      const scrollAmount = 320; // Width of one course card + gap
      const currentScroll = carousel.scrollLeft;
      
      if (direction === 'left') {
        carousel.scrollTo({
          left: currentScroll - scrollAmount,
          behavior: 'smooth'
        });
      } else {
        carousel.scrollTo({
          left: currentScroll + scrollAmount,
          behavior: 'smooth'
        });
      }
    }
  }

  canScrollLeft(carouselType: 'lastViewed' | 'newlyLaunched'): boolean {
    const carousel = document.querySelector(`.${carouselType}-carousel .courses-list`) as HTMLElement;
    return carousel ? carousel.scrollLeft > 0 : false;
  }

  canScrollRight(carouselType: 'lastViewed' | 'newlyLaunched'): boolean {
    const carousel = document.querySelector(`.${carouselType}-carousel .courses-list`) as HTMLElement;
    if (!carousel) return false;
    
    return carousel.scrollLeft < (carousel.scrollWidth - carousel.clientWidth);
  }

  // Course Navigation
  onCourseClick(course: CourseWithProgress) {
    this.router.navigate(['/course', course.id]);
  }
} 