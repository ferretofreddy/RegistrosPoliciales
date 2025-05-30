import { db } from "../server/db";
import { posicionesEstructura } from "@shared/schema";

/**
 * Script para inicializar las posiciones de estructura básicas
 */
async function inicializarPosiciones() {
  console.log("🚀 Iniciando creación de posiciones de estructura...");

  const posicionesIniciales = [
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
      nombre: "Jefe de Departamento",
      descripcion: "Responsable de un departamento específico"
    },
    {
      nombre: "Supervisor",
      descripcion: "Supervisor directo de equipos de trabajo"
    },
    {
      nombre: "Analista",
      descripcion: "Profesional especializado en análisis"
    },
    {
      nombre: "Técnico",
      descripcion: "Personal técnico especializado"
    },
    {
      nombre: "Agente",
      descripcion: "Agente operativo de campo"
    },
    {
      nombre: "Asistente",
      descripcion: "Personal de apoyo administrativo"
    },
    {
      nombre: "Investigador",
      descripcion: "Especialista en investigación y análisis"
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