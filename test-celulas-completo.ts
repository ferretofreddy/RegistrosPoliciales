/**
 * Test completo para verificar funcionalidad de células con personas
 * Incluye creación, búsqueda, asignación y visualización de organigrama
 */

import { db } from "./server/db";
import { personas, celulas, celulasPersonas, posicionesEstructura } from "./shared/schema";
import { eq } from "drizzle-orm";

async function crearPersonasPrueba() {
  console.log("🔄 Creando personas de prueba...");
  
  const personasTest = [
    {
      nombre: "Juan Carlos López",
      identificacion: "12345678",
      posicionEstructura: "Lider"
    },
    {
      nombre: "María Elena García",
      identificacion: "87654321", 
      posicionEstructura: "Familiar de lider"
    },
    {
      nombre: "Pedro Ramírez Santos",
      identificacion: "11223344",
      posicionEstructura: "Sicario/Gatillero"
    },
    {
      nombre: "Ana Sofía Herrera",
      identificacion: "44332211",
      posicionEstructura: "Logistica"
    }
  ];

  const personasCreadas = [];
  for (const personaData of personasTest) {
    const [persona] = await db
      .insert(personas)
      .values(personaData)
      .returning();
    personasCreadas.push(persona);
    console.log(`✅ Persona creada: ${persona.nombre} (${persona.identificacion})`);
  }

  return personasCreadas;
}

async function probarBusquedaPersonas() {
  console.log("\n🔍 Probando búsqueda de personas...");
  
  // Probar búsqueda por nombre
  const busquedaNombre = await fetch("http://localhost:5000/api/personas/search?search=Juan");
  const resultadosNombre = await busquedaNombre.json();
  console.log(`Búsqueda por 'Juan':`, resultadosNombre.length, "resultados");

  // Probar búsqueda por identificación
  const busquedaId = await fetch("http://localhost:5000/api/personas/search?search=123");
  const resultadosId = await busquedaId.json();
  console.log(`Búsqueda por '123':`, resultadosId.length, "resultados");

  return resultadosNombre.concat(resultadosId);
}

async function crearCelulaConPersonas(personasIds: number[]) {
  console.log("\n🏗️ Creando célula con personas asignadas...");
  
  const celulaData = {
    nombreCelula: "Célula Test Organigrama",
    zona: "Zona Norte - Prueba",
    detalle: "Célula de prueba para verificar organigrama jerárquico",
    usuario: "Admin Test",
    personaIds: personasIds
  };

  const response = await fetch("http://localhost:5000/api/celulas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(celulaData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Error al crear célula: ${error.message}`);
  }

  const celula = await response.json();
  console.log(`✅ Célula creada: ${celula.celula.nombreCelula} (ID: ${celula.celula.id})`);
  
  return celula;
}

async function verificarOrganigrama(celulaId: number) {
  console.log("\n📊 Verificando organigrama...");
  
  const response = await fetch(`http://localhost:5000/api/celulas/${celulaId}`);
  const celulaData = await response.json();

  console.log("📋 Estructura del organigrama:");
  
  if (celulaData.niveles) {
    celulaData.niveles.forEach((nivel: any) => {
      const personasEnNivel = celulaData.organigrama[nivel.nivel] || [];
      console.log(`\n📌 Nivel ${nivel.nivel}: ${nivel.nombre}`);
      console.log(`   Posiciones permitidas: [${nivel.posiciones.join(', ')}]`);
      console.log(`   Personas asignadas: ${personasEnNivel.length}`);
      
      personasEnNivel.forEach((persona: any) => {
        console.log(`   - ${persona.nombre} (${persona.posicion_estructura_nombre || 'Sin posición'})`);
      });
    });
  }

  return celulaData;
}

async function limpiarDatosPrueba(celulaId: number, personasIds: number[]) {
  console.log("\n🧹 Limpiando datos de prueba...");
  
  // Eliminar relaciones célula-personas
  await db.delete(celulasPersonas).where(eq(celulasPersonas.celulaId, celulaId));
  console.log("✅ Relaciones célula-personas eliminadas");
  
  // Eliminar célula
  await db.delete(celulas).where(eq(celulas.id, celulaId));
  console.log("✅ Célula eliminada");
  
  // Eliminar personas de prueba
  for (const personaId of personasIds) {
    await db.delete(personas).where(eq(personas.id, personaId));
  }
  console.log("✅ Personas de prueba eliminadas");
  
  // Restablecer secuencias
  await db.execute("SELECT setval('personas_id_seq', (SELECT COALESCE(MAX(id), 0) FROM personas))");
  await db.execute("SELECT setval('celulas_id_seq', (SELECT COALESCE(MAX(id), 0) FROM celulas))");
  console.log("✅ Secuencias restablecidas");
}

async function testCelulasCompleto() {
  try {
    console.log("🚀 Iniciando test completo de células con organigrama");
    
    // 1. Crear personas de prueba
    const personasCreadas = await crearPersonasPrueba();
    const personasIds = personasCreadas.map(p => p.id);
    
    // 2. Probar búsqueda de personas
    await probarBusquedaPersonas();
    
    // 3. Crear célula con personas
    const celulaCreada = await crearCelulaConPersonas(personasIds);
    
    // 4. Verificar organigrama
    await verificarOrganigrama(celulaCreada.celula.id);
    
    // 5. Limpiar datos de prueba
    await limpiarDatosPrueba(celulaCreada.celula.id, personasIds);
    
    console.log("\n🎉 Test completado exitosamente");
    
  } catch (error) {
    console.error("\n❌ Error en el test:", error);
    throw error;
  }
}

// Ejecutar test directamente
testCelulasCompleto()
  .then(() => {
    console.log("✅ Test finalizado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Test falló:", error);
    process.exit(1);
  });

export { testCelulasCompleto };