// Funcionalidades básicas para SOAT Mundial
document.addEventListener("DOMContentLoaded", function () {
  // Elementos del formulario
  const form = document.getElementById("formulario");
  const placaInput = document.getElementById("placa");
  const tipoSelect = document.getElementById("tipoDocumento");
  const documentoInput = document.getElementById("numeroDocumento");
  const termsCheckbox = document.getElementById("terms");
  const communicationsCheckbox = document.getElementById("communications");
  const recaptchaCheckbox = document.getElementById("recaptcha");
  const submitBtn = document.getElementById("btnConsultar");

  // Elementos de la barra de progreso
  const progressFill = document.getElementById("progressFill");
  const progressText = document.getElementById("progressText");
  const loadingStatus = document.getElementById("loadingStatus");
  const loadingTip = document.getElementById("loadingTip");

  // Frases rotativas informativas durante la carga
  const rotatingTips = [
    "Buscando tu placa...",
    "¿Sabías que cuidamos tu vehículo en todo momento?",
    "Verificando propietario...",
    "Consultando antecedentes del vehículo...",
    "Protegiendo tu camino, siempre...",
    "Asegurando la información de tu SOAT...",
    "Preparando los mejores beneficios para ti...",
  ];

  let tipsIntervalId = null;

  function startRotatingTips() {
    if (!loadingTip) return;
    let idx = 0;
    loadingTip.textContent = rotatingTips[idx % rotatingTips.length];
    tipsIntervalId = setInterval(() => {
      idx += 1;
      loadingTip.textContent = rotatingTips[idx % rotatingTips.length];
    }, 2200);
  }

  function stopRotatingTips() {
    if (tipsIntervalId) {
      clearInterval(tipsIntervalId);
      tipsIntervalId = null;
    }
  }

  // Verificar que los elementos existen
  if (!progressFill || !progressText || !loadingStatus) {
    console.error("❌ Faltan elementos de progreso");
  }

  // Función para actualizar la barra de progreso
  function updateProgress(percentage, status) {
    if (progressFill && progressText) {
      progressFill.style.width = percentage + "%";
      progressText.textContent = Math.round(percentage) + "%";
    }

    if (loadingStatus && status) {
      loadingStatus.textContent = status;
    }
  }

  // Función para consultar el progreso real del servidor
  function pollRealProgress() {
    let lastPercentage = 0;
    let errorCount = 0;
    const maxErrors = 3;
    let simulateInterval = null;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch("/api/progress");

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const progress = await response.json();

        // Solo actualizar si hay un cambio en el progreso
        if (progress.percentage > lastPercentage) {
          const shown = Math.min(progress.percentage, 99);
          updateProgress(shown, progress.status);
          lastPercentage = progress.percentage;
        }

        // Resetear contador de errores si la consulta fue exitosa
        errorCount = 0;
      } catch (error) {
        errorCount++;

        if (errorCount >= maxErrors) {
          clearInterval(pollInterval);
          // Fallback a simulación si hay error
          simulateInterval = simulateProgress(99);
        }
      }
    }, 1000); // Consultar cada segundo

    return {
      stop() {
        if (pollInterval) clearInterval(pollInterval);
        if (simulateInterval) clearInterval(simulateInterval);
      },
    };
  }

  // Función para simular progreso durante la carga (fallback)
  function simulateProgress(maxShown = 99) {
    let currentProgress = 0;
    const maxProgress = Math.min(maxShown, 99); // No llegar al 100% hasta que termine la consulta real

    const progressInterval = setInterval(() => {
      currentProgress += 10;

      if (currentProgress <= maxProgress) {
        let status = "";

        if (currentProgress <= 20) status = "Buscando tu placa...";
        else if (currentProgress <= 30) status = "Conectando con el servidor...";
        else if (currentProgress <= 40) status = "Verificando propietario...";
        else if (currentProgress <= 50) status = "Cargando página...";
        else if (currentProgress <= 60) status = "Asegurando tus datos...";
        else if (currentProgress <= 70) status = "Analizando resultados...";
        else if (currentProgress <= 80) status = "Preparando beneficios...";
        else status = "Procesando resultados...";

        updateProgress(currentProgress, status);
      } else {
        clearInterval(progressInterval);
      }
    }, 1000); // Actualizar cada segundo

    return progressInterval;
  }

  // Inicializar el botón como deshabilitado
  updateSubmitButton();

  // FAQ Functionality
  const faqItems = document.querySelectorAll(".faq-item");

  faqItems.forEach((item) => {
    const question = item.querySelector(".faq-question");
    const answer = item.querySelector(".faq-answer");

    question.addEventListener("click", function () {
      const isActive = item.classList.contains("active");

      // Close all FAQ items
      faqItems.forEach((faqItem) => {
        faqItem.classList.remove("active");
      });

      // Open clicked item if it wasn't active
      if (!isActive) {
        item.classList.add("active");
      }
    });
  });

  // CTA Button functionality
  const ctaButton = document.querySelector(".cta-button");
  if (ctaButton) {
    ctaButton.addEventListener("click", function () {
      // Scroll to the form
      const form = document.querySelector(".right-sidebar");
      if (form) {
        form.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  // Know More Button functionality
  const knowMoreBtn = document.querySelector(".know-more-btn");
  if (knowMoreBtn) {
    knowMoreBtn.addEventListener("click", function () {
      // Scroll to benefits section
      const benefitsSection = document.querySelector(".benefits-section");
      if (benefitsSection) {
        benefitsSection.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  // Validación de placa colombiana
  function validatePlaca(placa) {
    // Formato 1: 3 letras + 3 números (ej: KYK251)
    const placaRegex1 = /^[A-Z]{3}\d{3}$/;
    // Formato 2: 3 letras + 2 números + 1 letra (ej: CWX08F, QAA98G)
    const placaRegex2 = /^[A-Z]{3}\d{2}[A-Z]$/;
    // Formato 3: 4 letras + 2 números (ej: ABCD12)
    const placaRegex3 = /^[A-Z]{4}\d{2}$/;
    // Formato 4: 3 números + 3 letras (ej: 123ABC)
    const placaRegex4 = /^\d{3}[A-Z]{3}$/;

    const placaUpper = placa.toUpperCase();
    return (
      placaRegex1.test(placaUpper) ||
      placaRegex2.test(placaUpper) ||
      placaRegex3.test(placaUpper) ||
      placaRegex4.test(placaUpper)
    );
  }

  // Validación de documento colombiano
  function validateDocumento(documento) {
    // Cédulas: 7 dígitos (antiguas) o 10 dígitos (nuevas)
    const documentoRegex = /^\d{7}$|^\d{10}$/;
    return documentoRegex.test(documento);
  }

  // Función para mostrar errores
  function showError(input, message) {
    const formGroup = input.closest(".form-group");
    let errorElement = formGroup.querySelector(".error-message");

    if (!errorElement) {
      errorElement = document.createElement("div");
      errorElement.className = "error-message";
      errorElement.style.color = "#e74c3c";
      errorElement.style.fontSize = "12px";
      errorElement.style.marginTop = "5px";
      formGroup.appendChild(errorElement);
    }

    errorElement.textContent = message;
    input.style.borderColor = "#e74c3c";
  }

  // Función para limpiar errores
  function clearError(input) {
    const formGroup = input.closest(".form-group");
    const errorElement = formGroup.querySelector(".error-message");

    if (errorElement) {
      errorElement.remove();
    }

    input.style.borderColor = "#e0e0e0";
  }

  // Función para consultar el SOAT mediante el API
  async function consultarSOAT() {
    const placa = placaInput.value.trim().toUpperCase();
    const tipoDocumento = tipoSelect.value;
    const numeroDocumento = documentoInput.value.trim();

    // Consultando SOAT

    try {
      const response = await fetch("/api/soat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          placa: placa,
          tipoDocumento: tipoDocumento,
          numeroDocumento: numeroDocumento,
        }),
      });

      const data = await response.json();
      // Respuesta del API

      return data;
    } catch (error) {
      console.error("Error en la petición:", error);
      throw error;
    }
  }

  // Validación en tiempo real
  placaInput.addEventListener("input", function () {
    const value = this.value.toUpperCase();
    this.value = value;

    if (value.length > 0) {
      if (!validatePlaca(value)) {
        showError(
          this,
          "Formato inválido. Use: 3 letras + 3 números (ej: KYK251), 3 letras + 2 números + 1 letra (ej: CWX08F), 4 letras + 2 números (ej: ABCD12), o 3 números + 3 letras (ej: 123ABC)"
        );
      } else {
        clearError(this);
      }
    } else {
      clearError(this);
    }
    updateSubmitButton();
  });

  documentoInput.addEventListener("input", function () {
    const value = this.value;

    if (value.length > 0) {
      if (!validateDocumento(value)) {
        showError(
          this,
          "Documento inválido. Ingrese 7 o 10 dígitos (cédula colombiana)"
        );
      } else {
        clearError(this);
      }
    } else {
      clearError(this);
    }
    updateSubmitButton();
  });

  // Event listeners para actualizar el botón
  tipoSelect.addEventListener("change", updateSubmitButton);
  termsCheckbox.addEventListener("change", updateSubmitButton);
  communicationsCheckbox.addEventListener("change", updateSubmitButton);
  recaptchaCheckbox.addEventListener("change", updateSubmitButton);

  // Función para verificar si el formulario está completo
  function isFormComplete() {
    const placaValid =
      placaInput.value.trim() && validatePlaca(placaInput.value);
    const tipoValid = tipoSelect.value !== "Seleccione";
    const documentoValid =
      documentoInput.value.trim() && validateDocumento(documentoInput.value);
    const termsValid = termsCheckbox.checked;
    const communicationsValid = communicationsCheckbox.checked;
    const recaptchaValid = recaptchaCheckbox.checked;

    return (
      placaValid &&
      tipoValid &&
      documentoValid &&
      termsValid &&
      communicationsValid &&
      recaptchaValid
    );
  }

  // Función para actualizar el estado del botón
  function updateSubmitButton() {
    if (isFormComplete()) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = "1";
      submitBtn.style.cursor = "pointer";
    } else {
      submitBtn.disabled = true;
      submitBtn.style.opacity = "0.6";
      submitBtn.style.cursor = "not-allowed";
    }
  }

  // Validación del formulario completo
  function validateForm() {
    let isValid = true;

    // Validar placa
    if (!placaInput.value.trim()) {
      showError(placaInput, "La placa es obligatoria");
      isValid = false;
    } else if (!validatePlaca(placaInput.value)) {
      showError(
        placaInput,
        "Formato de placa inválido. Use: 3 letras + 3 números (ej: KYK251), 3 letras + 2 números + 1 letra (ej: CWX08F), 4 letras + 2 números (ej: ABCD12), o 3 números + 3 letras (ej: 123ABC)"
      );
      isValid = false;
    }

    // Validar tipo de vehículo
    if (tipoSelect.value === "Seleccione") {
      showError(tipoSelect, "Seleccione un tipo de vehículo");
      isValid = false;
    }

    // Validar documento
    if (!documentoInput.value.trim()) {
      showError(documentoInput, "El documento es obligatorio");
      isValid = false;
    } else if (!validateDocumento(documentoInput.value)) {
      showError(
        documentoInput,
        "Documento inválido. Ingrese 7 o 10 dígitos (cédula colombiana)"
      );
      isValid = false;
    }

    // Validar términos y condiciones
    if (!termsCheckbox.checked) {
      showError(termsCheckbox, "Debe aceptar los términos y condiciones");
      isValid = false;
    }

    // Validar comunicaciones
    if (!communicationsCheckbox.checked) {
      showError(communicationsCheckbox, "Debe aceptar las comunicaciones");
      isValid = false;
    }

    // Validar reCAPTCHA
    if (!recaptchaCheckbox.checked) {
      showError(recaptchaCheckbox, "Debe completar el reCAPTCHA");
      isValid = false;
    }

    return isValid;
  }

  // Manejo del envío del formulario
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (validateForm()) {
      // Mostrar pantalla de carga
      const loadingScreen = document.getElementById("loadingScreen");
      loadingScreen.classList.add("show");

      // Iniciar rotación de tips y resetear barra
      startRotatingTips();
      updateProgress(0, "Iniciando consulta...");

      // Simular envío
      submitBtn.disabled = true;
      submitBtn.textContent = "Procesando...";

      // Iniciar polling del progreso real
      const progressCtrl = pollRealProgress();

      // Realizar consulta real al API del scraper
      consultarSOAT()
        .then((data) => {
          // Actualizar a 100 y continuar inmediatamente
          updateProgress(100, "Datos listos");

          // Ocultar pantalla de carga
          loadingScreen.classList.remove("show");

          // Limpiar intervalos de progreso
          if (progressCtrl && typeof progressCtrl.stop === "function") {
            progressCtrl.stop();
          }

          // Detener rotación de tips
          stopRotatingTips();

          // Resetear botón
          submitBtn.disabled = false;
          submitBtn.textContent = "Cotizar Pack de Movilidad";

          if (data.error) {
            alert("Error al consultar el SOAT: " + data.message);
          } else {
            sessionStorage.setItem(
              "vehiculoData",
              JSON.stringify(data.vehiculo)
            );
            sessionStorage.setItem(
              "propietarioData",
              JSON.stringify(data.propietario)
            );
            sessionStorage.setItem(
              "resumenData",
              JSON.stringify(data.resumen)
            );
            sessionStorage.setItem(
              "opcionesSeguroData",
              JSON.stringify(data.opcionesSeguro || [])
            );

            // Redirigir inmediatamente a la página de datos
            window.location.href = "datos.html";
          }
        })
        .catch((error) => {
          // Ocultar pantalla de carga
          loadingScreen.classList.remove("show");

          // Limpiar intervalos de progreso
          if (progressCtrl && typeof progressCtrl.stop === "function") {
            progressCtrl.stop();
          }

          // Detener rotación de tips
          stopRotatingTips();

          // Resetear botón
          submitBtn.disabled = false;
          submitBtn.textContent = "Cotizar Pack de Movilidad";

          alert("Error al consultar el SOAT. Por favor intenta nuevamente.");
        });
    }
  });

  // Smooth scroll for navigation links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });

  // Function to scroll to benefits section
  function scrollToBenefits() {
    const beneficiosSection = document.getElementById("beneficios");
    if (beneficiosSection) {
      beneficiosSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  // Add hover effects to cards
  const cards = document.querySelectorAll(
    ".benefit-card, .coverage-item, .testimonial-card"
  );
  cards.forEach((card) => {
    card.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-5px)";
    });

    card.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0)";
    });
  });

  // SOAT Mundial - Funcionalidades básicas cargadas
});
