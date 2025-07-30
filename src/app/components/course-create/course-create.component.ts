import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { HeaderComponent } from '../header/header.component';
import { AuthService, User } from '../../services/auth.service';

export interface CourseSection {
  id: string;
  title: string;
  lectures: CourseLecture[];
  order: number;
}

export interface CourseLecture {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'topic-content' | 'pdf';
  duration: string;
  videoUrl?: string;
  textContent?: string;
  pdfUrl?: string;
  order: number;
}

export interface CourseCreationData {
  // Step 1: Basic Details
  title: string;
  description: string;
  thumbnailUrl: string;
  
  // Step 2: Course Content
  sections: CourseSection[];
  
  // Step 3: Overview
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  whatYoullLearn: string[];
  skillsYoullGain: string[];
  prerequisites: string[];
  softwareRequirements: string[];
  price: number;
  category: string;
}

@Component({
  selector: 'app-course-create',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HeaderComponent],
  templateUrl: './course-create.component.html',
  styleUrl: './course-create.component.scss'
})
export class CourseCreateComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  currentStep = 1;
  totalSteps = 3;
  
  // Forms for each step
  basicDetailsForm!: FormGroup;
  courseContentForm!: FormGroup;
  overviewForm!: FormGroup;
  
  // Course data
  courseData: CourseCreationData = {
    title: '',
    description: '',
    thumbnailUrl: '',
    sections: [],
    duration: '',
    level: 'Beginner',
    whatYoullLearn: [''],
    skillsYoullGain: [''],
    prerequisites: [''],
    softwareRequirements: [''],
    price: 0,
    category: ''
  };

  // Step definitions
  steps = [
    { id: 1, title: 'Basic Details', completed: false },
    { id: 2, title: 'Course Content', completed: false },
    { id: 3, title: 'Overview', completed: false }
  ];

  // Add Lecture Modal
  showAddLectureModal = false;
  currentSectionId = '';
  lectureForm!: FormGroup;
  
  // Publishing Modal
  showPublishSuccessModal = false;
  isPublishing = false;
  
  // Drag and drop
  draggedLectureId: string | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Check if user has access
    this.currentUser = this.authService.getCurrentUser();
    
    if (!this.isAuthorOrAdmin()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.initializeForms();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private isAuthorOrAdmin(): boolean {
    return this.currentUser?.role === 'Author' || this.currentUser?.role === 'Admin';
  }

  private initializeForms() {
    // Step 1: Basic Details Form
    this.basicDetailsForm = this.fb.group({
      title: [this.courseData.title, [Validators.required, Validators.minLength(5)]],
      description: [this.courseData.description, [Validators.required, Validators.minLength(20)]],
      thumbnailUrl: [this.courseData.thumbnailUrl]
    });

    // Step 2: Course Content Form (for managing sections)
    this.courseContentForm = this.fb.group({
      sections: this.fb.array([])
    });

    // Step 3: Overview Form
    this.overviewForm = this.fb.group({
      duration: [this.courseData.duration, Validators.required],
      level: [this.courseData.level, Validators.required],
      whatYoullLearn: this.fb.array([this.fb.control('', Validators.required)]),
      skillsYoullGain: this.fb.array([this.fb.control('', Validators.required)]),
      prerequisites: this.fb.array([this.fb.control('')]),
      softwareRequirements: this.fb.array([this.fb.control('')]),
      price: [this.courseData.price, [Validators.required, Validators.min(0)]],
      category: [this.courseData.category, Validators.required]
    });

    // Add Lecture Form
    this.lectureForm = this.fb.group({
      type: ['video', Validators.required],
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      videoUrl: [''],
      textContent: [''],
      pdfUrl: [''],
      duration: ['', Validators.required]
    });
  }

  // Navigation methods
  nextStep() {
    if (this.validateCurrentStep()) {
      this.saveCurrentStep();
      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
      }
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.saveCurrentStep();
      this.currentStep--;
    }
  }

  goToStep(step: number) {
    if (step <= this.currentStep || this.steps[step - 1].completed) {
      this.saveCurrentStep();
      this.currentStep = step;
    }
  }

  private validateCurrentStep(): boolean {
    switch (this.currentStep) {
      case 1:
        return this.basicDetailsForm.valid;
      case 2:
        return this.courseData.sections.length > 0 && 
               this.courseData.sections.some(section => section.lectures.length > 0);
      case 3:
        return this.overviewForm.valid;
      default:
        return false;
    }
  }

  private saveCurrentStep() {
    switch (this.currentStep) {
      case 1:
        if (this.basicDetailsForm.valid) {
          this.courseData.title = this.basicDetailsForm.get('title')?.value;
          this.courseData.description = this.basicDetailsForm.get('description')?.value;
          this.courseData.thumbnailUrl = this.basicDetailsForm.get('thumbnailUrl')?.value;
          this.steps[0].completed = true;
        }
        break;
      case 2:
        if (this.courseData.sections.length > 0) {
          this.steps[1].completed = true;
        }
        break;
      case 3:
        if (this.overviewForm.valid) {
          this.courseData.duration = this.overviewForm.get('duration')?.value;
          this.courseData.level = this.overviewForm.get('level')?.value;
          this.courseData.whatYoullLearn = this.getFormArrayValues('whatYoullLearn');
          this.courseData.skillsYoullGain = this.getFormArrayValues('skillsYoullGain');
          this.courseData.prerequisites = this.getFormArrayValues('prerequisites');
          this.courseData.softwareRequirements = this.getFormArrayValues('softwareRequirements');
          this.courseData.price = this.overviewForm.get('price')?.value;
          this.courseData.category = this.overviewForm.get('category')?.value;
          this.steps[2].completed = true;
        }
        break;
    }
  }

  // Section management
  addSection() {
    const newSection: CourseSection = {
      id: this.generateId(),
      title: 'New Section',
      lectures: [],
      order: this.courseData.sections.length
    };
    this.courseData.sections.push(newSection);
  }

  deleteSection(sectionId: string) {
    this.courseData.sections = this.courseData.sections.filter(s => s.id !== sectionId);
    this.reorderSections();
  }

  duplicateSection(sectionId: string) {
    const section = this.courseData.sections.find(s => s.id === sectionId);
    if (section) {
      const duplicated: CourseSection = {
        ...section,
        id: this.generateId(),
        title: `${section.title} (Copy)`,
        lectures: section.lectures.map(lecture => ({
          ...lecture,
          id: this.generateId()
        })),
        order: this.courseData.sections.length
      };
      this.courseData.sections.push(duplicated);
    }
  }

  updateSectionTitle(sectionId: string, title: string) {
    const section = this.courseData.sections.find(s => s.id === sectionId);
    if (section) {
      section.title = title;
    }
  }

  // Lecture management
  openAddLectureModal(sectionId: string) {
    this.currentSectionId = sectionId;
    this.lectureForm.reset({ 
      type: 'video',
      title: '',
      description: '',
      videoUrl: '',
      textContent: '',
      pdfUrl: '',
      duration: ''
    });
    this.showAddLectureModal = true;
  }

  closeAddLectureModal() {
    this.showAddLectureModal = false;
    this.currentSectionId = '';
  }

  addLecture() {
    if (this.lectureForm.valid) {
      const section = this.courseData.sections.find(s => s.id === this.currentSectionId);
      if (section) {
        const newLecture: CourseLecture = {
          id: this.generateId(),
          title: this.lectureForm.get('title')?.value,
          description: this.lectureForm.get('description')?.value,
          type: this.lectureForm.get('type')?.value,
          duration: this.lectureForm.get('duration')?.value,
          videoUrl: this.lectureForm.get('videoUrl')?.value,
          textContent: this.lectureForm.get('textContent')?.value,
          pdfUrl: this.lectureForm.get('pdfUrl')?.value,
          order: section.lectures.length
        };
        section.lectures.push(newLecture);
        this.closeAddLectureModal();
      }
    }
  }

  deleteLecture(sectionId: string, lectureId: string) {
    const section = this.courseData.sections.find(s => s.id === sectionId);
    if (section) {
      section.lectures = section.lectures.filter(l => l.id !== lectureId);
      this.reorderLectures(sectionId);
    }
  }

  // Drag and drop for lectures
  onLectureDragStart(lectureId: string) {
    this.draggedLectureId = lectureId;
  }

  onLectureDrop(event: DragEvent, targetSectionId: string, targetIndex: number) {
    event.preventDefault();
    if (this.draggedLectureId) {
      this.moveLecture(this.draggedLectureId, targetSectionId, targetIndex);
      this.draggedLectureId = null;
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  private moveLecture(lectureId: string, targetSectionId: string, targetIndex: number) {
    // Find and remove lecture from current section
    let lecture: CourseLecture | undefined;
    let sourceSection: CourseSection | undefined;
    
    for (const section of this.courseData.sections) {
      const lectureIndex = section.lectures.findIndex(l => l.id === lectureId);
      if (lectureIndex >= 0) {
        lecture = section.lectures.splice(lectureIndex, 1)[0];
        sourceSection = section;
        break;
      }
    }

    // Add lecture to target section
    if (lecture) {
      const targetSection = this.courseData.sections.find(s => s.id === targetSectionId);
      if (targetSection) {
        targetSection.lectures.splice(targetIndex, 0, lecture);
        this.reorderLectures(targetSectionId);
        if (sourceSection && sourceSection.id !== targetSectionId) {
          this.reorderLectures(sourceSection.id);
        }
      }
    }
  }

  // File upload methods
  onThumbnailSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // In a real app, upload to server and get URL
      // For demo, create a mock URL
      this.courseData.thumbnailUrl = `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop`;
      this.basicDetailsForm.patchValue({ thumbnailUrl: this.courseData.thumbnailUrl });
    }
  }

  onVideoFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // In a real app, upload to server and get URL
      const mockUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
      this.lectureForm.patchValue({ videoUrl: mockUrl });
    }
  }

  onPdfFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // In a real app, upload to server and get URL
      const mockUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
      this.lectureForm.patchValue({ pdfUrl: mockUrl });
    }
  }

  // Form validation helpers
  isFieldRequired(fieldName: string): boolean {
    const type = this.lectureForm.get('type')?.value;
    switch (fieldName) {
      case 'videoUrl':
        return type === 'video';
      case 'textContent':
        return type === 'topic-content';
      case 'pdfUrl':
        return type === 'pdf';
      default:
        return true;
    }
  }

  getTypeDisplayName(type: string): string {
    switch (type) {
      case 'video': return 'Video';
      case 'topic-content': return 'Topic Content';
      case 'pdf': return 'PDF';
      default: return type;
    }
  }

  // Form array helpers
  getFormArray(formName: string): FormArray {
    return this.overviewForm.get(formName) as FormArray;
  }

  addFormArrayItem(formName: string) {
    this.getFormArray(formName).push(this.fb.control('', Validators.required));
  }

  removeFormArrayItem(formName: string, index: number) {
    const formArray = this.getFormArray(formName);
    if (formArray.length > 1) {
      formArray.removeAt(index);
    }
  }

  private getFormArrayValues(formName: string): string[] {
    return this.getFormArray(formName).value.filter((item: string) => item.trim() !== '');
  }

  // Utility methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private reorderSections() {
    this.courseData.sections.forEach((section, index) => {
      section.order = index;
    });
  }

  private reorderLectures(sectionId: string) {
    const section = this.courseData.sections.find(s => s.id === sectionId);
    if (section) {
      section.lectures.forEach((lecture, index) => {
        lecture.order = index;
      });
    }
  }

  getSectionSummary(section: CourseSection): string {
    const lectureCount = section.lectures.length;
    const totalMinutes = section.lectures.reduce((total, lecture) => {
      const minutes = parseInt(lecture.duration) || 0;
      return total + minutes;
    }, 0);
    return `${lectureCount} Lecture${lectureCount !== 1 ? 's' : ''} • ${totalMinutes} mins`;
  }

  getLectureIcon(type: string): string {
    switch (type) {
      case 'video': return '▶';
      case 'topic-content': return '📝';
      case 'pdf': return '📄';
      default: return '📋';
    }
  }

  // Publishing
  canPublish(): boolean {
    return this.steps.every(step => step.completed);
  }

  async publishCourse() {
    if (!this.canPublish()) {
      alert('Please complete all required steps before publishing.');
      return;
    }

    this.isPublishing = true;

    try {
      // Save the current step data
      this.saveCurrentStep();

      // Validate all course data
      if (!this.validateCourseData()) {
        this.isPublishing = false;
        return;
      }

      // Create the course object
      const courseToPublish = this.createCourseObject();

      // Simulate course publishing (in real app, this would be an API call)
      await this.saveCourseToServer(courseToPublish);

      // Show success modal
      this.showPublishSuccessModal = true;
      this.isPublishing = false;

    } catch (error) {
      console.error('Error publishing course:', error);
      alert('Error publishing course. Please try again.');
      this.isPublishing = false;
    }
  }

  private validateCourseData(): boolean {
    // Validate basic details
    if (!this.courseData.title || !this.courseData.description) {
      alert('Please complete the basic course details.');
      return false;
    }

    // Validate course content
    if (this.courseData.sections.length === 0) {
      alert('Please add at least one section to your course.');
      return false;
    }

    const hasLectures = this.courseData.sections.some(section => section.lectures.length > 0);
    if (!hasLectures) {
      alert('Please add at least one lecture to your course.');
      return false;
    }

    // Validate overview data
    if (!this.courseData.duration || !this.courseData.level || 
        this.courseData.whatYoullLearn.length === 0 || 
        this.courseData.skillsYoullGain.length === 0) {
      alert('Please complete all overview information.');
      return false;
    }

    return true;
  }

  private createCourseObject(): any {
    // Generate a unique course ID
    const courseId = this.generateId();
    
    // Calculate total duration from all lectures
    const totalMinutes = this.courseData.sections.reduce((total, section) => {
      return total + section.lectures.reduce((sectionTotal, lecture) => {
        return sectionTotal + (parseInt(lecture.duration) || 0);
      }, 0);
    }, 0);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    return {
      id: courseId,
      title: this.courseData.title,
      subtitle: this.courseData.description.substring(0, 100) + '...',
      description: this.courseData.description,
      thumbnailUrl: this.courseData.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop',
      provider: {
        name: this.currentUser?.fullName || 'Course Author',
        avatar: this.currentUser?.avatarUrl || 'https://i.pravatar.cc/40?u=author'
      },
      rating: 0,
      reviewCount: 0,
      enrollmentCount: 0,
      difficulty: this.courseData.level,
      duration: totalMinutes,
      durationText: durationText,
      category: this.courseData.category || 'Technology',
      price: this.courseData.price,
      tags: this.courseData.skillsYoullGain.slice(0, 3),
      whatYoullLearn: this.courseData.whatYoullLearn,
      skills: this.courseData.skillsYoullGain,
      requirements: this.courseData.prerequisites,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'Published',
      curriculum: {
        totalSections: this.courseData.sections.length,
        totalLectures: this.courseData.sections.reduce((total, section) => total + section.lectures.length, 0),
        totalDuration: `${hours}h ${minutes}m`,
        sections: this.courseData.sections.map(section => ({
          id: section.id,
          title: section.title,
          lectureCount: section.lectures.length,
          lectures: section.lectures.map(lecture => ({
            id: lecture.id,
            title: lecture.title,
            duration: lecture.duration + ' min',
            type: lecture.type
          }))
        }))
      },
      // Mock additional data for course detail page
      authorDetails: {
        name: this.currentUser?.fullName || 'Course Author',
        title: 'Course Instructor',
        avatar: this.currentUser?.avatarUrl || 'https://i.pravatar.cc/150?u=author',
        biography: 'Experienced instructor with expertise in this subject area.',
        faq: []
      },
      testimonials: [],
      relatedCourses: []
    };
  }

  private async saveCourseToServer(course: any): Promise<void> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In a real application, this would be an HTTP POST to your API
    // For demo purposes, we'll save to localStorage and show success
    
    // Save to localStorage to simulate persistence
    const existingCourses = JSON.parse(localStorage.getItem('publishedCourses') || '[]');
    existingCourses.push(course);
    localStorage.setItem('publishedCourses', JSON.stringify(existingCourses));
    
    console.log('Course published successfully:', course);
  }

  onPublishSuccessOk() {
    this.showPublishSuccessModal = false;
    // Navigate to My Courses to see the published course
    this.router.navigate(['/my-courses']);
  }

  saveDraft() {
    this.saveCurrentStep();
    // In real app, save to server as draft
    console.log('Saving draft:', this.courseData);
    alert('Draft saved successfully!');
  }

  // Rich Text Editor methods
  formatText(command: string) {
    document.execCommand(command, false);
  }

  onRichTextChange(event: any) {
    const content = event.target.innerHTML;
    this.lectureForm.patchValue({ textContent: content });
  }

  onRichTextBlur() {
    const richTextEditor = document.querySelector('.rte-content') as HTMLElement;
    if (richTextEditor) {
      const content = richTextEditor.innerHTML;
      this.lectureForm.patchValue({ textContent: content });
    }
  }

  deleteCourse() {
    if (confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      this.router.navigate(['/my-courses']);
    }
  }

  navigateToHome() {
    this.router.navigate(['/dashboard']);
  }

  navigateToMyCourses() {
    this.router.navigate(['/my-courses']);
  }
}
