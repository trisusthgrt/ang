import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchFilters, FilterCounts, FilterOption } from '../../services/course.service';

@Component({
  selector: 'app-filter-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-sidebar.component.html',
  styleUrl: './filter-sidebar.component.scss'
})
export class FilterSidebarComponent implements OnInit {
  @Input() filterCounts: FilterCounts | null = null;
  @Input() activeFilters: SearchFilters = {};
  @Output() filtersChange = new EventEmitter<SearchFilters>();

  // Section collapse states
  collapsedSections = {
    duration: false,
    rating: false,
    publishedDate: false,
    courseLevel: false,
    author: true, // Start collapsed
    topics: true  // Start collapsed
  };

  ngOnInit() {
    // Initialize filters if not provided
    if (!this.activeFilters.duration) this.activeFilters.duration = [];
    if (!this.activeFilters.courseLevel) this.activeFilters.courseLevel = [];
    if (!this.activeFilters.author) this.activeFilters.author = [];
    if (!this.activeFilters.topics) this.activeFilters.topics = [];
  }

  toggleSection(section: keyof typeof this.collapsedSections) {
    this.collapsedSections[section] = !this.collapsedSections[section];
  }

  onDurationChange(duration: string, checked: boolean) {
    if (!this.activeFilters.duration) this.activeFilters.duration = [];
    
    if (checked) {
      this.activeFilters.duration.push(duration);
    } else {
      this.activeFilters.duration = this.activeFilters.duration.filter(d => d !== duration);
    }
    
    this.emitFilters();
  }

  onRatingChange(rating: number) {
    this.activeFilters.rating = rating;
    this.emitFilters();
  }

  onPublishedDateChange(date: string) {
    this.activeFilters.publishedDate = this.activeFilters.publishedDate === date ? undefined : date;
    this.emitFilters();
  }

  onCourseLevelChange(level: string, checked: boolean) {
    if (!this.activeFilters.courseLevel) this.activeFilters.courseLevel = [];
    
    if (checked) {
      this.activeFilters.courseLevel.push(level);
    } else {
      this.activeFilters.courseLevel = this.activeFilters.courseLevel.filter(l => l !== level);
    }
    
    this.emitFilters();
  }

  onAuthorChange(author: string, checked: boolean) {
    if (!this.activeFilters.author) this.activeFilters.author = [];
    
    if (checked) {
      this.activeFilters.author.push(author);
    } else {
      this.activeFilters.author = this.activeFilters.author.filter(a => a !== author);
    }
    
    this.emitFilters();
  }

  onTopicChange(topic: string, checked: boolean) {
    if (!this.activeFilters.topics) this.activeFilters.topics = [];
    
    if (checked) {
      this.activeFilters.topics.push(topic);
    } else {
      this.activeFilters.topics = this.activeFilters.topics.filter(t => t !== topic);
    }
    
    this.emitFilters();
  }

  clearAllFilters() {
    this.activeFilters = {
      duration: [],
      courseLevel: [],
      author: [],
      topics: []
    };
    this.emitFilters();
  }

  isDurationChecked(duration: string): boolean {
    return this.activeFilters.duration?.includes(duration) || false;
  }

  isCourseLevelChecked(level: string): boolean {
    return this.activeFilters.courseLevel?.includes(level) || false;
  }

  isAuthorChecked(author: string): boolean {
    return this.activeFilters.author?.includes(author) || false;
  }

  isTopicChecked(topic: string): boolean {
    return this.activeFilters.topics?.includes(topic) || false;
  }

  isRatingSelected(rating: number): boolean {
    return this.activeFilters.rating === rating;
  }

  isPublishedDateSelected(date: string): boolean {
    return this.activeFilters.publishedDate === date;
  }

  getAllPublishedDateCount(): number {
    if (!this.filterCounts?.publishedDate) return 0;
    return this.filterCounts.publishedDate.reduce((sum, opt) => sum + opt.count, 0);
  }

  private emitFilters() {
    this.filtersChange.emit({ ...this.activeFilters });
  }

  generateStars(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i + 1);
  }

  isStarFilled(starIndex: number, rating: number): boolean {
    return starIndex <= rating;
  }

  hasActiveFilters(): boolean {
    return !!(
      (this.activeFilters.duration && this.activeFilters.duration.length > 0) ||
      this.activeFilters.rating ||
      this.activeFilters.publishedDate ||
      (this.activeFilters.courseLevel && this.activeFilters.courseLevel.length > 0) ||
      (this.activeFilters.author && this.activeFilters.author.length > 0) ||
      (this.activeFilters.topics && this.activeFilters.topics.length > 0)
    );
  }
} 