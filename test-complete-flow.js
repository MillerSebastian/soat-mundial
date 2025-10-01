// Script para probar el flujo completo de envío de datos a Telegram
require("dotenv").config();
const axios = require("axios");

async function testCompleteFlow() {
  console.log("🧪 Probando flujo completo de envío de datos...\n");

  // Simular datos que vendrían del formulario
  const testData = {
    vehiculoData: {
      placa: "xxxxxx",
      linea: "GPD155A(NMAX155)",
      marca: "YAMAHA",
      modelo: "2024",
      clase: "MOTOCICLETA",
      tipo: "MOTOCICLETA"
    },
    propietarioData: {
      nombres: "LIZARDO",
      apellidos: "FERNANDEZ MIRANDA",
      documento: "12345678"
    },
    resumenData: {
      soat: "$326.600",
      tercero: "$68.000",
      accidente: "$19.900",
      total: "$414.500"
    },
    contactoData: {
      telefono: "3001234567",
      email: "test@example.com"
    },
    opcionesSeleccionadas: {
      terceros: "Opción Motos 2",
      accidentes: "PLAN PLATA"
    }
  };

  try {
    console.log("📤 Enviando datos de prueba al servidor...");
    
    // Intentar enviar al servidor local
    const response = await axios.post("http://localhost:3000/api/telegram", testData, {
      headers: {
        "Content-Type": "application/json"
      },
      timeout: 10000 // 10 segundos de timeout
    });

    console.log("✅ Respuesta del servidor:");
    console.log("   Status:", response.status);
    console.log("   Data:", response.data);

  } catch (error) {
    console.log("❌ Error al enviar datos:");
    
    if (error.code === "ECONNREFUSED") {
      console.log("   💡 El servidor no está corriendo en localhost:3000");
      console.log("   💡 Ejecuta: node server.js");
    } else if (error.response) {
      console.log("   Status:", error.response.status);
      console.log("   Error:", error.response.data);
    } else {
      console.log("   Error:", error.message);
    }
  }
}

// Ejecutar la prueba
testCompleteFlow();
