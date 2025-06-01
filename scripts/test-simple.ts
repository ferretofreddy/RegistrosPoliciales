import { db } from "../server/db";
import { sql } from "drizzle-orm";
import { 
  personas, vehiculos, inmuebles, ubicaciones,
  vehiculosInmuebles, inmueblesUbicaciones
} from "../shared/schema";

async function testSimple() {
  console.log('🧪 Creando registros de prueba...');
  
  // Crear registros básicos
  const [persona] = await db.insert(personas).values({
    nombre: "TEST Persona",
    tipoIdentificacionId: 1,
    identificacion: "TEST001"
  }).returning();

  const [vehiculo] = await db.insert(vehiculos).values({
    placa: "TEST001",
    marca: "TEST",
    modelo: "TEST",
    color: "TEST"
  }).returning();

  const [inmueble] = await db.insert(inmuebles).values({
    tipo: "TEST Casa",
    direccion: "TEST Dirección"
  }).returning();

  const [ubicacion] = await db.insert(ubicaciones).values({
    nombre: "TEST Ubicación",
    tipoUbicacionId: 1,
    latitud: 9.9281,
    longitud: -84.0907
  }).returning();

  // Crear relaciones
  await db.insert(vehiculosInmuebles).values({
    vehiculoId: vehiculo.id,
    inmuebleId: inmueble.id
  });

  await db.insert(inmueblesUbicaciones).values({
    inmuebleId: inmueble.id,
    ubicacionId: ubicacion.id
  });

  console.log('✅ Registros creados:');
  console.log(`   Persona: ${persona.id}`);
  console.log(`   Vehículo: ${vehiculo.id}`);
  console.log(`   Inmueble: ${inmueble.id}`);
  console.log(`   Ubicación: ${ubicacion.id}`);
  
  console.log('\n🔗 Relaciones creadas. Ahora puedes probar las eliminaciones con:');
  console.log(`curl -X DELETE "http://localhost:5000/api/relaciones/inmueble/${inmueble.id}/vehiculo/${vehiculo.id}"`);
  console.log(`curl -X DELETE "http://localhost:5000/api/relaciones/ubicacion/${ubicacion.id}/inmueble/${inmueble.id}"`);
}

testSimple().catch(console.error);