import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, forkJoin } from 'rxjs';

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  authorId: number;
  provider: {
    name: string;
    logoUrl: string;
  };
  thumbnailUrl: string;
  rating: number;
  reviewCount: number;
  enrollmentCount: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  durationText: string;
  skills: string[];
  whatYoullLearn: string[];
  requirements: string[];
  status: string;
  publishedDate: string;
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

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getAllCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.baseUrl}/courses`);
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
} 