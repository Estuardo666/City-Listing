import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { GooglePlacesImport } from '@/components/features/admin/google-places-import';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Importar Locales - Administración',
  description: 'Importa locales desde Google Places API',
};

export default async function ImportPage() {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/auth/signin');
  }

  // Obtener categorías para el formulario
  const categories = await prisma.category.findMany({
    where: {
      type: 'VENUE', // Asegurando que sea mayúscula según el enum del schema
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Importar Locales</h1>
        <p className="text-gray-600 mt-2">
          Importa información de locales directamente desde Google Places API
        </p>
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuración requerida</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>• Asegúrate de tener configurada la variable de entorno <code className="bg-gray-100 px-2 py-1 rounded">GOOGLE_PLACES_API_KEY</code></p>
              <p>• La API key debe tener habilitados los siguientes servicios:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Places API (New)</li>
                <li>Geocoding API</li>
                <li>Maps Static API (para fotos)</li>
              </ul>
              <p>• Recuerda configurar las cuotas y límites de uso en Google Cloud Console</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <GooglePlacesImport categories={categories} />
    </div>
  );
}
