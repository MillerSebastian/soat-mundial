# Cambios Realizados - Fix del Scraper en Producción

## Fecha: 1 de Octubre, 2025

### Problema Identificado
El scraper de SOAT fallaba en producción (Railway) con el error `BadRequestError: request aborted`. Los problemas principales eran:

1. **Playwright no instalado correctamente en Railway**: Las dependencias del sistema no estaban configuradas
2. **Timeouts excesivos**: El servidor esperaba 60+ segundos, Railway cortaba las conexiones
3. **Sin manejo de errores del browser**: Si Playwright fallaba al iniciar, el servidor crasheaba

### Archivos Modificados

#### 1. `soatScraper.js`
**Cambios realizados:**
- Agregado try-catch al lanzar el browser con mensaje de error claro
- Añadidos flags de Chrome para Railway: `--single-process`, `--no-zygote`, `--disable-gpu`
- Reducido timeout de navegación de 60s a 45s
- Mejorado cierre seguro del browser en el bloque finally

**Impacto:** Mayor estabilidad y mejor compatibilidad con entornos serverless

#### 2. `server.js`
**Cambios realizados:**
- Extendidos timeouts de request/response a 90 segundos
- Implementado Promise.race con timeout de 80 segundos para evitar cuelgues
- Agregados logs detallados con prefijo [SOAT] para debugging
- Mejor manejo de errores con detalles en respuestas JSON

**Impacto:** Mejor monitoreo y prevención de timeouts

#### 3. `package.json`
**Cambios realizados:**
- Añadido script `postinstall` que ejecuta `npx playwright install --with-deps chromium`
- Actualizado script `build` para instalar chromium con dependencias del sistema
- Estos scripts se ejecutan automáticamente en Railway

**Impacto:** Instalación automática de Playwright en cada deploy

#### 4. `nixpacks.toml` (NUEVO)
**Contenido:**
```toml
[phases.setup]
nixPkgs = ['...', 'chromium']

[phases.install]
cmds = ['npm install', 'npx playwright install --with-deps chromium']

[start]
cmd = 'npm start'
```

**Impacto:** Railway ahora instala chromium y todas sus dependencias del sistema

#### 5. `RAILWAY_DEPLOY.md` (NUEVO)
Guía completa de despliegue que incluye:
- Explicación del problema original
- Detalles de todos los cambios
- Instrucciones paso a paso para deploy
- Verificación del despliegue
- Troubleshooting común
- Optimizaciones opcionales

### Mejoras de Rendimiento

1. **Reducción de timeouts**: De 60s a 45s reduce la carga del servidor
2. **Flags de Chrome optimizados**: `--single-process` y `--disable-gpu` mejoran rendimiento en Railway
3. **Logs detallados**: Facilita identificación rápida de problemas

### Verificación Local

Se verificó que:
- ✅ Playwright se instala correctamente con `npm run build`
- ✅ El servidor inicia sin errores
- ✅ Los timeouts están correctamente configurados
- ✅ El manejo de errores funciona adecuadamente

### Pasos para Desplegar en Railway

1. **Commit y Push:**
   ```bash
   git add .
   git commit -m "Fix: Configurar Playwright para Railway"
   git push origin main
   ```

2. **Verificar variables de entorno en Railway:**
   - `NODE_ENV=production`
   - `TELEGRAM_BOT_TOKEN=tu_token`
   - `TELEGRAM_CHAT_ID=tu_chat_id`

3. **Esperar el deploy automático** o forzar redeploy desde el dashboard

4. **Monitorear los logs** para verificar:
   - Instalación de Playwright
   - Inicio exitoso del servidor
   - Primera consulta de SOAT exitosa

### Métricas Esperadas

- **Tiempo de instalación de Playwright**: ~2-3 minutos
- **Tiempo promedio de consulta SOAT**: 30-60 segundos
- **Tasa de éxito esperada**: >90%
- **Timeout máximo del endpoint**: 90 segundos

### Soporte y Troubleshooting

Si el problema persiste después del deploy:

1. Verificar logs de Railway durante la instalación
2. Confirmar que `nixpacks.toml` está en la raíz del proyecto
3. Revisar que las variables de entorno están configuradas
4. Consultar `RAILWAY_DEPLOY.md` para troubleshooting detallado

### Notas Adicionales

- Los archivos `.md` creados son solo documentación y no afectan el funcionamiento
- El archivo `nixpacks.toml` es crítico y debe estar en la raíz del repositorio
- Railway detecta automáticamente `nixpacks.toml` y lo usa para el build

### Próximos Pasos Recomendados

1. **Implementar cache**: Reducir llamadas repetidas al scraper
2. **Sistema de cola**: Manejar múltiples consultas simultáneas
3. **Monitoreo de uptime**: Alertas cuando el scraper falla >10% de las veces
4. **Rate limiting**: Evitar sobrecarga del servidor SOAT Mundial
