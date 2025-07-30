import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, map } from 'rxjs';

export interface Banner {
  id: string;
  imageUrl: string;
  title: string;
  description?: string;
  visibility: 'now' | 'scheduled' | 'draft';
  scheduleDate?: string;
  expiryDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  order: number;
}

export interface BannerUpload {
  file: File;
  preview: string;
  title: string;
  description?: string;
  visibility: 'now' | 'scheduled' | 'draft';
  scheduleDate?: string;
  expiryDate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BannerService {
  private baseUrl = 'http://localhost:3000';
  private bannersSubject = new BehaviorSubject<Banner[]>([]);
  public banners$ = this.bannersSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadBanners();
  }

  // Get all banners
  getAllBanners(): Observable<Banner[]> {
    return this.http.get<Banner[]>(`${this.baseUrl}/banners`);
  }

  // Get active banners for the dashboard
  getActiveBanners(): Observable<Banner[]> {
    return this.getAllBanners().pipe(
      map(banners => {
        const currentDate = new Date();
        return banners
          .filter(banner => {
            if (banner.visibility === 'now' && banner.isActive) {
              return true;
            }
            if (banner.visibility === 'scheduled' && banner.isActive) {
              const scheduleDate = banner.scheduleDate ? new Date(banner.scheduleDate) : null;
              const expiryDate = banner.expiryDate ? new Date(banner.expiryDate) : null;
              
              if (scheduleDate && expiryDate) {
                return currentDate >= scheduleDate && currentDate <= expiryDate;
              }
              if (scheduleDate && !expiryDate) {
                return currentDate >= scheduleDate;
              }
            }
            return false;
          })
          .sort((a, b) => a.order - b.order);
      })
    );
  }

  // Create a new banner
  createBanner(bannerData: Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>): Observable<Banner> {
    const newBanner: Banner = {
      ...bannerData,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return this.http.post<Banner>(`${this.baseUrl}/banners`, newBanner);
  }

  // Update an existing banner
  updateBanner(id: string, bannerData: Partial<Banner>): Observable<Banner> {
    const updatedData = {
      ...bannerData,
      updatedAt: new Date().toISOString()
    };

    return this.http.patch<Banner>(`${this.baseUrl}/banners/${id}`, updatedData);
  }

  // Delete a banner
  deleteBanner(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/banners/${id}`);
  }

  // Upload banner image (mock implementation)
  uploadBannerImage(file: File): Observable<{ imageUrl: string }> {
    // In a real application, this would upload to a file storage service
    // For demo purposes, we'll use a mock image URL
    return new Observable(observer => {
      setTimeout(() => {
        const mockImageUrl = this.getMockImageUrl();
        observer.next({ imageUrl: mockImageUrl });
        observer.complete();
      }, 1000); // Simulate upload delay
    });
  }

  // Create banner from upload
  createBannerFromUpload(upload: BannerUpload): Observable<Banner> {
    return this.uploadBannerImage(upload.file).pipe(
      map(({ imageUrl }) => {
        const bannerData: Omit<Banner, 'id' | 'createdAt' | 'updatedAt'> = {
          imageUrl: imageUrl,
          title: upload.title || 'Untitled Banner',
          description: upload.description,
          visibility: upload.visibility,
          scheduleDate: upload.scheduleDate,
          expiryDate: upload.expiryDate,
          isActive: true,
          order: 0
        };
        return this.createBanner(bannerData);
      })
    ).pipe(
      switchMap(bannerObservable => bannerObservable)
    );
  }

  // Reorder banners
  reorderBanners(banners: Banner[]): Observable<Banner[]> {
    const updates = banners.map((banner, index) => 
      this.updateBanner(banner.id, { order: index })
    );
    
    return new Observable(observer => {
      Promise.all(updates.map(update => update.toPromise()))
        .then(results => {
          observer.next(results as Banner[]);
          observer.complete();
        })
        .catch(error => observer.error(error));
    });
  }

  // Load banners and update subject
  private loadBanners(): void {
    this.getAllBanners().subscribe({
      next: (banners) => {
        this.bannersSubject.next(banners);
      },
      error: (error) => {
        console.error('Error loading banners:', error);
        // Load mock banners as fallback
        this.bannersSubject.next(this.getMockBanners());
      }
    });
  }

  // Generate unique ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Get mock image URL
  private getMockImageUrl(): string {
    const mockImages = [
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=300&fit=crop',
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=300&fit=crop',
      'https://images.unsplash.com/photo-1434626881859-194d67b2b86f?w=1200&h=300&fit=crop',
      'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=1200&h=300&fit=crop'
    ];
    return mockImages[Math.floor(Math.random() * mockImages.length)];
  }

  // Get mock banners for fallback
  private getMockBanners(): Banner[] {
    return [
      {
        id: 'banner1',
        imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=300&fit=crop',
        title: 'Featured Course Banner',
        description: 'Discover our latest courses',
        visibility: 'now',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order: 0
      }
    ];
  }
}

// Import switchMap
import { switchMap } from 'rxjs';
