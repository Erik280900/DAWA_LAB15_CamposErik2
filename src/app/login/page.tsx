'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (data.success) {
      // Guardar token y rol en Cookies para que el Middleware lo lea
      Cookies.set('token', data.token);
      Cookies.set('role', data.role);
      
      if (data.role === 'ADMIN') router.push('/admin');
      else router.push('/');
    } else {
      alert(data.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
        <h1 className="text-2xl text-black font-bold mb-4">Iniciar Sesión</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input type="email" placeholder="Email" className="border p-2 text-black" onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" className="border p-2 text-black" onChange={e => setPassword(e.target.value)} />
            <button type="submit" className="bg-blue-600 text-white p-2 rounded">Entrar</button>
        </form>
    </div>
  );
}