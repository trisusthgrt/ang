import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'search',
    loadComponent: () => import('./components/search-results/search-results.component').then(m => m.SearchResultsComponent)
  },
  {
    path: 'course/:id',
    loadComponent: () => import('./components/course-detail/course-detail.component').then(m => m.CourseDetailComponent)
  }
];
