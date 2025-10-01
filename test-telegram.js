// Script de prueba para verificar la configuración de Telegram
require("dotenv").config();
const axios = require("axios");

async function testTelegramConfig() {
  console.log("🔍 Probando configuración de Telegram...\n");

  // Verificar variables de entorno
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  console.log("📋 Variables de entorno:");
  console.log(
    `   TELEGRAM_BOT_TOKEN: ${
      TELEGRAM_BOT_TOKEN ? "✅ Configurado" : "❌ No configurado"
    }`
  );
  console.log(
    `   TELEGRAM_CHAT_ID: ${
      TELEGRAM_CHAT_ID ? "✅ Configurado" : "❌ No configurado"
    }\n`
  );

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log("❌ Error: Faltan variables de entorno");
    console.log("   Crea un archivo .env basado en config.example.env");
    return;
  }

  if (
    TELEGRAM_BOT_TOKEN === "TU_BOT_TOKEN_AQUI" ||
    TELEGRAM_CHAT_ID === "TU_CHAT_ID_AQUI"
  ) {
    console.log("❌ Error: Variables de entorno no han sido configuradas");
    console.log("   Edita el archivo .env con tus valores reales");
    return;
  }

  try {
    // Probar la API de Telegram
    console.log("🧪 Probando conexión con Telegram...");

    const testMessage =
      `🧪 <b>PRUEBA DE CONFIGURACIÓN</b> 🧪\n\n` +
      `✅ Bot configurado correctamente\n` +
      `⏰ ${new Date().toLocaleString("es-CO", {
        timeZone: "America/Bogota",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}\n\n` +
      `🔗 <i>Enviado desde script de prueba</i>`;

    const response = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text: testMessage,
        parse_mode: "HTML",
      }
    );

    if (response.data.ok) {
      console.log("✅ ¡Prueba exitosa!");
      console.log("   Mensaje enviado correctamente a Telegram");
      console.log(`   Message ID: ${response.data.result.message_id}`);
    } else {
      console.log("❌ Error en la respuesta de Telegram");
      console.log("   Respuesta:", response.data);
    }
  } catch (error) {
    console.log("❌ Error al conectar con Telegram:");

    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(
        `   Error: ${
          error.response.data.description || error.response.data.error_code
        }`
      );

      if (error.response.data.error_code === 401) {
        console.log("   💡 El token del bot es incorrecto");
      } else if (error.response.data.error_code === 400) {
        console.log("   💡 El chat_id es incorrecto o el bot no tiene acceso");
      }
    } else {
      console.log(`   Error: ${error.message}`);
    }
  }
}

// Ejecutar la prueba
testTelegramConfig();
