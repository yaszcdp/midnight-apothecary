import { Component} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authentication.service';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.css']
})
export class RegistroComponent{

  isLogged: boolean = false;
  firebaseAuthStateReady: boolean = false;

  form: FormGroup;

  constructor(private fb: FormBuilder, private AuthencationService: AuthenticationService, private router: Router) {
    this.form = this.fb.group({
      email: ['', Validators.required],
      password: ['', Validators.required],
      nombre: ['', Validators.required],
      apellido: ['', Validators.required]
    })
  }


  cancelar(){
    const ok = confirm("¿Está seguro que desea cancelar el registro?");
    if(ok){
      this.router.navigate(['/home']);
    }
    return;
  }

  register(email: string, password: string, nombre: string, apellido: string) {
    this.AuthencationService.register(email, password, nombre, apellido);
  }
  registrarse() {
    if (!this.form.valid) {
      alert("Rellene todos los campos correctamente");
      return;
    }
    const email = this.form.value.email;
    const password = this.form.value.password;
    const nombre = this.form.value.nombre;
    const apellido = this.form.value.apellido;
    this.register(email, password, nombre, apellido);
    this.router.navigate(['/home']);
  }
}