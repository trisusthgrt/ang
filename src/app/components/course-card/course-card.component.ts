import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseWithProgress } from '../../services/course.service';

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