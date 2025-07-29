import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, forkJoin, of } from 'rxjs';

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  thumbnailUrl: string;
  provider: {
    name: string;
    logoUrl: string;
  };
  difficulty: string;
  durationText: string;
  durationHours: number;
  rating: number;
  reviewCount: number;
  enrollmentCount: number;
  skills: string[];
  whatYoullLearn: string[];
  requirements: string[];
  publishedDate: string;
  lastUpdated: string;
  curriculum?: CourseCurriculum;
  authorDetails?: AuthorProfile;
  testimonials?: Testimonial[];
  relatedCourses?: RelatedCourse[];
}

export interface CourseCurriculum {
  totalSections: number;
  totalLectures: number;
  totalDuration: string;
  sections: CurriculumSection[];
}

export interface CurriculumSection {
  id: string;
  title: string;
  lectureCount: number;
  duration: string;
  lectures: Lecture[];
}

export interface Lecture {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'reading' | 'quiz' | 'assignment';
  videoUrl?: string;
  pdfUrl?: string;
  textContent?: string;
  description?: string;
}

export interface LectureProgress {
  lectureId: string;
  completed: boolean;
  watchedDuration: number;
  totalDuration: number;
  lastWatchedAt: Date;
}

export interface UserCourseProgress {
  courseId: string;
  userId: string;
  lectureProgress: LectureProgress[];
  overallProgress: number;
  lastAccessedLecture?: string;
}

export interface AuthorProfile {
  name: string;
  title: string;
  avatar: string;
  biography: string;
  stats: {
    bestSellingInstructor: boolean;
    awsCertified: boolean;
    kafkaGuru: boolean;
  };
  faqs: AuthorFAQ[];
}

export interface AuthorFAQ {
  question: string;
  answer: string;
}

export interface Testimonial {
  id: string;
  rating: number;
  reviewText: string;
  reviewer: {
    name: string;
    avatar: string;
    affiliation: string;
  };
}

export interface RelatedCourse {
  id: string;
  title: string;
  thumbnailUrl: string;
  duration: string;
  rating: number;
  reviewCount: number;
  badge: string;
  badgeType: 'highest-rated' | 'bestseller' | 'recruiter' | 'new';
}

export interface UserEnrollment {
  courseId: number;
  progressPercent: number;
}

export interface UserStats {
  myGoals: number;
  enrolledCourses: number;
  certificatesEarned: number;
}

export interface CourseWithProgress extends Course {
  progressPercent?: number;
  isComplete?: boolean;
}

export interface SearchFilters {
  query?: string;
  duration?: string[];
  rating?: number;
  publishedDate?: string;
  courseLevel?: string[];
  author?: string[];
  topics?: string[];
}

export interface SearchResult {
  courses: Course[];
  totalCount: number;
  filteredCount: number;
}

export interface FilterOption {
  label: string;
  value: string;
  count: number;
}

