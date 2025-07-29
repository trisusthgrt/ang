import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CourseWithProgress } from '../../services/course.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-course-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './course-card.component.html',
  styleUrl: './course-card.component.scss'
})
export class CourseCardComponent {
  @Input() course!: CourseWithProgress;
  @Input() showProgress: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  onCardClick() {
    // Navigate to course detail page
    this.router.navigate(['/course', this.course.id]);
  }

  onStartLearning(event: Event) {
    event.stopPropagation(); // Prevent card click
    
    // Navigate to first lecture of the course
    // For demo purposes, navigate to lecture 1-1 (first lecture of first section)
    this.router.navigate(['/learn', this.course.id, 'lecture', '1-1']);
  }

  onContinueLearning(event: Event) {
    event.stopPropagation(); // Prevent card click
    
    // For demo purposes, navigate to the lecture where user left off
    // In a real app, this would use the user's last watched lecture
    const lastLectureId = this.getLastWatchedLectureId();
    this.router.navigate(['/learn', this.course.id, 'lecture', lastLectureId]);
  }

  private getLastWatchedLectureId(): string {
    // Mock implementation - in real app, this would come from user progress
    return '1-2'; // Return second lecture as demo
  }

  isUserEnrolled(): boolean {
    // Mock implementation - check if user is enrolled
    const currentUser = this.authService.getCurrentUser();
    return !!currentUser; // For demo, assume logged-in users are enrolled
  }

  hasProgress(): boolean {
    return this.showProgress && (this.course.progressPercent || 0) > 0;
  }

  getDifficultyColor(): string {
    switch (this.course.difficulty) {
      case 'Beginner': return '#22C55E';
      case 'Intermediate': return '#F59E0B';
      case 'Advanced': return '#EF4444';
      default: return '#6B7280';
    }
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  getProgressBadgeText(): string {
    if (this.course.progressPercent === 100) {
      return '100% Complete';
    } else if (this.course.progressPercent && this.course.progressPercent > 0) {
      return `${this.course.progressPercent}% Complete`;
    }
    return '';
  }

  getProgressBadgeClass(): string {
    if (this.course.progressPercent === 100) {
      return 'progress-complete';
    } else if (this.course.progressPercent && this.course.progressPercent > 0) {
      return 'progress-in-progress';
    }
    return '';
  }
} 