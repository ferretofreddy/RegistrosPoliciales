import { db } from "../server/db";
import { nivelesCelula } from "../shared/schema";
import { eq } from "drizzle-orm";

/**
 * Script para inicializar los niveles de célula con la estructura jerárquica predefinida
 */
async function inicializarNivelesCelula() {
  try {
    console.log("🔄 Inicializando niveles de célula...");

    // Verificar si ya existen datos
    const existingNiveles = await db.select().from(nivelesCelula);
    
    if (existingNiveles.length > 0) {
      console.log("✅ Los niveles de célula ya están inicializados");
      return;
    }

    // Definir la estructura jerárquica
    const nivelesData = [
      {
        nivel: 1,
        posiciones: ["lider"]
      },
      {
        nivel: 2,
        posiciones: ["familiar", "asistente"]
      },
      {
        nivel: 3,
        posiciones: ["transportista", "campana", "logistica"]
      },
      {
        nivel: 4,
        posiciones: ["colaborador"]
      }
    ];

    // Insertar cada nivel
    for (const nivelData of nivelesData) {
      await db.insert(nivelesCelula).values(nivelData);
      console.log(`✅ Nivel ${nivelData.nivel} - ${nivelData.nombre} creado`);
    }

    console.log("🎉 Niveles de célula inicializados correctamente");
    
    // Mostrar resumen
    const totalNiveles = await db.select().from(nivelesCelula);
    console.log(`📊 Total de niveles creados: ${totalNiveles.length}`);
    
    totalNiveles.forEach(nivel => {
      console.log(`  - Nivel ${nivel.nivel}: ${nivel.nombre} (${nivel.posiciones.length} posiciones)`);
    });

  } catch (error) {
    console.error("❌ Error al inicializar niveles de célula:", error);
    throw error;
  }
}

// Ejecutar el script
inicializarNivelesCelula()
  .then(() => {
    console.log("✅ Script completado exitosamente");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error en el script:", error);
    process.exit(1);
  });