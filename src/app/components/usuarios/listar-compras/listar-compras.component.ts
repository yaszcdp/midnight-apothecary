import { compileDeclareDirectiveFromMetadata } from '@angular/compiler';
import { Component, OnInit } from '@angular/core';
import { reload } from 'firebase/auth';
import { Compra } from 'src/app/interfaces/compra.interface';
import { ItemCarrito } from 'src/app/interfaces/itemCarrito.interface';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { ComprasService } from 'src/app/services/compras.service';

@Component({
  selector: 'app-listar-compras',
  templateUrl: './listar-compras.component.html',
  styleUrls: ['./listar-compras.component.css']
})
export class ListarComprasComponent implements OnInit {

  productos: ItemCarrito[] = [];
  compras: Compra[] = [];
  compra: Compra = {} as Compra;

  arrayEstados: string[] = ['Pendiente de pago', 'Pago confirmado', 'Pedido empaquetado', 'Envío notificado', 'Pedido entregado', 'Archivado', 'Cancelado'];
  filtradoReady: boolean = false;

  isLogged: boolean = false;
  isAdminRole: boolean = false;
  firebaseAuthenticationReady: boolean = false;

  existeUsuario: boolean = true;
  tieneCompras: boolean = true;
  busqueda: boolean = false;

  emailBuscado: string = "";
  dniBuscado: string = "";
  fechaBuscada: string = "";
  nroCompraBuscada: string = "";


  //filtros
  filtroEstado: string = "";
  fechaDesde: string = "";
  fechaHasta: string = "";

  datoBuscado: string = "";

  clientes: Map<string, string> = new Map();
  estadoAmpliacion: { [key: string]: boolean } = {};

  checkCompras: { [key: string]: boolean } = {};
  accionSeleccionada: string = "";

  inputSeleccionado: boolean = false;

  constructor(
    private compraService: ComprasService,
    private authService: AuthenticationService
  ) { }

  async ngOnInit(): Promise<void> {
    await this.authService.waitForFirebaseAuthentication();
    this.firebaseAuthenticationReady = true;
    this.isLogged = this.authService.isUserLoggedIn();
    this.isAdminRole = await this.authService.getCurrentUserRole() === 'admin';
    if (!this.isAdminRole) {
      this.listarCompras(this.authService.getCurrentUserId());
      await this.initializeEstadoAmpliacion();
    }
  }

  async initializeEstadoAmpliacion(): Promise<void> {
    for (const compra of this.compras) {
      this.estadoAmpliacion[compra.idDoc!] = false;
    }
  }

  //animacion input

  verificarInput(): void {
    if (!this.datoBuscado) {
      this.inputSeleccionado = false;
    }
  }

  //Métodos de validación.

  async validarUsuario(): Promise<void> {
    const id_user = await this.authService.getUserIdByEmail(this.emailBuscado);
    this.existeUsuario = !!id_user;
  }

  async validarCompras(): Promise<void> {
    this.tieneCompras = !!this.compras.length;
  }

  //Métodos de ordenación y corrección de datos.

  async listarCompras(id: string) {
    this.compras = await this.compraService.getComprasPorUsuario(id);
    this.ordenarComprasPorFecha();
  }

  ordenarComprasPorFecha() {
    this.compras.sort((a, b) => {
      let dateA = new Date(a.fecha);
      let dateB = new Date(b.fecha);
      return dateB.getTime() - dateA.getTime();
    });
  }

  corregirFecha(fecha: string): string {
    return fecha.replace(/-/g, "/");
  }

  //Métodos de búsqueda.

  async buscarPorEmail(): Promise<void> {
    this.compras = await this.compraService.getComprasPorEmail(this.emailBuscado);
    await this.validarUsuario();
  }

  async buscarPorDni(): Promise<void> {
    const id_user = await this.authService.getUserIdByDni(this.dniBuscado);
    if (id_user === "") {
      this.existeUsuario = false;
    }
    this.compras = await this.compraService.getComprasPorUsuario(id_user);
  }

  async buscarPorFecha(): Promise<void> {
    const fecha = this.corregirFecha(this.fechaBuscada);
    this.compras = await this.compraService.getComprasPorFecha(fecha);
  }

