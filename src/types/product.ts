export interface Product {
  id: string;
  nombre: string;
  precio: number;
  descripcion: string;
  imageUrl?: string;    
  CategoryId?: number;    
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}