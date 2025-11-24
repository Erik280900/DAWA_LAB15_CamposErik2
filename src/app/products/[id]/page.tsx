import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers'; // IMPORTANTE: Para leer cookies en Server Components
import { Product, ApiResponse } from '@/types/product';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Función para obtener el producto enviando el Token
async function getProduct(id: string): Promise<Product | null> {
  try {
    // 1. Obtener el token de las cookies del servidor
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    // Si no hay token, retornamos null (o podríamos redirigir)
    if (!token) return null;

    // 2. Hacer el fetch enviando el token en el Header
    const res = await fetch(`${API_URL}/products/${id}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // <--- CLAVE PARA QUE NO DE 404
      }
    });

    if (!res.ok) {
      // Si el error es de autenticación, devolvemos null para manejarlo
      if (res.status === 401 || res.status === 403) return null;
      return null;
    }

    const data: ApiResponse<Product> = await res.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // En Next.js 15 params es una promesa, en versiones anteriores no. 
  // El await no hace daño si es versión 14.
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    // Si no hay producto (o falló el token), Next mostrará la página 404.
    // Opcional: podrías usar redirect('/login') si prefieres.
    notFound();
  }

  // Aseguramos el tipado de imageUrl por si no está en tu interfaz global
  const productWithImage = product as Product & { imageUrl?: string; CategoryId?: number };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href="/"
        className="inline-flex items-center mb-6 text-gray-600 hover:text-gray-900 transition-colors font-medium"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Volver a productos
      </Link>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        
        {/* SECCIÓN DE LA IMAGEN */}
        {productWithImage.imageUrl && (
          <div className="w-full h-96 bg-gray-100 relative">
            <img 
              src={productWithImage.imageUrl} 
              alt={product.nombre}
              className="w-full h-full object-contain mix-blend-multiply p-4" 
            />
          </div>
        )}

        <div className="p-8">
          <div className="flex justify-between items-start">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {product.nombre}
            </h1>
            <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded border border-gray-200">
               ID: {product.id}
            </span>
          </div>

          <div className="text-3xl font-bold text-blue-600 mb-6">
            S/ {product.precio}
          </div>

          {product.descripcion && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2 border-b pb-2">
                Descripción
              </h2>
              <p className="text-gray-600 leading-relaxed mt-4 text-lg">
                {product.descripcion}
              </p>
            </div>
          )}
          
          {/* Botón de acción (ejemplo de compra) */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
            <button className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium shadow-md">
              Añadir al Carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}