export interface FilterCounts {
  duration: FilterOption[];
  rating: FilterOption[];
  publishedDate: FilterOption[];
  courseLevel: FilterOption[];
  author: FilterOption[];
  topics: FilterOption[];
}

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getAllCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.baseUrl}/courses`);
  }

  getCourseById(courseId: string): Observable<Course> {
    return this.http.get<Course>(`${this.baseUrl}/courses/${courseId}`).pipe(
      map(course => this.enrichCourseData(course))
    );
  }

  private enrichCourseData(course: Course): Course {
    // Add mock curriculum data
    course.curriculum = this.getMockCurriculum();
    
    // Add mock author details
    course.authorDetails = this.getMockAuthorDetails();
    
    // Add mock testimonials
    course.testimonials = this.getMockTestimonials();
    
    // Add mock related courses
    course.relatedCourses = this.getMockRelatedCourses();
    
    return course;
  }

  private getMockCurriculum(): CourseCurriculum {
    return {
      totalSections: 7,
      totalLectures: 25,
      totalDuration: '18h 30m',
      sections: [
        {
          id: '1',
          title: 'Introduction',
          lectureCount: 5,
          duration: '15 mins',
          lectures: [
            { id: '1-1', title: 'Course Overview', duration: '03:00 min', type: 'video' },
            { id: '1-2', title: 'Google Analytics Overview', duration: '03:00 min', type: 'video' },
            { id: '1-3', title: 'How to Set Up a Google Analytics Demo Account', duration: '03:00 min', type: 'video' },
            { id: '1-4', title: 'Google Analytics Dictionary - The Top 50 Terms to Know', duration: '03:00 min', type: 'reading' },
            { id: '1-5', title: 'A Note on Google Analytics 4 Setup', duration: '03:00 min', type: 'video' }
          ]
        },
        {
          id: '2',
          title: 'How To Setup Google Analytics Like A Pro',
          lectureCount: 5,
          duration: '15 mins',
          lectures: [
            { id: '2-1', title: 'Setting Up Google Analytics Account', duration: '03:00 min', type: 'video' },
            { id: '2-2', title: 'Configuring Goals and Events', duration: '03:00 min', type: 'video' },
            { id: '2-3', title: 'Custom Dimensions and Metrics', duration: '03:00 min', type: 'video' },
            { id: '2-4', title: 'E-commerce Tracking Setup', duration: '03:00 min', type: 'video' },
            { id: '2-5', title: 'Advanced Configuration Options', duration: '03:00 min', type: 'video' }
          ]
        },
        {
          id: '3',
          title: 'How To Analysis Reports & Increase Traffic And Sales',
          lectureCount: 5,
          duration: '15 mins',
          lectures: [
            { id: '3-1', title: 'Understanding Audience Reports', duration: '03:00 min', type: 'video' },
            { id: '3-2', title: 'Acquisition Report Analysis', duration: '03:00 min', type: 'video' },
            { id: '3-3', title: 'Behavior Flow Analysis', duration: '03:00 min', type: 'video' },
            { id: '3-4', title: 'Conversion Funnel Optimization', duration: '03:00 min', type: 'video' },
            { id: '3-5', title: 'Real-time Reporting', duration: '03:00 min', type: 'video' }
          ]
        },
        {
          id: '4',
          title: 'More Google Analytics Tips And Tricks',
          lectureCount: 5,
          duration: '15 mins',
          lectures: [
            { id: '4-1', title: 'Advanced Segmentation Techniques', duration: '03:00 min', type: 'video' },
            { id: '4-2', title: 'Custom Dashboard Creation', duration: '03:00 min', type: 'video' },
            { id: '4-3', title: 'Automated Reporting Setup', duration: '03:00 min', type: 'video' },
            { id: '4-4', title: 'Integration with Other Tools', duration: '03:00 min', type: 'video' },
            { id: '4-5', title: 'Advanced Filtering Techniques', duration: '03:00 min', type: 'video' }
          ]
        },
        {
          id: '5',
          title: 'Conclusion',
          lectureCount: 5,
          duration: '15 mins',
          lectures: [
            { id: '5-1', title: 'Course Summary', duration: '03:00 min', type: 'video' },
            { id: '5-2', title: 'Next Steps in Analytics', duration: '03:00 min', type: 'video' },
            { id: '5-3', title: 'Resources and Further Reading', duration: '03:00 min', type: 'reading' },
            { id: '5-4', title: 'Final Assessment', duration: '03:00 min', type: 'quiz' },
            { id: '5-5', title: 'Certificate Requirements', duration: '03:00 min', type: 'reading' }
          ]
        }
      ]
    };
  }

  private getMockAuthorDetails(): AuthorProfile {
    return {
      name: 'Stephane Maarek',
      title: 'AWS Certified Cloud Practitioner,Solutions Architect,Developer',
      avatar: 'https://i.pravatar.cc/150?img=1',
      biography: `Stephane is a solutions architect, consultant and software developer that has a particular interest in all things related to Big Data. He's also a many-times best seller instructor on Udemy for his courses on AWS and Apache Kafka.

Stephane is recognized as an AWS Hero and is an AWS Certified Solutions Architect Professional & AWS Certified DevOps Professional. He loves to teach people how to use the AWS platform, to get them ready for their AWS certifications, and most importantly for the real world.

He also loves Apache Kafka. He used on the Program Committee organising the Kafka Summit in New York, London and San Francisco. He also was an active member of the Apache Kafka community, and has authored blogs on Medium and Confluent.

