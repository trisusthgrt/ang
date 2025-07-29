import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, switchMap, forkJoin } from 'rxjs';
import { CourseService, Course, Lecture, UserCourseProgress, CurriculumSection } from '../../services/course.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-course-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './course-player.component.html',
  styleUrl: './course-player.component.scss'
})
export class CoursePlayerComponent implements OnInit, OnDestroy {
  @ViewChild('videoPlayer', { static: false }) videoPlayer!: ElementRef<HTMLVideoElement>;

  course: Course | null = null;
  currentLecture: Lecture | null = null;
  userProgress: UserCourseProgress | null = null;
  isLoading = true;
  
  // Route parameters
  courseId = '';
  lectureId = '';
  currentUser: any = null;

  // Video player state
  isPlaying = false;
  currentTime = 0;
  duration = 0;
  volume = 1;
  playbackRate = 1;
  isFullscreen = false;
  showControls = true;
  isMuted = false;

  // Content tabs
  activeTab = 'overview';
  tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'author', label: 'Author Details' },
    { id: 'testimonials', label: 'Testimonials' }
  ];

  // Curriculum state
  expandedSections = new Set<string>();

  private destroy$ = new Subject<void>();
  private controlsTimeout: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Get current user
    this.currentUser = this.authService.getCurrentUser();

    // Get route parameters and load data
    this.route.params
      .pipe(
        switchMap(params => {
          this.courseId = params['courseId'];
          this.lectureId = params['lectureId'];
          
          return forkJoin({
            course: this.courseService.getCourseById(this.courseId),
            lecture: this.courseService.getLectureById(this.courseId, this.lectureId),
            progress: this.courseService.getUserCourseProgress(this.courseId, this.currentUser?.id || '1')
          });
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: ({ course, lecture, progress }) => {
          this.course = course;
          this.currentLecture = lecture || null;
          this.userProgress = progress;
          this.isLoading = false;
          
          // Auto-expand the section containing current lecture
          this.autoExpandCurrentSection();
        },
        error: (error) => {
          console.error('Error loading course player:', error);
          this.isLoading = false;
          this.router.navigate(['/dashboard']);
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.controlsTimeout) {
      clearTimeout(this.controlsTimeout);
    }
  }

  // Video player methods
  togglePlay() {
    if (!this.videoPlayer) return;
    
    if (this.isPlaying) {
      this.videoPlayer.nativeElement.pause();
    } else {
      this.videoPlayer.nativeElement.play();
    }
  }

  onVideoLoaded() {
    if (this.videoPlayer) {
      this.duration = this.videoPlayer.nativeElement.duration;
    }
  }

  onTimeUpdate() {
    if (this.videoPlayer) {
      this.currentTime = this.videoPlayer.nativeElement.currentTime;
      
      // Update progress periodically
      this.updateWatchProgress();
    }
  }

  onVideoPlay() {
    this.isPlaying = true;
  }

  onVideoPause() {
    this.isPlaying = false;
  }

  seekTo(time: number) {
    if (this.videoPlayer) {
      this.videoPlayer.nativeElement.currentTime = time;
    }
  }

  setVolume(volume: number) {
    this.volume = volume;
    if (this.videoPlayer) {
      this.videoPlayer.nativeElement.volume = volume;
      this.isMuted = volume === 0;
    }
  }

  toggleMute() {
    if (this.isMuted) {
      this.setVolume(this.volume || 0.5);
    } else {
      this.setVolume(0);
    }
  }

  setPlaybackRate(rate: number) {
    this.playbackRate = rate;
    if (this.videoPlayer) {
      this.videoPlayer.nativeElement.playbackRate = rate;
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.videoPlayer.nativeElement.requestFullscreen();
      this.isFullscreen = true;
    } else {
      document.exitFullscreen();
      this.isFullscreen = false;
    }
  }

  onMouseMove() {
    this.showControls = true;
    if (this.controlsTimeout) {
      clearTimeout(this.controlsTimeout);
    }
    this.controlsTimeout = setTimeout(() => {
      if (this.isPlaying) {
        this.showControls = false;
      }
    }, 3000);
  }

  // Progress tracking
  private updateWatchProgress() {
    if (!this.currentLecture || !this.currentUser) return;

    const watchedPercentage = (this.currentTime / this.duration) * 100;
    const isCompleted = watchedPercentage >= 90; // Mark as completed at 90%

    this.courseService.updateLectureProgress(
      this.courseId,
      this.currentUser.id,
      this.lectureId,
      {
        watchedDuration: this.currentTime,
        totalDuration: this.duration,
        completed: isCompleted
      }
    ).pipe(takeUntil(this.destroy$))
    .subscribe(updatedProgress => {
      this.userProgress = updatedProgress;
    });
  }

  markLectureComplete() {
    if (!this.currentUser) return;

    this.courseService.markLectureComplete(
      this.courseId,
      this.currentUser.id,
      this.lectureId
    ).pipe(takeUntil(this.destroy$))
    .subscribe(updatedProgress => {
      this.userProgress = updatedProgress;
    });
  }

  // Curriculum navigation
  isLectureCompleted(lectureId: string): boolean {
    return this.userProgress?.lectureProgress.find(p => p.lectureId === lectureId)?.completed || false;
  }

  isCurrentLecture(lectureId: string): boolean {
    return this.lectureId === lectureId;
  }

  toggleSection(sectionId: string) {
    if (this.expandedSections.has(sectionId)) {
      this.expandedSections.delete(sectionId);
    } else {
      this.expandedSections.add(sectionId);
    }
  }

  isSectionExpanded(sectionId: string): boolean {
    return this.expandedSections.has(sectionId);
  }

  private autoExpandCurrentSection() {
    if (!this.course?.curriculum?.sections) return;

    for (const section of this.course.curriculum.sections) {
      if (section.lectures.some(lecture => lecture.id === this.lectureId)) {
        this.expandedSections.add(section.id);
        break;
      }
    }
  }

  onLectureClick(lectureId: string) {
    // Update progress for current lecture before navigating
    if (this.currentLecture && this.videoPlayer) {
      this.updateWatchProgress();
    }

    // Navigate to new lecture
    this.router.navigate(['/learn', this.courseId, 'lecture', lectureId]);
  }

  // Content tabs
  onTabClick(tabId: string) {
    this.activeTab = tabId;
  }

  // Utility methods
  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  formatDuration(duration: string): string {
    // Convert "03:00 min" to just "3:00"
    return duration.replace(' min', '');
  }

  getProgressPercentage(lectureId: string): number {
    const progress = this.userProgress?.lectureProgress.find(p => p.lectureId === lectureId);
    if (!progress || progress.totalDuration === 0) return 0;
    return (progress.watchedDuration / progress.totalDuration) * 100;
  }

  navigateToHome() {
    this.router.navigate(['/dashboard']);
  }

  getBreadcrumbs(): string[] {
    if (!this.course || !this.currentLecture) return ['Home'];
    return ['Home', this.course.title, this.currentLecture.title];
  }

  getStarArray(): number[] {
    return Array(5).fill(0).map((_, i) => i + 1);
  }

  isStarFilled(starIndex: number): boolean {
    return this.course ? starIndex <= this.course.rating : false;
  }

  getFormattedNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  }
}
