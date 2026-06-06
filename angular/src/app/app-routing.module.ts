import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { AdminLoginComponent } from './components/auth/admin-login/admin-login.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'admin-login', component: AdminLoginComponent },
  { 
    path: 'admin', 
    loadChildren: () => import('./modules/admin/admin.module').then(m => m.AdminModule) 
  },
  { 
    path: 'user', 
    loadChildren: () => import('./modules/user/user.module').then(m => m.UserModule) 
  },
  { 
    path: 'staff', 
    loadChildren: () => import('./modules/staff/staff.module').then(m => m.StaffModule) 
  },
  { 
    path: 'shared', 
    loadChildren: () => import('./modules/shared/shared.module').then(m => m.SharedModule) 
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
