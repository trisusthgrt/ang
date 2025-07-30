import { Component, Input, Output, EventEmitter, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface FileUploadResult {
  file: File;
  preview: string;
  name: string;
  size: number;
  type: string;
}

@Component({
  selector: 'app-file-uploader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-uploader.component.html',
  styleUrl: './file-uploader.component.scss'
})
export class FileUploaderComponent {
  @Input() acceptedTypes: string = 'image/*';
  @Input() maxFileSize: number = 5 * 1024 * 1024; // 5MB default
  @Input() multiple: boolean = false;
  @Input() disabled: boolean = false;
  @Input() placeholder: string = 'Drag and Drop file here, or Choose file';
  
  @Output() fileSelected = new EventEmitter<FileUploadResult[]>();
  @Output() uploadError = new EventEmitter<string>();
  
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  isDragOver = false;
  isUploading = false;
  uploadedFiles: FileUploadResult[] = [];

  onDragOver(event: DragEvent): void {
    if (this.disabled) return;
    
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    if (this.disabled) return;
    
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    if (this.disabled) return;
    
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    
    const files = Array.from(event.dataTransfer?.files || []);
    this.handleFiles(files);
  }

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    this.handleFiles(files);
  }

  private handleFiles(files: File[]): void {
    if (files.length === 0) return;
    
    // Validate files
    const validFiles = files.filter(file => this.validateFile(file));
    
    if (validFiles.length === 0) {
      this.uploadError.emit('No valid files selected');
      return;
    }
    
    // If not multiple, take only the first file
    const filesToProcess = this.multiple ? validFiles : [validFiles[0]];
    
    this.isUploading = true;
    const results: FileUploadResult[] = [];
    
    filesToProcess.forEach((file, index) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const result: FileUploadResult = {
          file: file,
          preview: e.target?.result as string,
          name: file.name,
          size: file.size,
          type: file.type
        };
        
        results.push(result);
        
        // When all files are processed
        if (results.length === filesToProcess.length) {
          this.uploadedFiles = this.multiple ? [...this.uploadedFiles, ...results] : results;
          this.fileSelected.emit(results);
          this.isUploading = false;
        }
      };
      
      reader.onerror = () => {
        this.uploadError.emit(`Error reading file: ${file.name}`);
        this.isUploading = false;
      };
      
      reader.readAsDataURL(file);
    });
  }

  private validateFile(file: File): boolean {
    // Check file size
    if (file.size > this.maxFileSize) {
      this.uploadError.emit(`File "${file.name}" is too large. Maximum size is ${this.formatFileSize(this.maxFileSize)}`);
      return false;
    }
    
    // Check file type
    if (this.acceptedTypes !== '*/*') {
      const acceptedTypesArray = this.acceptedTypes.split(',').map(type => type.trim());
      const isValidType = acceptedTypesArray.some(type => {
        if (type === 'image/*') {
          return file.type.startsWith('image/');
        }
        return file.type === type;
      });
      
      if (!isValidType) {
        this.uploadError.emit(`File "${file.name}" has invalid type. Accepted types: ${this.acceptedTypes}`);
        return false;
      }
    }
    
    return true;
  }

  openFileDialog(): void {
    if (this.disabled) return;
    this.fileInput.nativeElement.click();
  }

  removeFile(index: number): void {
    this.uploadedFiles.splice(index, 1);
  }

  clearFiles(): void {
    this.uploadedFiles = [];
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileTypeIcon(type: string): string {
    if (type.startsWith('image/')) {
      return '🖼️';
    }
    return '📄';
  }
}
