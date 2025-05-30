import { db } from "../server/db";
import { posicionesEstructura } from "@shared/schema";

/**
 * Script para inicializar las posiciones de estructura básicas
 */
async function inicializarPosiciones() {
  console.log("🚀 Iniciando creación de posiciones de estructura...");

  const posicionesIniciales = [
    // Estructuras organizacionales normales
    {
      nombre: "Director General",
      descripcion: "Máxima autoridad ejecutiva de la organización"
    },
    {
      nombre: "Subdirector",
      descripcion: "Segundo al mando, asiste al Director General"
    },
    {
      nombre: "Coordinador",
      descripcion: "Coordinador de área o departamento"
    },
    {
      nombre: "Analista",
      descripcion: "Profesional especializado en análisis"
    },
    {
      nombre: "Investigador",
      descripcion: "Especialista en investigación y análisis"
    },
    
    // Estructuras criminales
    {
      nombre: "Líder",
      descripcion: "Máximo líder de la organización criminal"
    },
    {
      nombre: "Conductor",
      descripcion: "Responsable de operaciones de transporte y logística"
    },
    {
      nombre: "Sicario",
      descripcion: "Ejecutor de actividades violentas por encargo"
    },
    {
      nombre: "Extorsionista",
      descripcion: "Especialista en actividades de extorsión y amenazas"
    },
    {
      nombre: "Distribuidor",
      descripcion: "Encargado de distribución de sustancias ilícitas"
    },
    {
      nombre: "Reclutador",
      descripcion: "Responsable de reclutar nuevos miembros"
    },
    {
      nombre: "Informante",
      descripcion: "Persona que proporciona información de inteligencia"
    },
    {
      nombre: "Lavador de Dinero",
      descripcion: "Especialista en blanqueo de capitales"
    },
    {
      nombre: "Vigía",
      descripcion: "Encargado de vigilancia y control territorial"
    },
    {
      nombre: "Correo",
      descripcion: "Transportista de mensajes, dinero o sustancias"
    }
  ];

  try {
    // Verificar si ya existen posiciones
    const posicionesExistentes = await db.select().from(posicionesEstructura);
    
    if (posicionesExistentes.length > 0) {
      console.log("⚠️ Ya existen posiciones de estructura en el sistema:");
      posicionesExistentes.forEach(pos => {
        console.log(`   - ${pos.nombre}: ${pos.descripcion}`);
      });
      console.log("No se crearán nuevas posiciones para evitar duplicados.");
      return;
    }

    // Insertar posiciones iniciales
    for (const posicion of posicionesIniciales) {
      const resultado = await db.insert(posicionesEstructura)
        .values(posicion)
        .returning();
      
      console.log(`✅ Creada posición: ${resultado[0].nombre}`);
    }

    console.log("🎉 Posiciones de estructura inicializadas correctamente!");
    console.log(`📊 Total de posiciones creadas: ${posicionesIniciales.length}`);

  } catch (error) {
    console.error("❌ Error al inicializar posiciones de estructura:", error);
    throw error;
  }
}

// Ejecutar el script
inicializarPosiciones()
  .then(() => {
    console.log("✨ Script completado exitosamente");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Error en el script:", error);
    process.exit(1);
  });