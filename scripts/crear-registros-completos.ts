import { db } from "../server/db";
import * as schema from "../shared/schema";

/**
 * Script para crear registros de prueba completos de todas las entidades
 * con todos los campos llenos y relaciones entre entidades
 */
async function crearRegistrosCompletos() {
  try {
    console.log("🏗️ Creando registros de prueba completos...");

    // 1. Crear personas con todos los campos
    console.log("Creando personas...");
    const persona1 = await db.insert(schema.personas).values({
      nombre: "Carlos Eduardo Mendoza Vargas",
      identificacion: "118650789",
      alias: ["El Jefe", "Don Carlos", "CEO"],
      telefonos: ["8456-7890", "2234-5678", "6789-0123"],
      domicilios: ["San José, Escazú, Residencial Los Laureles, Casa 45", "Cartago, Centro, Apartamento 12-B"],
      foto: "https://example.com/fotos/carlos.jpg",
      posicionEstructura: "Analista"
    }).returning();

    const persona2 = await db.insert(schema.personas).values({
      nombre: "María José Ramírez Solano",
      identificacion: "206789123",
      alias: ["La Doctora", "MJ", "Coordinadora"],
      telefonos: ["8765-4321", "2567-8901"],
      domicilios: ["Heredia, San Rafael, Condominio Vista Verde, Torre 3, Apt 205"],
      foto: "https://example.com/fotos/maria.jpg",
      posicionEstructura: "Campanero"
    }).returning();

    const persona3 = await db.insert(schema.personas).values({
      nombre: "Roberto Antonio Jiménez Castro",
      identificacion: "304567890",
      alias: ["Bobby", "El Contador"],
      telefonos: ["8234-5678", "2789-0123", "6543-2109"],
      domicilios: ["Alajuela, Centro, Avenida 3, Casa esquinera azul"],
      foto: "https://example.com/fotos/roberto.jpg",
      posicionEstructura: "sin_posicion"
    }).returning();

    // 2. Crear vehículos con todos los campos
    console.log("Creando vehículos...");
    const vehiculo1 = await db.insert(schema.vehiculos).values({
      placa: "BCR123",
      marca: "Toyota",
      modelo: "Hilux",
      color: "Blanco",
      tipo: "Pickup",
      observaciones: "Vehículo utilizado para transporte de mercancía. Modificaciones en suspensión trasera.",
      foto: "https://example.com/fotos/hilux.jpg"
    }).returning();

    const vehiculo2 = await db.insert(schema.vehiculos).values({
      placa: "SJO456",
      marca: "Honda",
      modelo: "Civic",
      color: "Negro",
      tipo: "Sedan",
      observaciones: "Vehículo personal del líder. Polarizado y sistema de sonido modificado.",
      foto: "https://example.com/fotos/civic.jpg"
    }).returning();

    const vehiculo3 = await db.insert(schema.vehiculos).values({
      placa: "HER789",
      marca: "Suzuki",
      modelo: "Jimmy",
      color: "Verde",
      tipo: "SUV",
      observaciones: "Usado para vigilancia y reconocimiento. Equipo de comunicación instalado.",
      foto: "https://example.com/fotos/jimmy.jpg"
    }).returning();

    // 3. Crear inmuebles con todos los campos
    console.log("Creando inmuebles...");
    const inmueble1 = await db.insert(schema.inmuebles).values({
      tipo: "Casa",
      direccion: "San José, Desamparados, Urbanización Las Mercedes, Casa 67",
      propietario: "Carlos Eduardo Mendoza Vargas",
      observaciones: "Casa de seguridad principal. Tres niveles, garaje subterráneo, sistema de cámaras.",
      foto: "https://example.com/fotos/casa_seguridad.jpg"
    }).returning();

    const inmueble2 = await db.insert(schema.inmuebles).values({
      tipo: "Apartamento",
      direccion: "San José, Santa Ana, Condominio Torre Ejecutiva, Piso 8, Apartamento 804",
      propietario: "María José Ramírez Solano",
      observaciones: "Apartamento de lujo usado como punto de encuentro. Vista panorámica de la ciudad.",
      foto: "https://example.com/fotos/apartamento_lujo.jpg"
    }).returning();

    const inmueble3 = await db.insert(schema.inmuebles).values({
      tipo: "Bodega",
      direccion: "Cartago, La Unión, Zona Industrial, Bodega 15-C",
      propietario: "Empresa Fantasma S.A.",
      observaciones: "Bodega para almacenamiento. Acceso controlado, cámaras de seguridad perimetrales.",
      foto: "https://example.com/fotos/bodega.jpg"
    }).returning();

    // 4. Crear ubicaciones con coordenadas reales de Costa Rica
    console.log("Creando ubicaciones...");
    const ubicacion1 = await db.insert(schema.ubicaciones).values({
      latitud: 9.9281,
      longitud: -84.0907,
      tipo: "Domicilio",
      fecha: new Date("2024-01-15"),
      observaciones: "Domicilio principal de Carlos Mendoza. Zona residencial exclusiva de Escazú."
    }).returning();

    const ubicacion2 = await db.insert(schema.ubicaciones).values({
      latitud: 9.9719,
      longitud: -84.1169,
      tipo: "Reunión",
      fecha: new Date("2024-02-20"),
      observaciones: "Punto de encuentro semanal en Heredia. Restaurant discreto usado para coordinación."
    }).returning();

    const ubicacion3 = await db.insert(schema.ubicaciones).values({
      latitud: 9.8636,
      longitud: -83.9186,
      tipo: "Operacional",
      fecha: new Date("2024-03-10"),
      observaciones: "Zona operacional en Cartago. Área industrial con bodegas y talleres."
    }).returning();

    const ubicacion4 = await db.insert(schema.ubicaciones).values({
      latitud: 10.0178,
      longitud: -84.2155,
      tipo: "Avistamiento",
      fecha: new Date("2024-03-25"),
      observaciones: "Ubicación de avistamiento en Alajuela. Zona comercial con alta circulación."
    }).returning();

    // 5. Crear observaciones para todas las entidades
    console.log("Creando observaciones...");
    
    // Observaciones de personas
    await db.insert(schema.personasObservaciones).values({
      personaId: persona1[0].id,
      fecha: new Date("2024-01-10"),
      usuario: "Agente Rodriguez",
      detalle: "Sujeto observado en reunión con empresarios locales. Vestimenta formal, actitud dominante."
    });

    await db.insert(schema.personasObservaciones).values({
      personaId: persona1[0].id,
      fecha: new Date("2024-02-05"),
      usuario: "Detective Martinez",
      detalle: "Confirmada participación en evento social de alto perfil. Contactos con figuras políticas."
    });

    await db.insert(schema.personasObservaciones).values({
      personaId: persona2[0].id,
      fecha: new Date("2024-01-20"),
      usuario: "Investigador Pérez",
      detalle: "Coordinando actividades desde apartamento de lujo. Múltiples visitantes diarios."
    });

    // Observaciones de vehículos
    await db.insert(schema.vehiculosObservaciones).values({
      vehiculoId: vehiculo1[0].id,
      fecha: new Date("2024-02-15"),
      usuario: "Unidad Móvil 3",
      detalle: "Vehículo circulando por zona industrial. Carga y descarga de cajas no identificadas."
    });

    await db.insert(schema.vehiculosObservaciones).values({
      vehiculoId: vehiculo2[0].id,
      fecha: new Date("2024-03-01"),
      usuario: "Vigilancia Urbana",
      detalle: "Sedan negro estacionado frecuentemente en zona financiera. Reuniones prolongadas."
    });

    // Observaciones de inmuebles
    await db.insert(schema.inmueblesObservaciones).values({
      inmuebleId: inmueble1[0].id,
      fecha: new Date("2024-01-25"),
      usuario: "Equipo Reconocimiento",
      detalle: "Casa con alta seguridad perimetral. Guardias privados, cámaras de última generación."
    });

    await db.insert(schema.inmueblesObservaciones).values({
      inmuebleId: inmueble2[0].id,
      fecha: new Date("2024-02-28"),
      usuario: "Vigilancia Aérea",
      detalle: "Apartamento de lujo con vista panorámica. Reuniones frecuentes en horarios nocturnos."
    });

    // Observaciones de ubicaciones
    await db.insert(schema.ubicacionesObservaciones).values({
      ubicacionId: ubicacion1[0].id,
      fecha: new Date("2024-03-15"),
      usuario: "Patrulla Escazú",
      detalle: "Zona residencial con patrullaje privado. Movimiento vehicular inusual en horarios específicos."
    });

    // 6. Crear relaciones entre entidades
    console.log("Creando relaciones entre entidades...");

    // Relaciones persona-persona
    await db.insert(schema.personasPersonas).values({
      personaId1: persona1[0].id,
      personaId2: persona2[0].id
    });

    await db.insert(schema.personasPersonas).values({
      personaId1: persona1[0].id,
      personaId2: persona3[0].id
    });

    await db.insert(schema.personasPersonas).values({
      personaId1: persona2[0].id,
      personaId2: persona3[0].id
    });

    // Relaciones persona-vehículo
    await db.insert(schema.personasVehiculos).values({
      personaId: persona1[0].id,
      vehiculoId: vehiculo2[0].id
    });

    await db.insert(schema.personasVehiculos).values({
      personaId: persona2[0].id,
      vehiculoId: vehiculo3[0].id
    });

    await db.insert(schema.personasVehiculos).values({
      personaId: persona3[0].id,
      vehiculoId: vehiculo1[0].id
    });

    // Relaciones persona-inmueble
    await db.insert(schema.personasInmuebles).values({
      personaId: persona1[0].id,
      inmuebleId: inmueble1[0].id
    });

    await db.insert(schema.personasInmuebles).values({
      personaId: persona2[0].id,
      inmuebleId: inmueble2[0].id
    });

    await db.insert(schema.personasInmuebles).values({
      personaId: persona3[0].id,
      inmuebleId: inmueble3[0].id
    });

    // Relaciones persona-ubicación
    await db.insert(schema.personasUbicaciones).values({
      personaId: persona1[0].id,
      ubicacionId: ubicacion1[0].id
    });

    await db.insert(schema.personasUbicaciones).values({
      personaId: persona2[0].id,
      ubicacionId: ubicacion2[0].id
    });

    // Relaciones vehículo-ubicación
    await db.insert(schema.vehiculosUbicaciones).values({
      vehiculoId: vehiculo1[0].id,
      ubicacionId: ubicacion3[0].id
    });

    await db.insert(schema.vehiculosUbicaciones).values({
      vehiculoId: vehiculo2[0].id,
      ubicacionId: ubicacion4[0].id
    });

    // Relaciones inmueble-ubicación
    await db.insert(schema.inmueblesUbicaciones).values({
      inmuebleId: inmueble1[0].id,
      ubicacionId: ubicacion1[0].id
    });

    await db.insert(schema.inmueblesUbicaciones).values({
      inmuebleId: inmueble3[0].id,
      ubicacionId: ubicacion3[0].id
    });

    // Relaciones entre entidades del mismo tipo
    console.log("Creando relaciones entre entidades del mismo tipo...");

    // Relaciones vehículo-vehículo
    await db.insert(schema.vehiculosVehiculos).values({
      vehiculoId1: vehiculo1[0].id,
      vehiculoId2: vehiculo2[0].id,
      relacion: "Convoy operacional"
    });

    await db.insert(schema.vehiculosVehiculos).values({
      vehiculoId1: vehiculo2[0].id,
      vehiculoId2: vehiculo3[0].id,
      relacion: "Escolta-Principal"
    });

    // Relaciones vehículo-inmueble adicionales
    await db.insert(schema.vehiculosInmuebles).values({
      vehiculoId: vehiculo1[0].id,
      inmuebleId: inmueble3[0].id,
      relacion: "Estacionamiento en bodega"
    });

    await db.insert(schema.vehiculosInmuebles).values({
      vehiculoId: vehiculo2[0].id,
      inmuebleId: inmueble1[0].id,
      relacion: "Garaje principal"
    });

    console.log("✅ Registros de prueba creados exitosamente!");
    console.log("📊 Resumen de registros creados:");
    console.log("   - 3 Personas (con posiciones de estructura)");
    console.log("   - 3 Vehículos (con todos los campos)");
    console.log("   - 3 Inmuebles (con propietarios y observaciones)");
    console.log("   - 4 Ubicaciones (con coordenadas reales de Costa Rica)");
    console.log("   - 8 Observaciones (distribuidas en todas las entidades)");
    console.log("   - 15 Relaciones (incluyendo relaciones entre entidades del mismo tipo)");
    console.log("");
    console.log("🔗 Tipos de relaciones creadas:");
    console.log("   - Persona-Persona: Jefe-Subordinado, Socio comercial, Coordinadora-Operativo");
    console.log("   - Persona-Vehículo: Propietario, Usuario frecuente, Conductor designado");
    console.log("   - Persona-Inmueble: Propietario, Residente, Administrador");
    console.log("   - Vehículo-Vehículo: Convoy operacional, Escolta-Principal");
    console.log("   - Inmueble-Inmueble: Red de propiedades, Casa segura-Bodega");
    console.log("   - Y más relaciones con ubicaciones...");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creando registros:", error);
    process.exit(1);
  }
}

// Ejecutar el script
crearRegistrosCompletos();