  async buscarPorNroCompra(): Promise<void> {
    this.compra = await this.compraService.getComprasPorNroCompra(this.nroCompraBuscada);
    this.compras = this.compra ? [this.compra] : [];
  }

  //funcion busqueda optimizada. 
  async buscarCompras(): Promise<void> {
    this.busqueda = true;

    if (this.datoBuscado === "") {
      this.compras = await this.compraService.getCompras();
      if(this.filtroEstado !== "Archivado"){
        this.compras = this.compras.filter(compra => compra.estado !== 'Archivado');
      }
    } else if (this.datoBuscado.includes("@") && this.datoBuscado.includes(".")) {
      this.emailBuscado = this.datoBuscado;
      await this.buscarPorEmail();
    } else if (!isNaN(Number(this.datoBuscado)) && this.datoBuscado.length === 8) {
      this.dniBuscado = this.datoBuscado;
      await this.buscarPorDni();
    } else if (this.datoBuscado.includes("/") || this.datoBuscado.includes("-")) {
      this.fechaBuscada = this.datoBuscado;
      await this.buscarPorFecha();
    } else {
      this.nroCompraBuscada = this.datoBuscado;
      await this.buscarPorNroCompra();
    }

    this.validarCompras();
    this.aplicarFiltros();
    this.getClientesPorCompra();
    this.ordenarComprasPorFecha();

    await this.initializeEstadoAmpliacion();

  }

  //buscar nombre de cliente. 
  async getClientesPorCompra() {
    for (let compra of this.compras) {
      const cliente = await this.authService.getUserNameById(compra.userId);
      this.clientes.set(compra.userId, cliente);
    }
  }

  ampliarCompra(idCompra: string | undefined): void {
    console.log(idCompra);
    this.estadoAmpliacion[idCompra!] = !this.estadoAmpliacion[idCompra!];
  }


  //Métodos de filtrado. 

  filtrarPorEstado() {
    this.compras = this.compras.filter(compra => compra.estado === this.filtroEstado);
  }

  filtrarPorFecha() {
    if (this.fechaDesde === "" && this.fechaHasta === "") {
      alert("Ingrese un rango de fechas");
      return;
    }
    const fechaDesde = this.corregirFecha(this.fechaDesde);
    const fechaHasta = this.corregirFecha(this.fechaHasta);

    this.compras = this.compras.filter(compra => {
      const fechaCompra = this.corregirFecha(compra.fecha);
      return fechaCompra >= fechaDesde && fechaCompra <= fechaHasta;
    });
  }

  aplicarFiltros() {
    if (this.filtroEstado !== "" && this.filtroEstado !== "Todas") {
      this.filtrarPorEstado();
    }
    if (this.fechaDesde !== "" && this.fechaHasta !== "") {
      this.filtrarPorFecha();
    }
  }

  //Métodos de cambio de estado. 

  async cambiarEstado(id: string, estado: string) {
    await this.compraService.cambiarEstadoCompra(id, estado);
    await this.buscarCompras();
  }

  actualizarComprasSeleccionadas(): void {
    for (const compra of this.compras) {
      if (this.checkCompras[compra.idDoc!]) {
        this.checkCompras[compra.idDoc!] = true;
      } else {
        this.checkCompras[compra.idDoc!] = false;
      }
    }
  }

  hayComprasSeleccionadas(): boolean {
    return Object.values(this.checkCompras).some(seleccionada => seleccionada);
  }

  async cambiarEstados(estado: string): Promise<void> {
    if (this.accionSeleccionada === "") {
      alert("Seleccione una acción");
      return;
    }

    for (const [id, seleccionada] of Object.entries(this.checkCompras)) {
      if (seleccionada) {
        await this.compraService.cambiarEstadoCompra(id, estado);
        console.log(seleccionada);
      }
    }

    await this.buscarCompras();
  }

  checkAll(event: any) {
    const isChecked = event.target.checked;
    for (let compra of this.compras) {
      this.checkCompras[compra.idDoc!] = isChecked;
    }
  }










}



