import { db } from "../server/db";
import { 
  personas, vehiculos, inmuebles, ubicaciones,
  personasVehiculos, personasInmuebles, personasPersonas, personasUbicaciones,
  vehiculosUbicaciones, inmueblesUbicaciones,
  personasObservaciones, vehiculosObservaciones, inmueblesObservaciones, ubicacionesObservaciones
} from "../shared/schema";
import { sql } from "drizzle-orm";

/**
 * Este script crea datos de prueba para verificar el correcto funcionamiento
 * de las relaciones entre entidades
 */
async function crearDatosPrueba() {
  console.log("=== CREANDO DATOS DE PRUEBA ===");
  
  try {
    // Crear personas de prueba
    console.log("1. Creando personas de prueba...");
    const [persona1] = await db.insert(personas).values({
      nombre: "Juan Pérez Sánchez",
      identificacion: "101110111",
      alias: ["Juanito", "JP"],
      telefonos: ["88888888", "99999999"],
      domicilios: ["San José, Calle 5"]
    }).returning();
    console.log(`- Persona creada: ${persona1.nombre} (ID: ${persona1.id})`);
    
    const [persona2] = await db.insert(personas).values({
      nombre: "María Rodríguez López",
      identificacion: "202220222",
      alias: ["Mari"],
      telefonos: ["77777777"],
      domicilios: ["Heredia, Av. Central"]
    }).returning();
    console.log(`- Persona creada: ${persona2.nombre} (ID: ${persona2.id})`);
    
    // Agregar observaciones a las personas
    await db.insert(personasObservaciones).values({
      personaId: persona1.id,
      fecha: new Date(),
      usuario: "Freddy Ferreto Tenorio",
      detalle: "Observación de prueba para persona 1"
    });
    
    await db.insert(personasObservaciones).values({
      personaId: persona2.id,
      fecha: new Date(),
      usuario: "Freddy Ferreto Tenorio",
      detalle: "Observación de prueba para persona 2"
    });
    
    // Crear vehículos de prueba
    console.log("\n2. Creando vehículos de prueba...");
    const [vehiculo1] = await db.insert(vehiculos).values({
      placa: "ABC123",
      marca: "Toyota",
      modelo: "Corolla",
      color: "Blanco",
      tipo: "Sedán"
    }).returning();
    console.log(`- Vehículo creado: ${vehiculo1.marca} ${vehiculo1.modelo} (ID: ${vehiculo1.id})`);
    
    const [vehiculo2] = await db.insert(vehiculos).values({
      placa: "XYZ789",
      marca: "Honda",
      modelo: "CR-V",
      color: "Negro",
      tipo: "SUV"
    }).returning();
    console.log(`- Vehículo creado: ${vehiculo2.marca} ${vehiculo2.modelo} (ID: ${vehiculo2.id})`);
    
    // Agregar observaciones a los vehículos
    await db.insert(vehiculosObservaciones).values({
      vehiculoId: vehiculo1.id,
      fecha: new Date(),
      usuario: "Freddy Ferreto Tenorio",
      detalle: "Observación de prueba para vehículo 1"
    });
    
    await db.insert(vehiculosObservaciones).values({
      vehiculoId: vehiculo2.id,
      fecha: new Date(),
      usuario: "Freddy Ferreto Tenorio",
      detalle: "Observación de prueba para vehículo 2"
    });
    
    // Crear inmuebles de prueba
    console.log("\n3. Creando inmuebles de prueba...");
    const [inmueble1] = await db.insert(inmuebles).values({
      tipo: "Casa",
      direccion: "San José, Calle Principal #123",
      propietario: "Juan Pérez Sánchez",
      observaciones: "Casa de dos pisos con garaje"
    }).returning();
    console.log(`- Inmueble creado: ${inmueble1.tipo} en ${inmueble1.direccion} (ID: ${inmueble1.id})`);
    
    const [inmueble2] = await db.insert(inmuebles).values({
      tipo: "Apartamento",
      direccion: "Heredia, Residencial Las Flores #45",
      propietario: "María Rodríguez López",
      observaciones: "Apartamento en tercer piso"
    }).returning();
    console.log(`- Inmueble creado: ${inmueble2.tipo} en ${inmueble2.direccion} (ID: ${inmueble2.id})`);
    
    // Agregar observaciones a los inmuebles
    await db.insert(inmueblesObservaciones).values({
      inmuebleId: inmueble1.id,
      fecha: new Date(),
      usuario: "Freddy Ferreto Tenorio",
      detalle: "Observación de prueba para inmueble 1"
    });
    
    await db.insert(inmueblesObservaciones).values({
      inmuebleId: inmueble2.id,
      fecha: new Date(),
      usuario: "Freddy Ferreto Tenorio",
      detalle: "Observación de prueba para inmueble 2"
    });
    
    // Crear ubicaciones de prueba
    console.log("\n4. Creando ubicaciones de prueba...");
    const [ubicacion1] = await db.insert(ubicaciones).values({
      latitud: 9.9281,
      longitud: -84.0907,
      tipo: "Domicilio",
      observaciones: "Ubicación de prueba 1 - San José"
    }).returning();
    console.log(`- Ubicación creada: ${ubicacion1.tipo} en (${ubicacion1.latitud}, ${ubicacion1.longitud}) (ID: ${ubicacion1.id})`);
    
    const [ubicacion2] = await db.insert(ubicaciones).values({
      latitud: 10.0023,
      longitud: -84.1166,
      tipo: "Trabajo",
      observaciones: "Ubicación de prueba 2 - Heredia"
    }).returning();
    console.log(`- Ubicación creada: ${ubicacion2.tipo} en (${ubicacion2.latitud}, ${ubicacion2.longitud}) (ID: ${ubicacion2.id})`);
    
    // Agregar observaciones a las ubicaciones
    await db.insert(ubicacionesObservaciones).values({
      ubicacionId: ubicacion1.id,
      fecha: new Date(),
      usuario: "Freddy Ferreto Tenorio",
      detalle: "Observación de prueba para ubicación 1"
    });
    
    await db.insert(ubicacionesObservaciones).values({
      ubicacionId: ubicacion2.id,
      fecha: new Date(),
      usuario: "Freddy Ferreto Tenorio",
      detalle: "Observación de prueba para ubicación 2"
    });
    
    // Crear relaciones entre entidades
    console.log("\n5. Creando relaciones entre entidades...");
    
    // Relación persona-persona
    await db.insert(personasPersonas).values({
      personaId1: persona1.id,
      personaId2: persona2.id
    });
    console.log(`- Relación creada: Persona ${persona1.id} <-> Persona ${persona2.id}`);
    
    // Relación persona-vehículo
    await db.insert(personasVehiculos).values({
      personaId: persona1.id,
      vehiculoId: vehiculo1.id
    });
    console.log(`- Relación creada: Persona ${persona1.id} <-> Vehículo ${vehiculo1.id}`);
    
    await db.insert(personasVehiculos).values({
      personaId: persona2.id,
      vehiculoId: vehiculo2.id
    });
    console.log(`- Relación creada: Persona ${persona2.id} <-> Vehículo ${vehiculo2.id}`);
    
    // Relación persona-inmueble
    await db.insert(personasInmuebles).values({
      personaId: persona1.id,
      inmuebleId: inmueble1.id
    });
    console.log(`- Relación creada: Persona ${persona1.id} <-> Inmueble ${inmueble1.id}`);
    
    await db.insert(personasInmuebles).values({
      personaId: persona2.id,
      inmuebleId: inmueble2.id
    });
    console.log(`- Relación creada: Persona ${persona2.id} <-> Inmueble ${inmueble2.id}`);
    
    // Relación persona-ubicación
    await db.insert(personasUbicaciones).values({
      personaId: persona1.id,
      ubicacionId: ubicacion1.id
    });
    console.log(`- Relación creada: Persona ${persona1.id} <-> Ubicación ${ubicacion1.id}`);
    
    await db.insert(personasUbicaciones).values({
      personaId: persona2.id,
      ubicacionId: ubicacion2.id
    });
    console.log(`- Relación creada: Persona ${persona2.id} <-> Ubicación ${ubicacion2.id}`);
    
    // Relación vehículo-vehículo
    await db.execute(
      sql`INSERT INTO vehiculos_vehiculos (vehiculo_id_1, vehiculo_id_2) VALUES (${vehiculo1.id}, ${vehiculo2.id})`
    );
    console.log(`- Relación creada: Vehículo ${vehiculo1.id} <-> Vehículo ${vehiculo2.id}`);
    
    // Relación vehículo-inmueble
    await db.execute(
      sql`INSERT INTO vehiculos_inmuebles (vehiculo_id, inmueble_id) VALUES (${vehiculo1.id}, ${inmueble1.id})`
    );
    console.log(`- Relación creada: Vehículo ${vehiculo1.id} <-> Inmueble ${inmueble1.id}`);
    
    await db.execute(
      sql`INSERT INTO vehiculos_inmuebles (vehiculo_id, inmueble_id) VALUES (${vehiculo2.id}, ${inmueble2.id})`
    );
    console.log(`- Relación creada: Vehículo ${vehiculo2.id} <-> Inmueble ${inmueble2.id}`);
    
    // Relación vehículo-ubicación
    await db.insert(vehiculosUbicaciones).values({
      vehiculoId: vehiculo1.id,
      ubicacionId: ubicacion1.id
    });
    console.log(`- Relación creada: Vehículo ${vehiculo1.id} <-> Ubicación ${ubicacion1.id}`);
    
    await db.insert(vehiculosUbicaciones).values({
      vehiculoId: vehiculo2.id,
      ubicacionId: ubicacion2.id
    });
    console.log(`- Relación creada: Vehículo ${vehiculo2.id} <-> Ubicación ${ubicacion2.id}`);
    
    // Relación inmueble-inmueble
    await db.execute(
      sql`CREATE TABLE IF NOT EXISTS inmuebles_inmuebles (
        id SERIAL PRIMARY KEY,
        inmueble_id_1 INTEGER NOT NULL REFERENCES inmuebles(id),
        inmueble_id_2 INTEGER NOT NULL REFERENCES inmuebles(id)
      )`
    );
    await db.execute(
      sql`INSERT INTO inmuebles_inmuebles (inmueble_id_1, inmueble_id_2) VALUES (${inmueble1.id}, ${inmueble2.id})`
    );
    console.log(`- Relación creada: Inmueble ${inmueble1.id} <-> Inmueble ${inmueble2.id}`);
    
    // Relación inmueble-ubicación
    await db.insert(inmueblesUbicaciones).values({
      inmuebleId: inmueble1.id,
      ubicacionId: ubicacion1.id
    });
    console.log(`- Relación creada: Inmueble ${inmueble1.id} <-> Ubicación ${ubicacion1.id}`);
    
    await db.insert(inmueblesUbicaciones).values({
      inmuebleId: inmueble2.id,
      ubicacionId: ubicacion2.id
    });
    console.log(`- Relación creada: Inmueble ${inmueble2.id} <-> Ubicación ${ubicacion2.id}`);
    
    console.log("\n=== DATOS DE PRUEBA CREADOS EXITOSAMENTE ===");
    
  } catch (error) {
    console.error("Error durante la creación de datos de prueba:", error);
  }
}

// Ejecutar el script
crearDatosPrueba()
  .then(() => {
    console.log("Script finalizado. Los datos de prueba han sido creados.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error ejecutando el script:", error);
    process.exit(1);
  });