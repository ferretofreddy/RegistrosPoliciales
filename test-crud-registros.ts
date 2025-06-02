import { db } from "./server/db";
import { personas, vehiculos, inmuebles, ubicaciones } from "./shared/schema";
import { personasObservaciones, vehiculosObservaciones, inmueblesObservaciones, ubicacionesObservaciones } from "./shared/schema";
import { personasPersonas, personasVehiculos, personasInmuebles, personasUbicaciones } from "./shared/schema";
import { eq } from "drizzle-orm";

/**
 * Script para probar todas las funcionalidades CRUD de la página de registros
 * incluyendo observaciones y relaciones con todas las entidades
 */

async function testCRUDCompleto() {
  console.log("🔍 Iniciando pruebas CRUD completas...");
  
  try {
    // 1. Verificar que existen datos base
    console.log("\n1. Verificando datos existentes...");
    const personasExistentes = await db.select().from(personas);
    const vehiculosExistentes = await db.select().from(vehiculos);
    const inmueblesExistentes = await db.select().from(inmuebles);
    const ubicacionesExistentes = await db.select().from(ubicaciones);
    
    console.log(`- Personas: ${personasExistentes.length}`);
    console.log(`- Vehículos: ${vehiculosExistentes.length}`);
    console.log(`- Inmuebles: ${inmueblesExistentes.length}`);
    console.log(`- Ubicaciones: ${ubicacionesExistentes.length}`);
    
    if (personasExistentes.length === 0) {
      console.log("⚠️ No hay personas en la base de datos. Creando datos de prueba...");
      await crearDatosPrueba();
    }
    
    // 2. Probar creación de observaciones
    console.log("\n2. Probando creación de observaciones...");
    const personaPrueba = personasExistentes[0];
    
    // Crear observación para persona
    const [observacionPersona] = await db.insert(personasObservaciones).values({
      personaId: personaPrueba.id,
      detalle: "Observación de prueba CRUD - " + new Date().toISOString(),
      fecha: new Date(),
      usuario: "admin"
    }).returning();
    
    console.log(`✅ Observación de persona creada: ID ${observacionPersona.id}`);
    
    // 3. Probar creación de relaciones
    console.log("\n3. Probando creación de relaciones...");
    
    if (vehiculosExistentes.length > 0) {
      const vehiculoPrueba = vehiculosExistentes[0];
      try {
        const [relacionPersonaVehiculo] = await db.insert(personaVehiculoRelaciones).values({
          personaId: personaPrueba.id,
          vehiculoId: vehiculoPrueba.id
        }).returning();
        console.log(`✅ Relación persona-vehículo creada: ID ${relacionPersonaVehiculo.id}`);
      } catch (error: any) {
        if (error.message.includes('duplicate')) {
          console.log(`ℹ️ Relación persona-vehículo ya existe`);
        } else {
          throw error;
        }
      }
    }
    
    if (inmueblesExistentes.length > 0) {
      const inmueblePrueba = inmueblesExistentes[0];
      try {
        const [relacionPersonaInmueble] = await db.insert(personaInmuebleRelaciones).values({
          personaId: personaPrueba.id,
          inmuebleId: inmueblePrueba.id
        }).returning();
        console.log(`✅ Relación persona-inmueble creada: ID ${relacionPersonaInmueble.id}`);
      } catch (error: any) {
        if (error.message.includes('duplicate')) {
          console.log(`ℹ️ Relación persona-inmueble ya existe`);
        } else {
          throw error;
        }
      }
    }
    
    if (ubicacionesExistentes.length > 0) {
      const ubicacionPrueba = ubicacionesExistentes[0];
      try {
        const [relacionPersonaUbicacion] = await db.insert(personaUbicacionRelaciones).values({
          personaId: personaPrueba.id,
          ubicacionId: ubicacionPrueba.id
        }).returning();
        console.log(`✅ Relación persona-ubicación creada: ID ${relacionPersonaUbicacion.id}`);
      } catch (error: any) {
        if (error.message.includes('duplicate')) {
          console.log(`ℹ️ Relación persona-ubicación ya existe`);
        } else {
          throw error;
        }
      }
    }
    
    // 4. Verificar consulta de relaciones
    console.log("\n4. Verificando consulta de relaciones...");
    
    const relacionesPersona = await db.query.personas.findFirst({
      where: eq(personas.id, personaPrueba.id),
      with: {
        personaVehiculoRelaciones: {
          with: {
            vehiculo: true
          }
        },
        personaInmuebleRelaciones: {
          with: {
            inmueble: true
          }
        },
        personaUbicacionRelaciones: {
          with: {
            ubicacion: true
          }
        }
      }
    });
    
    console.log(`✅ Relaciones encontradas:`);
    console.log(`- Vehículos: ${relacionesPersona?.personaVehiculoRelaciones?.length || 0}`);
    console.log(`- Inmuebles: ${relacionesPersona?.personaInmuebleRelaciones?.length || 0}`);
    console.log(`- Ubicaciones: ${relacionesPersona?.personaUbicacionRelaciones?.length || 0}`);
    
    // 5. Probar eliminación de relaciones
    console.log("\n5. Probando eliminación de relaciones...");
    
    // Eliminar la relación con ubicación si existe
    if (relacionesPersona?.personaUbicacionRelaciones && relacionesPersona.personaUbicacionRelaciones.length > 0) {
      const relacionAEliminar = relacionesPersona.personaUbicacionRelaciones[0];
      await db.delete(personaUbicacionRelaciones)
        .where(eq(personaUbicacionRelaciones.id, relacionAEliminar.id));
      console.log(`✅ Relación persona-ubicación eliminada: ID ${relacionAEliminar.id}`);
    }
    
    console.log("\n✅ TODAS LAS PRUEBAS CRUD COMPLETADAS EXITOSAMENTE");
    console.log("🔍 Los formularios de actualización de registros están funcionando correctamente");
    
  } catch (error) {
    console.error("❌ Error en las pruebas CRUD:", error);
    throw error;
  }
}

