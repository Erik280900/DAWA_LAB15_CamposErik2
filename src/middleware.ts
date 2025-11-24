import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const role = request.cookies.get('role')?.value;
  const path = request.nextUrl.pathname;

  // 1. Definir rutas públicas (las únicas a las que se puede entrar sin login)
  const publicPaths = ['/login', '/register'];

  // 2. Si es una ruta pública...
  if (publicPaths.includes(path)) {
    // Si YA tiene token, no tiene sentido que vaya a login, lo mandamos a home
    if (token) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    // Si no tiene token, dejamos pasar
    return NextResponse.next();
  }

  // 3. Para cualquier otra ruta (privada), si NO hay token -> Login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 4. Protección específica de ADMIN
  if (path.startsWith('/admin')) {
    if (role !== 'ADMIN') {
      // Si es cliente y quiere entrar a admin -> Lo mandamos al Home
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 5. Si tiene token y permisos -> Dejar pasar
  return NextResponse.next();
}

// OJO: El matcher ahora debe incluir todo, excepto archivos estáticos
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};