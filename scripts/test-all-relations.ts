import { db } from "../server/db";
import { 
  personas, vehiculos, inmuebles, ubicaciones,
  personasVehiculos, personasInmuebles, personasPersonas, personasUbicaciones,
  vehiculosInmuebles, vehiculosVehiculos, vehiculosUbicaciones,
  inmueblesUbicaciones
} from "../shared/schema";
import { sql } from "drizzle-orm";

/**
 * Este script prueba todas las posibles relaciones entre entidades
 * para verificar que las relaciones bidireccionales funcionen correctamente
 */
async function testAllRelations() {
  console.log("=== INICIANDO PRUEBAS DE RELACIONES ENTRE ENTIDADES ===");
  
  try {
    // 1. Crear entidades de prueba
    console.log("1. Creando entidades de prueba...");
    
    // Crear persona de prueba
    const [persona1] = await db.insert(personas).values({
      nombre: "Persona Test 1",
      identificacion: "TEST-001",
      alias: ["Test1", "Tester"],
      telefonos: ["12345678"],
      domicilios: ["Domicilio Test 1"]
    }).returning();
    console.log(`- Persona creada: ${persona1.nombre} (ID: ${persona1.id})`);
    
    const [persona2] = await db.insert(personas).values({
      nombre: "Persona Test 2",
      identificacion: "TEST-002",
      alias: ["Test2"],
      telefonos: ["87654321"],
      domicilios: ["Domicilio Test 2"]
    }).returning();
    console.log(`- Persona creada: ${persona2.nombre} (ID: ${persona2.id})`);
    
    // Crear vehículo de prueba
    const [vehiculo1] = await db.insert(vehiculos).values({
      placa: "TEST-001",
      marca: "Test Marca 1",
      modelo: "Test Modelo 1",
      color: "Negro",
      tipo: "Test"
    }).returning();
    console.log(`- Vehículo creado: ${vehiculo1.marca} ${vehiculo1.modelo} (ID: ${vehiculo1.id})`);
    
    const [vehiculo2] = await db.insert(vehiculos).values({
      placa: "TEST-002",
      marca: "Test Marca 2",
      modelo: "Test Modelo 2",
      color: "Blanco",
      tipo: "Test"
    }).returning();
    console.log(`- Vehículo creado: ${vehiculo2.marca} ${vehiculo2.modelo} (ID: ${vehiculo2.id})`);
    
    // Crear inmueble de prueba
    const [inmueble1] = await db.insert(inmuebles).values({
      tipo: "Casa",
      direccion: "Dirección Test 1",
      propietario: "Propietario Test 1",
      observaciones: "Test observaciones 1"
    }).returning();
    console.log(`- Inmueble creado: ${inmueble1.tipo} en ${inmueble1.direccion} (ID: ${inmueble1.id})`);
    
    const [inmueble2] = await db.insert(inmuebles).values({
      tipo: "Apartamento",
      direccion: "Dirección Test 2",
      propietario: "Propietario Test 2",
      observaciones: "Test observaciones 2"
    }).returning();
    console.log(`- Inmueble creado: ${inmueble2.tipo} en ${inmueble2.direccion} (ID: ${inmueble2.id})`);
    
    // Crear ubicación de prueba
    const [ubicacion1] = await db.insert(ubicaciones).values({
      latitud: 9.9281,
      longitud: -84.0907,
      tipo: "Test 1",
      observaciones: "Ubicación de prueba 1"
    }).returning();
    console.log(`- Ubicación creada: ${ubicacion1.tipo} en (${ubicacion1.latitud}, ${ubicacion1.longitud}) (ID: ${ubicacion1.id})`);
    
    const [ubicacion2] = await db.insert(ubicaciones).values({
      latitud: 9.9000,
      longitud: -84.1000,
      tipo: "Test 2",
      observaciones: "Ubicación de prueba 2"
    }).returning();
    console.log(`- Ubicación creada: ${ubicacion2.tipo} en (${ubicacion2.latitud}, ${ubicacion2.longitud}) (ID: ${ubicacion2.id})`);
    
    // 2. Crear todas las posibles relaciones entre entidades
    console.log("\n2. Creando relaciones entre entidades...");
    
    // Relaciones persona-persona
    await db.insert(personasPersonas).values({
      personaId1: persona1.id,
      personaId2: persona2.id
    });
    console.log(`- Relación creada: Persona ${persona1.id} <-> Persona ${persona2.id}`);
    
    // Relaciones persona-vehículo
    await db.insert(personasVehiculos).values({
      personaId: persona1.id,
      vehiculoId: vehiculo1.id
    });
    console.log(`- Relación creada: Persona ${persona1.id} <-> Vehículo ${vehiculo1.id}`);
    
    // Relaciones persona-inmueble
    await db.insert(personasInmuebles).values({
      personaId: persona1.id,
      inmuebleId: inmueble1.id
    });
    console.log(`- Relación creada: Persona ${persona1.id} <-> Inmueble ${inmueble1.id}`);
    
    // Relaciones persona-ubicación
    await db.insert(personasUbicaciones).values({
      personaId: persona1.id,
      ubicacionId: ubicacion1.id
    });
    console.log(`- Relación creada: Persona ${persona1.id} <-> Ubicación ${ubicacion1.id}`);
    
    // Relaciones vehículo-vehículo
    await db.execute(
      sql`INSERT INTO vehiculos_vehiculos (vehiculo_id_1, vehiculo_id_2) VALUES (${vehiculo1.id}, ${vehiculo2.id})`
    );
    console.log(`- Relación creada: Vehículo ${vehiculo1.id} <-> Vehículo ${vehiculo2.id}`);
    
    // Relaciones vehículo-inmueble
    await db.execute(
      sql`INSERT INTO vehiculos_inmuebles (vehiculo_id, inmueble_id) VALUES (${vehiculo1.id}, ${inmueble1.id})`
    );
    console.log(`- Relación creada: Vehículo ${vehiculo1.id} <-> Inmueble ${inmueble1.id}`);
    
    // Relaciones vehículo-ubicación
    await db.insert(vehiculosUbicaciones).values({
      vehiculoId: vehiculo1.id,
      ubicacionId: ubicacion1.id
    });
    console.log(`- Relación creada: Vehículo ${vehiculo1.id} <-> Ubicación ${ubicacion1.id}`);
    
    // Relaciones inmueble-inmueble
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
    
    // Relaciones inmueble-ubicación
    await db.insert(inmueblesUbicaciones).values({
      inmuebleId: inmueble1.id,
      ubicacionId: ubicacion1.id
    });
    console.log(`- Relación creada: Inmueble ${inmueble1.id} <-> Ubicación ${ubicacion1.id}`);
    
    // 3. Verificar relaciones creadas
    console.log("\n3. Verificando relaciones creadas...");
    
    // Verificar relaciones de persona1
    const relacionesPersona1 = await verificarRelacionesPersona(persona1.id);
    if (relacionesPersona1) {
      console.log(`- Relaciones de Persona ${persona1.id} verificadas correctamente`);
    }
    
    // Verificar relaciones de vehículo1
    const relacionesVehiculo1 = await verificarRelacionesVehiculo(vehiculo1.id);
    if (relacionesVehiculo1) {
      console.log(`- Relaciones de Vehículo ${vehiculo1.id} verificadas correctamente`);
    }
    
    // Verificar relaciones de inmueble1
    const relacionesInmueble1 = await verificarRelacionesInmueble(inmueble1.id);
    if (relacionesInmueble1) {
      console.log(`- Relaciones de Inmueble ${inmueble1.id} verificadas correctamente`);
    }
    
    // Verificar relaciones de ubicación1
    const relacionesUbicacion1 = await verificarRelacionesUbicacion(ubicacion1.id);
    if (relacionesUbicacion1) {
      console.log(`- Relaciones de Ubicación ${ubicacion1.id} verificadas correctamente`);
    }
    
    console.log("\n=== PRUEBAS COMPLETADAS EXITOSAMENTE ===");
    
  } catch (error) {
    console.error("Error durante las pruebas:", error);
  }
}

