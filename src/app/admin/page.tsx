'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie'; // Necesario para el token
import { useRouter } from 'next/navigation';
import { Product, ApiResponse } from '@/types/product';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Interfaz local para Categoría
interface Category {
  id: number;
  nombre: string;
}

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]); // Estado para categorías
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Estado del formulario actualizado con nuevos campos
  const [formData, setFormData] = useState({
    nombre: '',
    precio: '',
    descripcion: '',
    imageUrl: '',     // Nuevo campo
    CategoryId: ''    // Nuevo campo (como string para el select)
  });
  
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 1. Obtener Token
      const token = Cookies.get('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const headers = { 'Authorization': `Bearer ${token}` };

      // 2. Peticiones en paralelo (Productos y Categorías) enviando el Token
      const [resProducts, resCategories] = await Promise.all([
        fetch(`${API_URL}/products`, { headers }),
        fetch(`${API_URL}/categories`, { headers })
      ]);

      if (!resProducts.ok || !resCategories.ok) {
        if (resProducts.status === 401) router.push('/login');
        throw new Error('Error al obtener datos');
      }

      const dataProducts: ApiResponse<Product[]> = await resProducts.json();
      const dataCategories: ApiResponse<Category[]> = await resCategories.json();

      if (dataProducts.success) setProducts(dataProducts.data);
      if (dataCategories.success) setCategories(dataCategories.data);

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = Cookies.get('token'); // Token fresco
    if (!token) return;

    const url = editingId
      ? `${API_URL}/products/${editingId}`
      : `${API_URL}/products`;
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Header Auth Importante
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          precio: parseFloat(formData.precio),
          descripcion: formData.descripcion || undefined,
          imageUrl: formData.imageUrl || undefined,
          CategoryId: formData.CategoryId ? parseInt(formData.CategoryId) : null
        }),
      });

      if (res.ok) {
        resetForm();
        fetchData(); // Recargar lista
      } else {
        alert('Error al guardar el producto');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleEdit = (product: Product) => {
    setFormData({
      nombre: product.nombre,
      precio: product.precio.toString(),
      descripcion: product.descripcion || '',
      imageUrl: (product as any).imageUrl || '',      // Asumiendo que viene del backend
      CategoryId: (product as any).CategoryId?.toString() || '' // Asumiendo que viene del backend
    });
    setEditingId(product.id);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro?')) return;
    const token = Cookies.get('token');

    try {
      const res = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}` // Header Auth Importante
        }
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const resetForm = () => {
    setFormData({ nombre: '', precio: '', descripcion: '', imageUrl: '', CategoryId: '' });
    setEditingId(null);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center text-gray-500">Cargando panel...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Administración de Productos
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingId ? 'Editar Producto' : 'Crear Producto'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              {/* Precio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.precio}
                  onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              {/* Categoría (Select) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  required
                  value={formData.CategoryId}
                  onChange={(e) => setFormData({ ...formData, CategoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                >
                  <option value="">Seleccione una categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* URL Imagen */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL de Imagen</label>
                <input
                  type="text"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  rows={3}
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              {/* Botones */}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-gray-900 text-white py-2 rounded-md hover:bg-gray-800 transition-colors font-medium"
                >
                  {editingId ? 'Actualizar' : 'Crear'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-gray-700"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Tabla */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => {
                  // Buscar nombre de categoría para mostrarlo en la tabla
                  const catName = categories.find(c => c.id === (product as any).CategoryId)?.nombre || '-';
                  
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {/* Miniatura de imagen (opcional) */}
                          {(product as any).imageUrl && (
                            <img 
                              src={(product as any).imageUrl} 
                              alt="" 
                              className="h-8 w-8 rounded-full object-cover mr-3 border border-gray-200" 
                            />
                          )}
                          <div className="text-sm font-medium text-gray-900">{product.nombre}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {catName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        S/ {product.precio}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-blue-600 hover:text-blue-900 mr-4 font-medium"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-900 font-medium"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {products.length === 0 && (
              <div className="text-center py-10 text-gray-500">
                No hay productos registrados.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}