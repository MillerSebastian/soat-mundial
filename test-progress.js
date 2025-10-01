// Script de prueba para verificar el endpoint de progreso
const fetch = require("node-fetch");

async function testProgressEndpoint() {
  try {
    console.log("🧪 Probando endpoint /api/progress...");

    const response = await fetch("http://localhost:3000/api/progress");
    console.log("Status:", response.status);
    console.log("Headers:", response.headers.get("content-type"));

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Respuesta exitosa:", data);
    } else {
      const text = await response.text();
      console.log("❌ Error:", text);
    }
  } catch (error) {
    console.error("❌ Error de conexión:", error.message);
  }
}

async function testHealthEndpoint() {
  try {
    console.log("🧪 Probando endpoint /api/health...");

    const response = await fetch("http://localhost:3000/api/health");
    console.log("Status:", response.status);

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Respuesta exitosa:", data);
    } else {
      const text = await response.text();
      console.log("❌ Error:", text);
    }
  } catch (error) {
    console.error("❌ Error de conexión:", error.message);
  }
}

async function testTestEndpoint() {
  try {
    console.log("🧪 Probando endpoint /api/test...");

    const response = await fetch("http://localhost:3000/api/test");
    console.log("Status:", response.status);

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Respuesta exitosa:", data);
    } else {
      const text = await response.text();
      console.log("❌ Error:", text);
    }
  } catch (error) {
    console.error("❌ Error de conexión:", error.message);
  }
}

async function runTests() {
  console.log("🚀 Iniciando pruebas de endpoints...\n");

  await testHealthEndpoint();
  console.log("");

  await testTestEndpoint();
  console.log("");

  await testProgressEndpoint();
  console.log("");

  console.log("🏁 Pruebas completadas");
}

runTests();
