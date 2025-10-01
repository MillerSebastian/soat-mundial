# Configuración del Bot de Telegram para SOAT Mundial

Este documento explica cómo configurar el bot de Telegram para recibir notificaciones de las solicitudes de SOAT.

## 📋 Requisitos

- Una cuenta de Telegram
- Acceso a @BotFather en Telegram

## 🚀 Pasos para Configurar el Bot

### 1. Crear el Bot

1. Abre Telegram y busca `@BotFather`
2. Inicia una conversación con él
3. Envía el comando `/newbot`
4. Sigue las instrucciones:
   - Proporciona un nombre para tu bot (ej: "SOAT Mundial Notifications")
   - Proporciona un username único que termine en "bot" (ej: "soatmundial_bot")
5. BotFather te dará un **TOKEN** - guárdalo, lo necesitarás

### 2. Obtener tu Chat ID

#### Opción A: Para recibir mensajes en tu chat personal

1. Busca tu bot por su username
2. Inicia una conversación con él (envía `/start`)
3. Ve a: `https://api.telegram.org/bot<TU_TOKEN>/getUpdates`
4. Busca el campo `"chat":{"id":123456789}` - ese número es tu Chat ID

#### Opción B: Para recibir mensajes en un grupo

1. Agrega tu bot al grupo
2. Envía un mensaje en el grupo
3. Ve a: `https://api.telegram.org/bot<TU_TOKEN>/getUpdates`
4. Busca el campo `"chat":{"id":-123456789}` - ese número es el Chat ID del grupo

### 3. Configurar las Variables de Entorno

1. Copia el archivo `config.example.env` y renómbralo a `.env`:

   ```bash
   cp config.example.env .env
   ```

2. Edita el archivo `.env` y reemplaza los valores:
   ```env
   TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   TELEGRAM_CHAT_ID=123456789
   PORT=3000
   ```

### 4. Probar la Configuración

1. Inicia el servidor:

   ```bash
   npm start
   ```

2. Completa el formulario en la aplicación
3. Haz clic en "Siguiente" en la página de datos
4. Deberías recibir un mensaje en Telegram con todos los datos

## 📱 Formato del Mensaje

El bot enviará un mensaje formateado que incluye:

- **Datos del vehículo**: Placa, línea, marca, modelo, clase, tipo
- **Datos del propietario**: Nombres, apellidos, documento
- **Datos de contacto**: Teléfono y email
- **Resumen de compra**: SOAT, seguros adicionales, total
- **Opciones seleccionadas**: Qué seguros eligió el usuario
- **Fecha y hora** de la solicitud

## 🔧 Solución de Problemas

### Error: "Configuración de Telegram no válida"

- Verifica que el archivo `.env` existe y tiene los valores correctos
- Asegúrate de que el TOKEN y CHAT_ID no tengan espacios extra

### Error: "Unauthorized"

- El TOKEN del bot es incorrecto
- Verifica que copiaste el TOKEN completo de BotFather

### Error: "Chat not found"

- El CHAT_ID es incorrecto
- Asegúrate de haber iniciado una conversación con el bot
- Si es un grupo, verifica que el bot esté agregado al grupo

### No recibes mensajes

- Verifica que el bot esté activo (no bloqueado)
- Asegúrate de haber enviado `/start` al bot
- Revisa los logs del servidor para ver errores

## 🔒 Seguridad

- **Nunca** compartas tu TOKEN del bot
- **Nunca** subas el archivo `.env` a repositorios públicos
- Agrega `.env` a tu `.gitignore`

## 📞 Soporte

Si tienes problemas, verifica:

1. Los logs del servidor en la consola
2. Que el bot esté activo en Telegram
3. Que las variables de entorno estén correctamente configuradas