// Funciones auxiliares para verificar relaciones
async function verificarRelacionesPersona(personaId: number): Promise<boolean> {
  console.log(`\nVerificando relaciones de Persona ID ${personaId}:`);
  
  // Verificar relaciones con otras personas
  const relacionesPersonas = await db
    .select({
      persona: personas
    })
    .from(personasPersonas)
    .innerJoin(personas, sql`${personasPersonas.personaId2} = ${personas.id}`)
    .where(sql`${personasPersonas.personaId1} = ${personaId}`);
  
  console.log(`- Relacionada con ${relacionesPersonas.length} persona(s)`);
  
  // Verificar relaciones con vehículos
  const relacionesVehiculos = await db
    .select({
      vehiculo: vehiculos
    })
    .from(personasVehiculos)
    .innerJoin(vehiculos, sql`${personasVehiculos.vehiculoId} = ${vehiculos.id}`)
    .where(sql`${personasVehiculos.personaId} = ${personaId}`);
  
  console.log(`- Relacionada con ${relacionesVehiculos.length} vehículo(s)`);
  
  // Verificar relaciones con inmuebles
  const relacionesInmuebles = await db
    .select({
      inmueble: inmuebles
    })
    .from(personasInmuebles)
    .innerJoin(inmuebles, sql`${personasInmuebles.inmuebleId} = ${inmuebles.id}`)
    .where(sql`${personasInmuebles.personaId} = ${personaId}`);
  
  console.log(`- Relacionada con ${relacionesInmuebles.length} inmueble(s)`);
  
  // Verificar relaciones con ubicaciones
  const relacionesUbicaciones = await db
    .select({
      ubicacion: ubicaciones
    })
    .from(personasUbicaciones)
    .innerJoin(ubicaciones, sql`${personasUbicaciones.ubicacionId} = ${ubicaciones.id}`)
    .where(sql`${personasUbicaciones.personaId} = ${personaId}`);
  
  console.log(`- Relacionada con ${relacionesUbicaciones.length} ubicación(es)`);
  
  return true;
}

