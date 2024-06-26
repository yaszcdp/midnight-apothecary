import { Injectable } from '@angular/core';
import { Firestore, addDoc, collection, doc, getDoc, getDocs, setDoc } from '@angular/fire/firestore';
import { Compra } from '../interfaces/compra.interface';
import { AuthenticationService } from './authentication.service';
import { ProductosService } from './productos.service';

@Injectable({
  providedIn: 'root'
})
export class ComprasService {

  constructor(private firestore: Firestore, 
    private authService: AuthenticationService,
    private productoService: ProductosService) { }

  async postCompra(compra: Compra): Promise<boolean> {
    try {
      for(let item of compra.items){
        console.log(item.cantidad);
        const hayStock = await this.productoService.verificarStock(item.id_producto, item.cantidad);
        if(!hayStock){
          alert('No hay suficiente stock de ' + item.nombre + ' para realizar la compra');
          return false;
        }
      }
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0'); // +1 porque los meses empiezan en 0
      const day = String(now.getDate()).padStart(2, '0');
      const formattedFecha = `${year}/${month}/${day}`;
      const comprasCollection = collection(this.firestore, "compras");
      const data = {
        userId: compra.userId,
        fecha: formattedFecha,
        items: compra.items,
        total: compra.total,
        estado: compra.estado
      }
      await addDoc(comprasCollection, data);
      return true;
    } catch (error) {
      console.error(error);
    }
    return false;
  }

  async getComprasPorUsuario(userId: string): Promise<Compra[]> {
    try {
      const comprasCollection = collection(this.firestore, "compras");
      const comprasSnapshot = await getDocs(comprasCollection);
      const compras: Compra[] = [];
      comprasSnapshot.forEach(doc => {
        const compra = doc.data();
        compra['idDoc'] = doc.id;
        if (compra['userId'] === userId) {
          compras.push(compra as Compra);
        }
      });
      return compras;
    } catch (error) {
      console.error(error);
      return [] as Compra[];
    }
  }

  async cambiarEstadoCompra(id: string, estado: string): Promise<boolean> {
    try {
      const comprasCollection = collection(this.firestore, "compras");
      const compra = doc(comprasCollection, id);
      const compraSnapshot = await getDoc(compra);
      if (compraSnapshot.exists()) {
        await setDoc(compra, { estado: estado }, { merge: true });
        return true;
      }
    } catch (error) {
      console.error(error);
      alert('Hubo un error al intentar acceder al documento');
    }
    return false;
  }

  async getComprasPorEmail(email: string): Promise<Compra[]> {
    try {
      console.log(email)
      const userId = await this.authService.getUserIdByEmail(email);
      console.log(userId);
      if (userId != '') {
        const compras = await this.getComprasPorUsuario(userId);
        return compras;
      }
    } catch (error) {
      console.error(error);
    }
    return [] as Compra[];
  }

  //nuevos!!

  async getCompras(): Promise<Compra[]>{
    try{
      const comprasCollection = collection(this.firestore, "compras");
      const comprasSnapshot = await getDocs(comprasCollection);
      const compras: Compra[] = [];
      comprasSnapshot.forEach(doc => {
        const compra = doc.data();
        compra['idDoc'] = doc.id;
        compras.push(compra as Compra);
      });
      return compras;
    }
    catch(error){
      console.error(error);
      return [] as Compra[];
    }
  }

  async getComprasPorFecha(fecha: string): Promise<Compra[]>{
    try{
      const comprasCollection = collection(this.firestore, "compras");
      const comprasSnapshot = await getDocs(comprasCollection);
      const compras: Compra[] = [];
      comprasSnapshot.forEach(doc => {
        const compra = doc.data();
        compra['idDoc'] = doc.id;
        console.log(compra['fecha']);
        if(compra['fecha'] === fecha){
          console.log(compra);
          compras.push(compra as Compra);
        }
      });
      return compras;
    }
    catch(error){
      console.error(error);
      return [] as Compra[];
    }
 
}

async getComprasPorNroCompra(nroCompra: string): Promise<Compra>{
  try {
    const comprasCollection = collection(this.firestore, "compras");
    const comprasSnapshot = await getDocs(comprasCollection);
    let compra: Compra | null = null;
    comprasSnapshot.forEach(doc => {
      const compraAux = doc.data();
      compraAux['idDoc'] = doc.id;
      if (compraAux['idDoc'] === nroCompra) {
        compra = compraAux as Compra;
      }
    });
    return compra || {} as Compra;
  }
  catch(error){
    console.error(error);
    return {} as Compra;
  }
}
  





}


