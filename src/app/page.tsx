'use client'; // Necesario para usar hooks (useState, useEffect)

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Cookies from 'js-cookie'; // 1. IMPORTANTE: Importar js-cookie
import { useRouter } from 'next/navigation'; // Opcional: Para redirigir si el token falla
import { Product, ApiResponse } from '@/types/product';

// Definimos interfaz simple para Categoría
interface Category {
  id: number;
  nombre: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para el filtro
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 2. Recuperar el token de las cookies
        const token = Cookies.get('token');

        // Si no hay token, el middleware debería haberte sacado, 
        // pero por seguridad detenemos la ejecución aquí.
        if (!token) return;

        // 3. Preparar las cabeceras con el token
        const authHeaders = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        // 4. Ejecutar peticiones enviando los headers
        const [resProducts, resCategories] = await Promise.all([
          fetch(`${API_URL}/products`, { headers: authHeaders }),
          fetch(`${API_URL}/categories`, { headers: authHeaders })
        ]);

        // Manejo básico de error de autenticación (Token expirado)
        if (resProducts.status === 401 || resProducts.status === 403) {
           Cookies.remove('token');
           Cookies.remove('role');
           router.push('/login');
           return;
        }

        const dataProducts: ApiResponse<Product[]> = await resProducts.json();
        const dataCategories: ApiResponse<Category[]> = await resCategories.json();

        if (dataProducts.success) setProducts(dataProducts.data);
        if (dataCategories.success) setCategories(dataCategories.data);

      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Lógica de filtrado
  const filteredProducts = selectedCategory === 'ALL'
    ? products
    : products.filter(product => 
        // Asegúrate de que tu backend envíe 'CategoryId' (mayúscula o minúscula según tu modelo)
        (product as any).CategoryId === parseInt(selectedCategory)
      );

  if (loading) {
    return <div className="text-center py-20 text-gray-500">Cargando catálogo...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
        
        {/* Selector de Categorías */}
        <select 
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-700 bg-white"
        >
          <option value="ALL">Todas las categorías</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.nombre}
            </option>
          ))}
        </select>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">No hay productos disponibles en esta categoría</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow flex flex-col group"
            >
              {/* Ejemplo de imagen si decides implementarla */}
              {/* 
               <div className="h-48 w-full bg-gray-100 mb-4 rounded-md overflow-hidden flex items-center justify-center text-gray-400">
                 {(product as any).imageUrl ? (
                    <img src={(product as any).imageUrl} alt={product.nombre} className="object-cover w-full h-full" />
                 ) : (
                    <span>Sin imagen</span>
                 )}
               </div> 
               */}

              <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {product.nombre}
              </h2>
              <p className="text-2xl font-bold text-gray-900 mb-3">
                S/ {product.precio}
              </p>
              {product.descripcion && (
                <p className="text-gray-600 text-sm line-clamp-2 mb-4 flex-grow">
                  {product.descripcion}
                </p>
              )}
              <span className="text-blue-600 font-medium text-sm mt-auto block">Ver detalles &rarr;</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}