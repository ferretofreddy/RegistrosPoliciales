/**
 * Test para verificar que la eliminación de células también elimine
 * correctamente todas las relaciones en celulas_personas
 */

import { db } from "./server/db";
import { personas, celulas, celulasPersonas } from "./shared/schema";
import { eq } from "drizzle-orm";

async function testCellDeletionWithRelationshipCleanup() {
  console.log("🚀 Iniciando test de eliminación de células con limpieza de relaciones");

  try {
    // 1. Crear personas de prueba
    console.log("\n1️⃣ Creando personas de prueba...");
    const personasPrueba = [];
    for (let i = 1; i <= 3; i++) {
      const [persona] = await db
        .insert(personas)
        .values({
          nombre: `Persona Test ${i}`,
          identificacion: `TEST${i.toString().padStart(8, '0')}`,
          posicionEstructura: i === 1 ? "Lider" : i === 2 ? "Sicario/Gatillero" : "Campana"
        })
        .returning();
      personasPrueba.push(persona);
      console.log(`✅ Creada: ${persona.nombre} (ID: ${persona.id})`);
    }

    // 2. Crear célula de prueba
    console.log("\n2️⃣ Creando célula de prueba...");
    const [celulaPrueba] = await db
      .insert(celulas)
      .values({
        nombreCelula: "Célula Test Eliminación",
        zona: "Zona Test",
        detalle: "Célula para probar eliminación con relaciones",
        usuario: "Test User"
      })
      .returning();
    
    console.log(`✅ Célula creada: ${celulaPrueba.nombreCelula} (ID: ${celulaPrueba.id})`);

    // 3. Crear relaciones célula-personas
    console.log("\n3️⃣ Creando relaciones célula-personas...");
    const relaciones = [];
    for (const persona of personasPrueba) {
      const [relacion] = await db
        .insert(celulasPersonas)
        .values({
          celulaId: celulaPrueba.id,
          personaId: persona.id
        })
        .returning();
      relaciones.push(relacion);
      console.log(`✅ Relación creada: Célula ${celulaPrueba.id} - Persona ${persona.id}`);
    }

    // 4. Verificar relaciones antes de eliminar
    console.log("\n4️⃣ Verificando relaciones antes de eliminar...");
    const relacionesAntes = await db
      .select()
      .from(celulasPersonas)
      .where(eq(celulasPersonas.celulaId, celulaPrueba.id));
    
    console.log(`📊 Relaciones encontradas: ${relacionesAntes.length}`);

    // 5. Eliminar célula usando el método del storage
    console.log("\n5️⃣ Eliminando célula...");
    const response = await fetch(`http://localhost:5000/api/celulas/${celulaPrueba.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include"
    });

    if (!response.ok) {
      throw new Error(`Error al eliminar célula: ${response.status} ${response.statusText}`);
    }

    console.log("✅ Célula eliminada a través de la API");

    // 6. Verificar que las relaciones fueron eliminadas
    console.log("\n6️⃣ Verificando limpieza de relaciones...");
    const relacionesDespues = await db
      .select()
      .from(celulasPersonas)
      .where(eq(celulasPersonas.celulaId, celulaPrueba.id));

    console.log(`📊 Relaciones después de eliminar: ${relacionesDespues.length}`);

    if (relacionesDespues.length === 0) {
      console.log("✅ ÉXITO: Todas las relaciones fueron eliminadas correctamente");
    } else {
      console.log("❌ ERROR: Quedan relaciones huérfanas en la base de datos");
      relacionesDespues.forEach(rel => {
        console.log(`  - Relación huérfana: ID ${rel.id}, Célula ${rel.celulaId}, Persona ${rel.personaId}`);
      });
    }

    // 7. Verificar que la célula fue eliminada
    console.log("\n7️⃣ Verificando eliminación de célula...");
    const celulaEliminada = await db
      .select()
      .from(celulas)
      .where(eq(celulas.id, celulaPrueba.id));

    if (celulaEliminada.length === 0) {
      console.log("✅ ÉXITO: Célula eliminada correctamente");
    } else {
      console.log("❌ ERROR: La célula no fue eliminada");
    }

    // 8. Limpiar personas de prueba
    console.log("\n8️⃣ Limpiando personas de prueba...");
    for (const persona of personasPrueba) {
      await db.delete(personas).where(eq(personas.id, persona.id));
      console.log(`🧹 Persona eliminada: ${persona.nombre}`);
    }

    // 9. Verificar limpieza final
    console.log("\n9️⃣ Verificación final de limpieza...");
    const relacionesFinales = await db
      .select()
      .from(celulasPersonas)
      .where(eq(celulasPersonas.celulaId, celulaPrueba.id));

    if (relacionesFinales.length === 0) {
      console.log("✅ ÉXITO TOTAL: No quedan registros huérfanos en celulas_personas");
    } else {
      console.log("⚠️  ADVERTENCIA: Encontradas relaciones huérfanas después de la limpieza");
    }

    console.log("\n🎉 Test completado exitosamente");
    return true;

  } catch (error) {
    console.error("\n❌ Error durante el test:", error);
    return false;
  }
}

// Función adicional para verificar integridad de datos
async function verificarIntegridadCelulasPersonas() {
  console.log("\n🔍 Verificando integridad de relaciones celulas_personas...");
  
  const relacionesHuerfanas = await db.execute(`
    SELECT cp.id, cp.celula_id, cp.persona_id 
    FROM celulas_personas cp
    LEFT JOIN celulas c ON cp.celula_id = c.id
    LEFT JOIN personas p ON cp.persona_id = p.id
    WHERE c.id IS NULL OR p.id IS NULL
  `);

  if (relacionesHuerfanas.rows.length === 0) {
    console.log("✅ No se encontraron relaciones huérfanas");
  } else {
    console.log(`⚠️  Encontradas ${relacionesHuerfanas.rows.length} relaciones huérfanas:`);
    relacionesHuerfanas.rows.forEach(row => {
      console.log(`  - Relación ID: ${row.id}, Célula: ${row.celula_id}, Persona: ${row.persona_id}`);
    });
  }
}

// Ejecutar test
testCellDeletionWithRelationshipCleanup()
  .then(async (success) => {
    if (success) {
      await verificarIntegridadCelulasPersonas();
      console.log("\n✅ Test de eliminación completado");
    } else {
      console.log("\n❌ Test de eliminación falló");
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("❌ Error crítico:", error);
    process.exit(1);
  });

export { testCellDeletionWithRelationshipCleanup, verificarIntegridadCelulasPersonas };