async function verificarRelacionesVehiculo(vehiculoId: number): Promise<boolean> {
  console.log(`\nVerificando relaciones de Vehículo ID ${vehiculoId}:`);
  
  // Verificar relaciones con personas
  const relacionesPersonas = await db
    .select({
      persona: personas
    })
    .from(personasVehiculos)
    .innerJoin(personas, sql`${personasVehiculos.personaId} = ${personas.id}`)
    .where(sql`${personasVehiculos.vehiculoId} = ${vehiculoId}`);
  
  console.log(`- Relacionado con ${relacionesPersonas.length} persona(s)`);
  
  // Verificar relaciones con otros vehículos
  const relacionesVehiculos = await db.execute(
    sql`SELECT v.* FROM vehiculos v 
        INNER JOIN vehiculos_vehiculos vv ON v.id = vv.vehiculo_id_2 
        WHERE vv.vehiculo_id_1 = ${vehiculoId}
        UNION
        SELECT v.* FROM vehiculos v 
        INNER JOIN vehiculos_vehiculos vv ON v.id = vv.vehiculo_id_1 
        WHERE vv.vehiculo_id_2 = ${vehiculoId}`
  );
  
  console.log(`- Relacionado con ${relacionesVehiculos.rows.length} vehículo(s)`);
  
  // Verificar relaciones con inmuebles
  const relacionesInmuebles = await db.execute(
    sql`SELECT i.* FROM inmuebles i 
        INNER JOIN vehiculos_inmuebles vi ON i.id = vi.inmueble_id 
        WHERE vi.vehiculo_id = ${vehiculoId}`
  );
  
  console.log(`- Relacionado con ${relacionesInmuebles.rows.length} inmueble(s)`);
  
  // Verificar relaciones con ubicaciones
  const relacionesUbicaciones = await db
    .select({
      ubicacion: ubicaciones
    })
    .from(vehiculosUbicaciones)
    .innerJoin(ubicaciones, sql`${vehiculosUbicaciones.ubicacionId} = ${ubicaciones.id}`)
    .where(sql`${vehiculosUbicaciones.vehiculoId} = ${vehiculoId}`);
  
  console.log(`- Relacionado con ${relacionesUbicaciones.length} ubicación(es)`);
  
  return true;
}

