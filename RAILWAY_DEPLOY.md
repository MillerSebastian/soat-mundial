# Despliegue en Railway - Guía de Solución

## Problema Original
El scraper de SOAT estaba fallando en producción con errores de conexión abortada (`BadRequestError: request aborted`). Esto ocurría porque:

1. Playwright no estaba correctamente instalado en Railway
2. Los timeouts eran demasiado largos y Railway cortaba las conexiones
3. No había manejo adecuado de errores del browser

## Cambios Realizados

### 1. **soatScraper.js**
- Añadido manejo de errores al lanzar el browser
- Agregados flags adicionales para Railway: `--single-process`, `--no-zygote`, `--disable-gpu`
- Reducido timeout de 60s a 45s
- Mejorado el cierre del browser en el bloque `finally`

### 2. **server.js**
- Extendido timeout del request/response a 90 segundos
- Añadido Promise.race con timeout de 80 segundos
- Agregados logs detallados para debugging

### 3. **package.json**
- Añadido script `postinstall` para instalar Playwright automáticamente
- Actualizado script `build` para instalar chromium con dependencias

### 4. **nixpacks.toml** (NUEVO)
- Configuración para Railway que asegura instalación de chromium
- Especifica los comandos de instalación necesarios

## Instrucciones de Despliegue

### Paso 1: Preparar el Repositorio
```bash
git add .
git commit -m "Fix: Configurar Playwright para Railway"
git push origin main
```

### Paso 2: Variables de Entorno en Railway
Asegúrate de tener configuradas estas variables en Railway:
- `NODE_ENV=production`
- `TELEGRAM_BOT_TOKEN=tu_token`
- `TELEGRAM_CHAT_ID=tu_chat_id`

### Paso 3: Configuración del Proyecto en Railway
1. Ve a tu proyecto en Railway
2. En "Settings" > "Build Command", asegúrate de que esté configurado como: `npm run build`
3. En "Start Command", debe estar: `npm start`

### Paso 4: Forzar Rebuild
Después de hacer push, Railway debería rebuildearse automáticamente. Si no:
1. Ve a "Deployments"
2. Haz click en los tres puntos del último deployment
3. Selecciona "Redeploy"

## Verificación del Despliegue

### 1. Revisar Logs de Instalación
En los logs de Railway, deberías ver:
```
> npx playwright install --with-deps chromium
Downloading Chromium...
Installing dependencies...
```

### 2. Verificar que el Servidor Inicia
Deberías ver en los logs:
```
🚀 Servidor SOAT Mundial corriendo en http://localhost:3000
📊 Endpoints disponibles:
   POST /api/soat - Consultar datos de SOAT
   ...
```

### 3. Probar el Endpoint
Desde tu frontend en producción, intenta hacer una consulta. Deberías ver en los logs:
```
[SOAT] Iniciando consulta para placa: ABC123
[SOAT] Consulta exitosa para placa: ABC123
```

## Troubleshooting

### Error: "No se pudo iniciar el navegador"
**Solución:** Verifica que el archivo `nixpacks.toml` esté en la raíz del proyecto y que Railway lo haya detectado.

### Error: "Timeout: La consulta tomó demasiado tiempo"
**Solución:** Esto es normal si el sitio de SOAT Mundial está lento. Considera aumentar el timeout en server.js línea 146 de 80000 a 100000.

### Error: "request aborted"
**Solución:** Railway tiene un timeout de proxy de 5 minutos. Si persiste, reduce los timeouts en soatScraper.js.

## Optimizaciones Adicionales (Opcionales)

### 1. Usar Puppeteer en lugar de Playwright
Puppeteer es más ligero y puede funcionar mejor en Railway:
```bash
npm uninstall playwright
npm install puppeteer
```

### 2. Implementar Cache
Para reducir las llamadas al scraper, implementa un cache temporal:
```javascript
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
```

### 3. Queue System
Para manejar múltiples consultas simultáneas, considera usar un sistema de colas como Bull.

## Monitoreo

### Logs Importantes
Monitorea estos patrones en los logs de Railway:
- `[SOAT] Iniciando consulta` - Inicio de scraping
- `[SOAT] Consulta exitosa` - Scraping completado
- `[SOAT] Error en scraper` - Error en el proceso
- `BadRequestError` - Problema de conexión (requiere atención)

### Métricas
- Tiempo promedio de respuesta: 30-60 segundos
- Tasa de éxito esperada: >90%
- Si la tasa de éxito es <80%, revisa los logs

## Soporte

Si después de seguir esta guía aún tienes problemas:

1. Revisa los logs completos en Railway
2. Verifica que todas las variables de entorno estén configuradas
3. Asegúrate de que el repositorio esté actualizado con todos los archivos
4. Prueba localmente con `npm install && npm run build && npm start`
