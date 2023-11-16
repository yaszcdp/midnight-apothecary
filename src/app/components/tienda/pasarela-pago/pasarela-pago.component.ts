import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Compra } from 'src/app/interfaces/compra.interface';
import { ItemCarrito } from 'src/app/interfaces/itemCarrito.interface';
import { User } from 'src/app/interfaces/user.interface';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { CarritoService } from 'src/app/services/carrito.service';
import { ComprasService } from 'src/app/services/compras.service';
import { ProductosService } from 'src/app/services/productos.service';

@Component({
  selector: 'app-pasarela-pago',
  templateUrl: './pasarela-pago.component.html',
  styleUrls: ['./pasarela-pago.component.css']
})
export class PasarelaPagoComponent implements OnInit{
  

  isLogged: boolean = false;
  firebaseAuthenticationReady: boolean = false;
  usuarioLogueado!: User;

  editMode: boolean = false;
  userId!: string;

  productos : ItemCarrito [] = [];


  formularioUsuario : FormGroup = this.fb.group({
    nombre: '',
    apellido: '',
    telefono: '',
    provincia: '',
    ciudad: '',
    direccion: '',
    depto: '',
    codigoPostal: '',
    dni: ''
  });

  formularioPago: FormGroup = this.fb.group({
    titular: '',
    numeroTarjeta: '',
    fechaCaducidad: '',
    dniTitular: ''
  });

  constructor(private fb: FormBuilder, private authService: AuthenticationService, private router : Router, private carritoService: CarritoService,
    private compraService: ComprasService, private productoService: ProductosService) { }

  async ngOnInit(): Promise<void> {
    await this.authService.waitForFirebaseAuthentication();
    this.firebaseAuthenticationReady = true;
    this.isLogged = this.authService.isUserLoggedIn();
    this.usuarioLogueado = await this.authService.getAllCurrentUserData();
    this.userId = this.authService.getCurrentUserId();
    await this.obtenerProductos();
    this.initFormUsuario();
    if(!this.verificarCamposUsuario()){
      this.editMode = true;
    }
  
  }

  initFormUsuario(){
    this.formularioUsuario = this.fb.group({
      nombre: [this.usuarioLogueado.nombre, [Validators.required, Validators.minLength(3)]],
      apellido: [this.usuarioLogueado.apellido, [Validators.required, Validators.minLength(3)]],
      telefono: [this.usuarioLogueado.telefono, [Validators.required, Validators.minLength(9)]],
      provincia: [this.usuarioLogueado.provincia, [Validators.required, Validators.minLength(3)]],
      ciudad: [this.usuarioLogueado.ciudad, [Validators.required, Validators.minLength(3)]],
      direccion: [this.usuarioLogueado.direccion,[Validators.required, Validators.minLength(5)]],
      depto: [this.usuarioLogueado.depto],
      codigoPostal: [this.usuarioLogueado.codigoPostal,[Validators.required, Validators.minLength(4)]],
      dni: [this.usuarioLogueado.dni,[Validators.required, Validators.minLength(9)]]
    });
  }

  verificarCamposUsuario(){
    if(this.usuarioLogueado.ciudad === '' || this.usuarioLogueado.codigoPostal === '' || this.usuarioLogueado.direccion === '' 
    || this.usuarioLogueado.dni === '' || this.usuarioLogueado.nombre === '' || this.usuarioLogueado.apellido === '' 
    || this.usuarioLogueado.provincia === '' || this.usuarioLogueado.telefono === ''){
      return false;
    }
    else{
      return true;
    }
  }


  activarEditMode(){
    this.editMode = true;
  }

  async actualizarDatosUsuario() : Promise<void>{
    if(this.formularioUsuario.valid){
      this.usuarioLogueado.nombre = this.formularioUsuario.value.nombre;
      this.usuarioLogueado.apellido = this.formularioUsuario.value.apellido;
      this.usuarioLogueado.telefono = this.formularioUsuario.value.telefono;
      this.usuarioLogueado.provincia = this.formularioUsuario.value.provincia;
      this.usuarioLogueado.ciudad = this.formularioUsuario.value.ciudad;
      this.usuarioLogueado.direccion = this.formularioUsuario.value.direccion;
      this.usuarioLogueado.depto = this.formularioUsuario.value.depto;
      this.usuarioLogueado.codigoPostal = this.formularioUsuario.value.codigoPostal;
      this.usuarioLogueado.dni = this.formularioUsuario.value.dni;
      await this.authService.updateUserData(this.userId, this.usuarioLogueado);
      this.editMode = false;
    }
    else{
      alert("Datos incorrectos o incompletos");
    }
  }; 

  comprobarDatosTarjeta(): boolean{
    if(!this.formularioPago.valid){
      alert("Datos incorrectos o incompletos");
      return false;
    }
    else{
      return true;
    }
  }

  async realizarCompra(): Promise<void>{
    const ok = confirm("¿Está seguro que desea realizar la compra?");
    if(this.comprobarDatosTarjeta() && ok){
      const compra : Compra = {
        userId: this.userId,
        fecha: '',
        items: this.productos,
        total: this.obtenerTotal(),
        estado: "pendiente"
      }
      await this.compraService.postCompra(compra);
      for(let producto of this.productos){
        await this.productoService.updateStock(producto.id_producto, producto.cantidad);
      }
      alert("Compra realizada con éxito!");
      await this.carritoService.deleteCarrito();
      this.router.navigate(['/home']);
    }
  }; 

  async obtenerProductos() : Promise<void>{
    await this.carritoService.getCarritoFromUsuario();
    const carrito = this.carritoService.getCarrito();
    for (let item of carrito) {
      const id_producto = item.id_producto;
      const cantidad = item.cantidad;
      const precio = await this.productoService.getPrecioProducto(id_producto);
      const nombre = await this.productoService.getNombreProducto(id_producto);
      const subtotal = cantidad * precio;
      this.productos.push({ id_producto, nombre, precio, cantidad, subtotal });
    }
  }

  obtenerTotal(): number {
    let total = 0;
    for (let producto of this.productos) {
      total += producto.subtotal;
    }
    return total;
  }
  
}