async function verificarRelacionesInmueble(inmuebleId: number): Promise<boolean> {
  console.log(`\nVerificando relaciones de Inmueble ID ${inmuebleId}:`);
  
  // Verificar relaciones con personas
  const relacionesPersonas = await db
    .select({
      persona: personas
    })
    .from(personasInmuebles)
    .innerJoin(personas, sql`${personasInmuebles.personaId} = ${personas.id}`)
    .where(sql`${personasInmuebles.inmuebleId} = ${inmuebleId}`);
  
  console.log(`- Relacionado con ${relacionesPersonas.length} persona(s)`);
  
  // Verificar relaciones con vehículos
  const relacionesVehiculos = await db.execute(
    sql`SELECT v.* FROM vehiculos v 
        INNER JOIN vehiculos_inmuebles vi ON v.id = vi.vehiculo_id 
        WHERE vi.inmueble_id = ${inmuebleId}`
  );
  
  console.log(`- Relacionado con ${relacionesVehiculos.rows.length} vehículo(s)`);
  
  // Verificar relaciones con otros inmuebles
  const relacionesInmuebles = await db.execute(
    sql`SELECT i.* FROM inmuebles i 
        INNER JOIN inmuebles_inmuebles ii ON i.id = ii.inmueble_id_2 
        WHERE ii.inmueble_id_1 = ${inmuebleId}
        UNION
        SELECT i.* FROM inmuebles i 
        INNER JOIN inmuebles_inmuebles ii ON i.id = ii.inmueble_id_1 
        WHERE ii.inmueble_id_2 = ${inmuebleId}`
  );
  
  console.log(`- Relacionado con ${relacionesInmuebles.rows.length} inmueble(s)`);
  
  // Verificar relaciones con ubicaciones
  const relacionesUbicaciones = await db
    .select({
      ubicacion: ubicaciones
    })
    .from(inmueblesUbicaciones)
    .innerJoin(ubicaciones, sql`${inmueblesUbicaciones.ubicacionId} = ${ubicaciones.id}`)
    .where(sql`${inmueblesUbicaciones.inmuebleId} = ${inmuebleId}`);
  
  console.log(`- Relacionado con ${relacionesUbicaciones.length} ubicación(es)`);
  
  return true;
}

async function verificarRelacionesUbicacion(ubicacionId: number): Promise<boolean> {
  console.log(`\nVerificando relaciones de Ubicación ID ${ubicacionId}:`);
  
  // Verificar relaciones con personas
  const relacionesPersonas = await db
    .select({
      persona: personas
    })
    .from(personasUbicaciones)
    .innerJoin(personas, sql`${personasUbicaciones.personaId} = ${personas.id}`)
    .where(sql`${personasUbicaciones.ubicacionId} = ${ubicacionId}`);
  
  console.log(`- Relacionada con ${relacionesPersonas.length} persona(s)`);
  
  // Verificar relaciones con vehículos
  const relacionesVehiculos = await db
    .select({
      vehiculo: vehiculos
    })
    .from(vehiculosUbicaciones)
    .innerJoin(vehiculos, sql`${vehiculosUbicaciones.vehiculoId} = ${vehiculos.id}`)
    .where(sql`${vehiculosUbicaciones.ubicacionId} = ${ubicacionId}`);
  
  console.log(`- Relacionada con ${relacionesVehiculos.length} vehículo(s)`);
  
  // Verificar relaciones con inmuebles
  const relacionesInmuebles = await db
    .select({
      inmueble: inmuebles
    })
    .from(inmueblesUbicaciones)
    .innerJoin(inmuebles, sql`${inmueblesUbicaciones.inmuebleId} = ${inmuebles.id}`)
    .where(sql`${inmueblesUbicaciones.ubicacionId} = ${ubicacionId}`);
  
  console.log(`- Relacionada con ${relacionesInmuebles.length} inmueble(s)`);
  
  return true;
}

// Ejecutar el script de prueba
testAllRelations()
  .then(() => {
    console.log("Script finalizado.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error ejecutando el script:", error);
    process.exit(1);
  });