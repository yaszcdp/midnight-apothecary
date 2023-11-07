import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Bruja } from 'src/app/interfaces/brujas.interface';
import { BrujasService } from 'src/app/services/brujas.service';

@Component({
  selector: 'app-nueva-bruja',
  templateUrl: './nueva-bruja.component.html',
  styleUrls: ['./nueva-bruja.component.css']
})
export class NuevaBrujaComponent implements OnInit {

  formulario!: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private brujasService: BrujasService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initForm();
  }


  initForm() {
    this.formulario = this.formBuilder.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      fecha_nacimiento: [''],
      fecha_defuncion: [''],
      tipo_de_muerte: ['', Validators.required],
      lugar_de_nacimiento: ['', Validators.required],
      lugar_de_ejecucion: ['', Validators.required],
      imagen: [''],
      historia: ['', Validators.required]
    });
  }

  async guardarBruja(){
    if (this.formulario.invalid) return;

    await this.brujasService.postBruja(this.formulario.value);

    alert('Bruja agregada con éxito');
    this.router.navigate(['/blog']);
  }

}


/*   guardarBruja() {
    if (this.formulario.invalid) return;

    this.brujasService.postBruja(this.formulario.value)
    .subscribe({
      next: (bruja) => {
        alert(`${bruja.nombre} ${bruja.apellido} se agregó con éxito.`);
        this.router.navigate(['/blog']);
      },
      error: (e) => {
        console.log(e);
      }
    })
  }
 */