During his spare time he enjoys cooking, practicing yoga, surfing, watching TV shows, and travelling to awesome destinations!`,
      stats: {
        bestSellingInstructor: true,
        awsCertified: true,
        kafkaGuru: true
      },
      faqs: [
        {
          question: 'FAQ: In which order should you learn?',
          answer: 'AWS Cloud: Start with AWS Certified Cloud Practitioner or AWS Certified Solutions Architect Associate, then move on to AWS Certified Developer Associate or AWS Certified SysOps Administrator, or take a specialty certification of your choosing. You can also learn about AI with the AWS Certified Practitioner course!'
        },
        {
          question: 'Apache Kafka: Start with Apache Kafka for Beginners, then you can learn Connect, Streams and Schema Registry if you\'re a developer, and Setup and Monitoring courses if you\'re an admin. Both tracks are needed to pass the Confluent Kafka certification.',
          answer: 'AWS Cloud: Start with AWS Certified Cloud Practitioner or AWS Certified Solutions Architect Associate, then move on to AWS Certified Developer Associate or AWS Certified SysOps Administrator, or take a specialty certification of your choosing.'
        }
      ]
    };
  }

  private getMockTestimonials(): Testimonial[] {
    return [
      {
        id: '1',
        rating: 4.8,
        reviewText: 'The Google Data Analytics course was a pivotal moment in my career. I went from having a basic understanding of spreadsheets to confidently building sophisticated Tableau, Google Analytics, and SQL projects for users.',
        reviewer: {
          name: 'Wade Warren',
          avatar: 'https://i.pravatar.cc/150?img=11',
          affiliation: 'Learning for US'
        }
      },
      {
        id: '2',
        rating: 4.7,
        reviewText: 'I was stuck in a marketing role with no room for growth. This data analytics program was a game-changer. The curriculum is incredibly comprehensive and practical. The hands-on assignments, insightful capstone project, gave me a tangible portfolio to show potential employers. Within three months of graduating, I transitioned to a Data Scientist role at a top tech firm. This course was the best investment in my career.',
        reviewer: {
          name: 'Jacob Jones',
          avatar: 'https://i.pravatar.cc/150?img=12',
          affiliation: 'Learning for India'
        }
      },
      {
        id: '3',
        rating: 4.5,
        reviewText: 'As a marketing professional, I knew I needed to become more data-driven. This course was the perfect entry point. The lessons were clear and engaging, and I went from zero programming knowledge to writing my own custom scripts and producing data analysis and making insights way better. The hands-on projects focused on real-world business problems and challenges to help me apply my knowledge and feel confident in the skills.',
        reviewer: {
          name: 'Bessie Cooper',
          avatar: 'https://i.pravatar.cc/150?img=13',
          affiliation: 'Learning for UK'
        }
      },
      {
        id: '4',
        rating: 4.5,
        reviewText: 'I had a background in finance but wanted to pivot into a more analytical role. The Google Data Analytics certificate gave me the structured learning path I needed. The instructors are fantastic at breaking down complex topics like statistical analysis and machine learning concepts. The practical assignments, real-world business problems and challenges help me apply everything I was learning with a clear deadline shortly after completion. Highly recommended!',
        reviewer: {
          name: 'Ronald Richards',
          avatar: 'https://i.pravatar.cc/150?img=14',
          affiliation: 'Learning for India'
        }
      }
    ];
  }

  private getMockRelatedCourses(): RelatedCourse[] {
    return [
      {
        id: 'related-1',
        title: 'Artificial Intelligence Professional Certificate',
        thumbnailUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=300&h=200&fit=crop',
        duration: '30 Hours',
        rating: 4.8,
        reviewCount: 52838,
        badge: 'Highest Rated',
        badgeType: 'highest-rated'
      },
      {
        id: 'related-2',
        title: 'Machine Learning A-Z: AI, Python & R',
        thumbnailUrl: 'https://images.unsplash.com/photo-1516110833967-0b5715ca94c8?w=300&h=200&fit=crop',
        duration: '24 Hours',
        rating: 4.6,
        reviewCount: 15843,
        badge: 'Highest Rated',
        badgeType: 'highest-rated'
      },
      {
        id: 'related-3',
        title: 'The Data Science Course: Complete Data Science Bootcamp',
        thumbnailUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&h=200&fit=crop',
        duration: '34 Hours',
        rating: 4.5,
        reviewCount: 19559,
        badge: 'Bestseller',
        badgeType: 'bestseller'
      },
      {
        id: 'related-4',
        title: 'Python for Data Science and Machine Learning Bootcamp',
        thumbnailUrl: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=300&h=200&fit=crop',
        duration: '45.5 Hours',
        rating: 4.2,
        reviewCount: 27659,
        badge: 'Recruiter',
        badgeType: 'recruiter'
      },
      {
        id: 'related-5',
        title: 'Tableau for Beginners: Get Certified in Data Visualization',
        thumbnailUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=200&fit=crop',
        duration: '15 Hours',
        rating: 4.0,
        reviewCount: 25659,
        badge: 'Bestseller',
        badgeType: 'bestseller'
      }
    ];
  }

  // Progress tracking methods
  getLectureById(courseId: string, lectureId: string): Observable<Lecture | undefined> {
    return this.getCourseById(courseId).pipe(
      map(course => {
        for (const section of course.curriculum?.sections || []) {
          const lecture = section.lectures.find(l => l.id === lectureId);
          if (lecture) {
            return this.enrichLectureData(lecture);
          }
        }
        return undefined;
      })
    );
  }

  getUserCourseProgress(courseId: string, userId: string): Observable<UserCourseProgress> {
    const storageKey = `course_progress_${courseId}_${userId}`;
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      return of(JSON.parse(stored));
    }

    // Initialize empty progress
    const defaultProgress: UserCourseProgress = {
      courseId,
      userId,
      lectureProgress: [],
      overallProgress: 0
    };

    return of(defaultProgress);
  }

  updateLectureProgress(courseId: string, userId: string, lectureId: string, progress: Partial<LectureProgress>): Observable<UserCourseProgress> {
    return this.getUserCourseProgress(courseId, userId).pipe(
      map(userProgress => {
        // Update or create lecture progress
        const existingIndex = userProgress.lectureProgress.findIndex(p => p.lectureId === lectureId);
        
        const updatedProgress: LectureProgress = {
          lectureId,
          completed: false,
          watchedDuration: 0,
          totalDuration: 0,
          lastWatchedAt: new Date(),
          ...progress
        };

        if (existingIndex >= 0) {
          userProgress.lectureProgress[existingIndex] = updatedProgress;
        } else {
          userProgress.lectureProgress.push(updatedProgress);
        }

        // Update last accessed lecture
        userProgress.lastAccessedLecture = lectureId;

        // Calculate overall progress
        userProgress.overallProgress = this.calculateOverallProgress(userProgress.lectureProgress);

        // Save to localStorage
        const storageKey = `course_progress_${courseId}_${userId}`;
        localStorage.setItem(storageKey, JSON.stringify(userProgress));

        return userProgress;
      })
    );
  }

  markLectureComplete(courseId: string, userId: string, lectureId: string): Observable<UserCourseProgress> {
    return this.updateLectureProgress(courseId, userId, lectureId, {
      completed: true,
      lastWatchedAt: new Date()
    });
  }

  private calculateOverallProgress(lectureProgress: LectureProgress[]): number {
    if (lectureProgress.length === 0) return 0;
    
    const completedCount = lectureProgress.filter(p => p.completed).length;
    return Math.round((completedCount / lectureProgress.length) * 100);
  }

  private enrichLectureData(lecture: Lecture): Lecture {
    // Add mock video URLs and content based on lecture type
    const enriched = { ...lecture };
    
    if (lecture.type === 'video') {
      enriched.videoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
      enriched.description = `Learn about ${lecture.title} through this comprehensive video tutorial.`;
    } else if (lecture.type === 'reading') {
      enriched.pdfUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
      enriched.textContent = `This is the text content for ${lecture.title}. Here you'll find detailed explanations, examples, and additional resources to help you understand the concepts covered in this lesson.`;
    }

    return enriched;
  }

  getUserEnrollments(userId: string): Observable<UserEnrollment[]> {
    return this.http.get<Record<string, UserEnrollment[]>>(`${this.baseUrl}/userEnrollments`).pipe(
      map(enrollments => enrollments[userId] || [])
    );
  }

  getUserStats(userId: string): Observable<UserStats> {
    return this.getUserEnrollments(userId).pipe(
      map(enrollments => {
        const certificatesEarned = enrollments.filter(e => e.progressPercent === 100).length;
        return {
          myGoals: 3, // Static for now, could be made dynamic
          enrolledCourses: enrollments.length,
          certificatesEarned: certificatesEarned
        };
      })
    );
  }

  getLastViewedCourses(userId: string): Observable<CourseWithProgress[]> {
    return forkJoin({
      courses: this.getAllCourses(),
      enrollments: this.getUserEnrollments(userId)
    }).pipe(
      map(({ courses, enrollments }) => {
        return enrollments
          .map(enrollment => {
            const course = courses.find(c => c.id === enrollment.courseId.toString());
            if (course) {
              return {
                ...course,
                progressPercent: enrollment.progressPercent,
                isComplete: enrollment.progressPercent === 100
              };
            }
            return null;
          })
          .filter(course => course !== null)
          .sort((a, b) => (b?.progressPercent || 0) - (a?.progressPercent || 0)) as CourseWithProgress[];
      })
    );
  }

  getNewlyLaunchedCourses(): Observable<Course[]> {
    return this.getAllCourses().pipe(
      map(courses => {
        return courses
          .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime())
          .slice(0, 6); // Get latest 6 courses
      })
    );
  }

  searchCourses(query: string): Observable<Course[]> {
    return this.getAllCourses().pipe(
      map(courses => {
        if (!query.trim()) return [];
        return courses.filter(course => 
          course.title.toLowerCase().includes(query.toLowerCase()) ||
          course.subtitle.toLowerCase().includes(query.toLowerCase()) ||
          course.skills.some(skill => skill.toLowerCase().includes(query.toLowerCase()))
        ).slice(0, 5); // Limit to 5 suggestions
      })
    );
  }

  // Advanced search with filters and sorting
  searchCoursesAdvanced(
    query: string = '',
    filters: SearchFilters = {},
    sortBy: string = 'latest',
    page: number = 1,
    pageSize: number = 12
  ): Observable<SearchResult> {
    return this.getAllCourses().pipe(
      map(courses => {
        let filteredCourses = courses;

        // Text search
        if (query.trim()) {
          filteredCourses = filteredCourses.filter(course =>
            course.title.toLowerCase().includes(query.toLowerCase()) ||
            course.subtitle.toLowerCase().includes(query.toLowerCase()) ||
            course.skills.some(skill => skill.toLowerCase().includes(query.toLowerCase()))
          );
        }

        // Apply filters
        if (filters.duration && filters.duration.length > 0) {
          filteredCourses = filteredCourses.filter(course => {
            return filters.duration!.some(d => this.matchesDuration(course.durationText, d));
          });
        }

        if (filters.rating) {
          filteredCourses = filteredCourses.filter(course => course.rating >= filters.rating!);
        }

        if (filters.publishedDate) {
          filteredCourses = filteredCourses.filter(course => 
            this.matchesPublishedDate(course.publishedDate, filters.publishedDate!)
          );
        }

        if (filters.courseLevel && filters.courseLevel.length > 0) {
          filteredCourses = filteredCourses.filter(course => 
            filters.courseLevel!.includes(course.difficulty)
          );
        }

        // Sort courses
        filteredCourses = this.sortCourses(filteredCourses, sortBy);

        // Calculate pagination
        const totalCount = courses.length;
        const filteredCount = filteredCourses.length;
        const startIndex = (page - 1) * pageSize;
        const paginatedCourses = filteredCourses.slice(startIndex, startIndex + pageSize);

        return {
          courses: paginatedCourses,
          totalCount,
          filteredCount
        };
      })
    );
  }

  getFilterCounts(query: string = ''): Observable<FilterCounts> {
    return this.getAllCourses().pipe(
      map(courses => {
        let baseCourses = courses;

        // Apply text search to base courses
        if (query.trim()) {
          baseCourses = baseCourses.filter(course =>
            course.title.toLowerCase().includes(query.toLowerCase()) ||
            course.subtitle.toLowerCase().includes(query.toLowerCase()) ||
            course.skills.some(skill => skill.toLowerCase().includes(query.toLowerCase()))
          );
        }

        return {
          duration: this.calculateDurationCounts(baseCourses),
          rating: this.calculateRatingCounts(baseCourses),
          publishedDate: this.calculatePublishedDateCounts(baseCourses),
          courseLevel: this.calculateCourseLevelCounts(baseCourses),
          author: this.calculateAuthorCounts(baseCourses),
          topics: this.calculateTopicsCounts(baseCourses)
        };
      })
    );
  }

  private matchesDuration(courseDuration: string, filterDuration: string): boolean {
    const duration = courseDuration.toLowerCase();
    switch (filterDuration) {
      case '<1week': return duration.includes('day') || duration.includes('hour');
      case '1-4weeks': return duration.includes('week') && !duration.includes('month');
      case '1-3months': return duration.includes('month') && !duration.includes('6');
      case '3-6months': return duration.includes('6 month') || duration.includes('5 month') || duration.includes('4 month');
      case '6-12months': return duration.includes('year') || duration.includes('12 month') || duration.includes('11 month');
      default: return true;
    }
  }

  private matchesPublishedDate(publishedDate: string, filter: string): boolean {
    const courseDate = new Date(publishedDate);
    const now = new Date();
    const diffTime = now.getTime() - courseDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    switch (filter) {
      case 'thisweek': return diffDays <= 7;
      case 'thismonth': return diffDays <= 30;
      case 'last6months': return diffDays <= 180;
      case 'thisyear': return diffDays <= 365;
      default: return true;
    }
  }

  private sortCourses(courses: Course[], sortBy: string): Course[] {
    switch (sortBy) {
      case 'latest':
        return courses.sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
      case 'rating':
        return courses.sort((a, b) => b.rating - a.rating);
      case 'reviews':
        return courses.sort((a, b) => b.reviewCount - a.reviewCount);
      case 'a-z':
        return courses.sort((a, b) => a.title.localeCompare(b.title));
      case 'z-a':
        return courses.sort((a, b) => b.title.localeCompare(a.title));
      default:
        return courses;
    }
  }

  private calculateDurationCounts(courses: Course[]): FilterOption[] {
    const durations = ['<1week', '1-4weeks', '1-3months', '3-6months', '6-12months'];
    return durations.map(duration => ({
      label: this.getDurationLabel(duration),
      value: duration,
      count: courses.filter(c => this.matchesDuration(c.durationText, duration)).length
    }));
  }

  private calculateRatingCounts(courses: Course[]): FilterOption[] {
    const ratings = [4.5, 4.0, 3.5, 3.0];
    return ratings.map(rating => ({
      label: `${rating} & up`,
      value: rating.toString(),
      count: courses.filter(c => c.rating >= rating).length
    }));
  }

  private calculatePublishedDateCounts(courses: Course[]): FilterOption[] {
    const dates = ['thisweek', 'thismonth', 'last6months', 'thisyear'];
    return dates.map(date => ({
      label: this.getPublishedDateLabel(date),
      value: date,
      count: courses.filter(c => this.matchesPublishedDate(c.publishedDate, date)).length
    }));
  }

  private calculateCourseLevelCounts(courses: Course[]): FilterOption[] {
    const levels = ['Beginner', 'Intermediate', 'Advanced'];
    return levels.map(level => ({
      label: level,
      value: level,
      count: courses.filter(c => c.difficulty === level).length
    }));
  }

  private calculateAuthorCounts(courses: Course[]): FilterOption[] {
    const authorCounts = new Map<string, number>();
    courses.forEach(course => {
      const author = course.provider.name;
      authorCounts.set(author, (authorCounts.get(author) || 0) + 1);
    });
    
    return Array.from(authorCounts.entries())
      .map(([author, count]) => ({ label: author, value: author, count }))
      .sort((a, b) => b.count - a.count);
  }

  private calculateTopicsCounts(courses: Course[]): FilterOption[] {
    const topicCounts = new Map<string, number>();
    courses.forEach(course => {
      course.skills.forEach(skill => {
        topicCounts.set(skill, (topicCounts.get(skill) || 0) + 1);
      });
    });
    
    return Array.from(topicCounts.entries())
      .map(([topic, count]) => ({ label: topic, value: topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Top 20 topics
  }

  private getDurationLabel(duration: string): string {
    switch (duration) {
      case '<1week': return '< 1 week';
      case '1-4weeks': return '1 - 4 weeks';
      case '1-3months': return '1 - 3 Months';
      case '3-6months': return '3 - 6 Months';
      case '6-12months': return '6 - 12 Months';
      default: return duration;
    }
  }

  private getPublishedDateLabel(date: string): string {
    switch (date) {
      case 'thisweek': return 'This week';
      case 'thismonth': return 'This Month';
      case 'last6months': return 'Last 6 Months';
      case 'thisyear': return 'This year';
      default: return date;
    }
  }
} 