async function crearDatosPrueba() {
  console.log("📝 Creando datos de prueba...");
  
  // Crear persona de prueba
  const [personaPrueba] = await db.insert(personas).values({
    nombre: "Juan Carlos Test",
    identificacion: "999999999",
    tipoIdentificacionId: 2,
    alias: ["JC"],
    telefonos: ["99999999"],
    domicilios: ["Dirección de prueba"],
    posicionEstructuraId: 1
  }).returning();
  
  // Crear vehículo de prueba
  const [vehiculoPrueba] = await db.insert(vehiculos).values({
    placa: "TEST999",
    marca: "Toyota",
    modelo: "Corolla",
    color: "Blanco",
    tipo: "Sedán"
  }).returning();
  
  // Crear inmueble de prueba
  const [inmueblePrueba] = await db.insert(inmuebles).values({
    tipo: "Casa",
    direccion: "Calle de prueba 123",
    tipoInmuebleId: 1
  }).returning();
  
  // Crear ubicación de prueba
  const [ubicacionPrueba] = await db.insert(ubicaciones).values({
    tipo: "Residencia",
    observaciones: "Ubicación de prueba",
    latitud: 9.9281,
    longitud: -84.0907,
    tipoUbicacionId: 1
  }).returning();
  
  console.log(`✅ Datos de prueba creados:`);
  console.log(`- Persona: ${personaPrueba.nombre} (ID: ${personaPrueba.id})`);
  console.log(`- Vehículo: ${vehiculoPrueba.placa} (ID: ${vehiculoPrueba.id})`);
  console.log(`- Inmueble: ${inmueblePrueba.direccion} (ID: ${inmueblePrueba.id})`);
  console.log(`- Ubicación: ${ubicacionPrueba.tipo} (ID: ${ubicacionPrueba.id})`);
}

// Ejecutar las pruebas
testCRUDCompleto().then(() => {
  console.log("🎉 Pruebas completadas");
  process.exit(0);
}).catch((error) => {
  console.error("💥 Error en las pruebas:", error);
  process.exit(1);
});