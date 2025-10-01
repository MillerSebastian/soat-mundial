FROM node:18-slim

# Instalar dependencias del sistema necesarias para Chromium
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    libu2f-udev \
    libvulkan1 \
    && rm -rf /var/lib/apt/lists/*

# Establecer directorio de trabajo
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias de Node.js
RUN npm ci --only=production

# Instalar Playwright y Chromium
RUN npx playwright install chromium
RUN npx playwright install-deps chromium

# Copiar el resto del código
COPY . .

# Exponer puerto
EXPOSE 3000

# Variables de entorno
ENV NODE_ENV=production
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0

# Comando de inicio
CMD ["node", "server.js"]
