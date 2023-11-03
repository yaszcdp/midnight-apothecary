import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { InfoProductoComponent } from './components/tienda/info-producto/info-producto.component';
import { LoginPageComponent } from './pages/usuarios/login-page/login-page.component';
import { RegistroPageComponent } from './pages/usuarios/registro-page/registro-page.component';

const routes: Routes = [
  {path: 'home', component: HomePageComponent},
  {path: 'login', component: LoginPageComponent},
  {path: 'register', component: RegistroPageComponent},
  {path: "**", redirectTo: 'home'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
