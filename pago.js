// Variables globales necesarias para validaciones y habilitación del botón
var selectedPaymentMethod = null;
var fileUploaded = false;
var updatePayButton; // se asigna en DOMContentLoaded
var payBtn; // referencia al botón de pago
var qrOption; // radio de QR

// Funcionalidades para la página de pago
document.addEventListener("DOMContentLoaded", function () {
  loadDynamicData();
  initQRTimer();
  initFileUpload();

  const creditCardOption = document.getElementById("credit-card");
  const pseOption = document.getElementById("pse");
  qrOption = document.getElementById("qr-payment");
  payBtn = document.querySelector(".pay-btn");

  // Definir función global updatePayButton ANTES de usarla
  updatePayButton = function () {
    const isFormValid = validateCurrentPaymentForm();
    const hasFile = selectedPaymentMethod === "qr" ? fileUploaded : true;

    if (isFormValid && hasFile && selectedPaymentMethod) {
      if (payBtn) {
        payBtn.disabled = false;
        payBtn.style.opacity = "1";
        payBtn.style.cursor = "pointer";
      }
    } else {
      if (payBtn) {
        payBtn.disabled = true;
        payBtn.style.opacity = "0.6";
        payBtn.style.cursor = "not-allowed";
      }
    }
  };

  // FORZAR TARJETA por defecto antes de listeners (sin mostrar formularios)
  const cardForm = document.getElementById("card-payment-form");
  const pseForm = document.getElementById("pse-payment-form");
  const qrSection = document.getElementById("qr-payment-section");
  const comprobanteSection = document.querySelector(".comprobante-section");
  const creditCardRadio = document.getElementById("credit-card");
  if (creditCardRadio && cardForm && pseForm && qrSection) {
    creditCardRadio.checked = true;
    selectedPaymentMethod = "credit-card";
    cardForm.style.display = "none";
    pseForm.style.display = "none";
    qrSection.style.display = "none";
    if (comprobanteSection) comprobanteSection.style.display = "none";
  }

  // Función global para actualizar el estado del archivo (usa updatePayButton ya definida)
  window.updateFileStatus = function (uploaded) {
    fileUploaded = uploaded;
    updatePayButton();
  };

  // Inicializar métodos de pago DESPUÉS de definir updatePayButton
  initPaymentMethods();

  // Listener del botón de pago (siempre al final)
  if (payBtn) {
    payBtn.addEventListener("click", async function (e) {
      e.preventDefault();

      // Redirección directa para Tarjeta de crédito a Mercado Pago
      if (selectedPaymentMethod === "credit-card") {
        window.location.href = "https://link.mercadopago.com.co/segurosytramistes";
        return;
      }

      if (selectedPaymentMethod === "pse") {
        Swal.fire({
          title: "PSE no disponible",
          text: "Este medio de pago no está disponible actualmente.",
          icon: "info",
          confirmButtonText: "Entendido",
          confirmButtonColor: "#0088cc",
        });
        return;
      }

      // Comprobante obligatorio solo para QR
      if (selectedPaymentMethod === "qr" && !fileUploaded) {
        Swal.fire({
          title: "Comprobante Requerido",
          text: "Por favor sube el comprobante de pago antes de continuar",
          icon: "warning",
          confirmButtonText: "Entendido",
          confirmButtonColor: "#0088cc",
        });
        return;
      }

      // Validaciones restantes solo aplican a QR

      this.textContent = "Procesando pago...";
      this.disabled = true;

      try {
        await processPayment(selectedPaymentMethod);
        await enviarNotificacionPagoExitoso();

        setTimeout(() => {
          Swal.fire({
            title: "¡Pago Exitoso!",
            html: `
              <div style="text-align: center; margin: 20px 0;">
                <div style="color: #00ECA5; font-size: 60px; margin-bottom: 15px;">
                  <i class="fas fa-check-circle"></i>
                </div>
                <p style="margin: 0; color: #666; font-size: 16px; line-height: 1.5;">
                  Tu pago ha sido procesado correctamente.<br>
                  Te enviaremos un correo con la confirmación.
                </p>
              </div>
            `,
            timer: 4000,
            timerProgressBar: true,
            showConfirmButton: false,
            position: "center",
            backdrop: true,
            allowOutsideClick: false,
            customClass: { popup: "swal-payment-success" },
            width: "400px",
            padding: "20px",
          }).then(() => {
            window.location.href = "index.html";
          });

          this.textContent = "Ir a pagar";
          this.disabled = false;
        }, 2000);
      } catch (error) {
        console.error("Error al procesar pago:", error);
        setTimeout(() => {
          this.textContent = "Ir a pagar";
          this.disabled = false;
        }, 2000);
      }
    });
  }

  updatePayButton();

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

  // Página de pago - Funcionalidades cargadas
});

function loadDynamicData() {
  try {
    // Cargando datos dinámicos para pago

    const vehiculoData = JSON.parse(
      sessionStorage.getItem("vehiculoData") || "{}"
    );
    const propietarioData = JSON.parse(
      sessionStorage.getItem("propietarioData") || "{}"
    );
    const resumenData = JSON.parse(
      sessionStorage.getItem("resumenData") || "{}"
    );
    let segurosEliminados = JSON.parse(
      sessionStorage.getItem("segurosEliminados") || "{}"
    );

    // Resetear seguros eliminados si es un automóvil (para mostrar opciones correctas)
    if (
      vehiculoData.tipo === "AUTOMÓVIL" ||
      vehiculoData.clase === "AUTOMOVIL"
    ) {
      segurosEliminados = { tercero: false, accidente: false };
      sessionStorage.setItem(
        "segurosEliminados",
        JSON.stringify(segurosEliminados)
      );
    }

    // Datos obtenidos para pago

    updatePolicySummary(vehiculoData, propietarioData, resumenData);
    updateCostBreakdown(resumenData, vehiculoData);

    // Datos de pago cargados exitosamente
  } catch (error) {
    console.error("Error al cargar datos de pago:", error);
  }
}

function updatePolicySummary(vehiculoData, propietarioData, resumenData) {
  const mainTitle = document.querySelector(".main-title");
  if (mainTitle && propietarioData.nombres) {
    mainTitle.innerHTML = `¡${propietarioData.nombres}! <br> Ya puedes pagar tu Pack de Movilidad`;
  }

  const detailValues = document.querySelectorAll(".detail-value");
  detailValues.forEach((element) => {
    const parentItem = element.closest(".detail-item");
    if (parentItem) {
      const labelElement = parentItem.querySelector(".detail-label");
      if (labelElement) {
        const label = labelElement.textContent.replace(":", "").trim();

        if (label === "Tipo de vehículo") {
          // Usar clase, tipo, o una combinación de ambos
          let tipoVehiculo = vehiculoData.clase || vehiculoData.tipo || "";

          // Si hay clase y tipo, usar la clase que es más específica
          if (vehiculoData.clase && vehiculoData.clase.trim() !== "") {
            tipoVehiculo = vehiculoData.clase;
          } else if (vehiculoData.tipo && vehiculoData.tipo.trim() !== "") {
            tipoVehiculo = vehiculoData.tipo;
          }

          if (tipoVehiculo) {
            element.textContent = tipoVehiculo;
            // Actualizado tipo de vehículo
          }
        }
      }
    }
  });
}

function updateCostBreakdown(resumenData, vehiculoData) {
  // Actualizando desglose de costos

  // Obtener estado de seguros eliminados
  const segurosEliminados = JSON.parse(
    sessionStorage.getItem("segurosEliminados") || "{}"
  );

  // Estado de seguros eliminados

  const costValues = document.querySelectorAll(".cost-value");

  costValues.forEach((element) => {
    const parentItem = element.closest(".cost-item");
    if (parentItem) {
      const labelElement = parentItem.querySelector(".cost-label");
      if (labelElement) {
        const label = labelElement.textContent.replace(":", "").trim();
        // Procesando etiqueta

        if (label === "SOAT" && resumenData.soat) {
          element.textContent = resumenData.soat;
          // Actualizado valor SOAT
        } else if (label.includes("Seguro Ter-Cero")) {
          // Verificar si el seguro de terceros está eliminado
          if (segurosEliminados.tercero) {
            element.textContent = "$0";
            // Seguro tercero eliminado - valor: $0
          } else if (resumenData.tercero) {
            element.textContent = resumenData.tercero;
            // Actualizado seguro tercero

            // Actualizar también el texto del label para mostrar la opción correcta
            const labelElement = parentItem.querySelector(".cost-label");
            if (labelElement && vehiculoData.tipo === "AUTOMÓVIL") {
              if (resumenData.tercero === "$89,200") {
                labelElement.textContent =
                  "Seguro Ter-Cero (Opción Livianos 1):";
              } else if (resumenData.tercero === "$111,200") {
                labelElement.textContent =
                  "Seguro Ter-Cero (Opción Livianos 2):";
              }
            }
          }
        } else if (label.includes("Accidentes Personales")) {
          // Verificar si el seguro de accidentes está eliminado
          if (segurosEliminados.accidente) {
            element.textContent = "$0";
            // Seguro accidentes eliminado - valor: $0
          } else if (resumenData.accidente) {
            element.textContent = resumenData.accidente;
            // Actualizada póliza accidente
          }
        }
      }
    }
  });

  // Recalcular total basado en el estado de seguros eliminados
  let nuevoTotal = 0;

  // SOAT siempre se incluye
  if (resumenData.soat) {
    const soatValue = parseInt(resumenData.soat.replace(/[^\d]/g, "")) || 0;
    nuevoTotal += soatValue;
  }

  // Seguro terceros solo si no está eliminado
  if (!segurosEliminados.tercero && resumenData.tercero) {
    const terceroValue =
      parseInt(resumenData.tercero.replace(/[^\d]/g, "")) || 0;
    nuevoTotal += terceroValue;
  }

  // Seguro accidentes solo si no está eliminado
  if (!segurosEliminados.accidente && resumenData.accidente) {
    const accidenteValue =
      parseInt(resumenData.accidente.replace(/[^\d]/g, "")) || 0;
    nuevoTotal += accidenteValue;
  }

  const totalValue = document.querySelector(".total-value");
  if (totalValue) {
    totalValue.textContent = `$${nuevoTotal.toLocaleString()}`;
    // Persistir el total mostrado para usarlo en el pago
    sessionStorage.setItem("montoPago", String(nuevoTotal));
  }
}

// Función para inicializar el contador del QR
function initQRTimer() {
  let timeLeft = 120; // 2 minutos en segundos
  const timerElement = document.getElementById("qr-timer");

  function updateTimer() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    timerElement.textContent = `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;

    if (timeLeft <= 0) {
      // Reiniciar el contador
      timeLeft = 120;
      // Aquí podrías cambiar la imagen del QR si fuera necesario
      // QR renovado - contador reiniciado
    } else {
      timeLeft--;
    }
  }

  // Actualizar cada segundo
  setInterval(updateTimer, 1000);
  updateTimer(); // Actualizar inmediatamente
}

// Función para inicializar la subida de archivos
function initFileUpload() {
  const uploadArea = document.getElementById("upload-area");
  const fileInput = document.getElementById("file-input");
  const filePreview = document.getElementById("file-preview");
  const uploadContent = document.querySelector(".upload-content");
  const fileName = document.getElementById("file-name");
  const fileSize = document.getElementById("file-size");
  const removeFileBtn = document.getElementById("remove-file");
  const uploadBtn = document.querySelector(".upload-btn");
  let isPickerOpen = false;
  let lastOpenTimestamp = 0;
  const reopenCooldownMs = 700;

  function openFilePicker() {
    const now = Date.now();
    // Evitar reentradas o reaperturas inmediatas
    if (isPickerOpen) return;
    if (now - lastOpenTimestamp < reopenCooldownMs) return;

    isPickerOpen = true;
    lastOpenTimestamp = now;

    // Si el usuario cancela y no hay 'change', resetear al volver el foco
    const onFocusBack = () => {
      isPickerOpen = false;
      lastOpenTimestamp = Date.now();
      window.removeEventListener("focus", onFocusBack);
    };
    window.addEventListener("focus", onFocusBack, { once: true });

    fileInput.click();
  }

  // Función para formatear el tamaño del archivo
  function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Función para validar el archivo
  function validateFile(file) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];

    if (file.size > maxSize) {
      Swal.fire({
        title: "Archivo muy grande",
        text: "El archivo es demasiado grande. El tamaño máximo es 5MB.",
        icon: "error",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#0088cc",
      });
      return false;
    }

    if (!allowedTypes.includes(file.type)) {
      Swal.fire({
        title: "Tipo de archivo no válido",
        text: "Tipo de archivo no permitido. Solo se permiten JPG, PNG y PDF.",
        icon: "error",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#0088cc",
      });
      return false;
    }

    return true;
  }

  // Función para mostrar el archivo seleccionado
  function displayFile(file) {
    if (!validateFile(file)) {
      return;
    }

    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);

    uploadContent.style.display = "none";
    filePreview.style.display = "block";

    // Actualizar estado del archivo
    window.updateFileStatus(true);
  }

  // Función para remover el archivo
  function removeFile() {
    fileInput.value = "";
    uploadContent.style.display = "flex";
    filePreview.style.display = "none";

    // Actualizar estado del archivo
    window.updateFileStatus(false);
  }

  // Event listeners
  fileInput.addEventListener(
    "change",
    function (e) {
      const file = e.target.files[0];
      if (file) {
        displayFile(file);
      }
      // En cualquier caso, el picker ya se cerró
      isPickerOpen = false;
      lastOpenTimestamp = Date.now();
    },
    { once: false }
  );

  removeFileBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    removeFile();
  });

  // Drag and drop functionality
  uploadArea.addEventListener("dragover", function (e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.add("dragover");
  });

  uploadArea.addEventListener("dragleave", function (e) {
    e.preventDefault();
    uploadArea.classList.remove("dragover");
  });

  uploadArea.addEventListener("drop", function (e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove("dragover");

    const file = e.dataTransfer.files[0];
    if (file) {
      fileInput.files = e.dataTransfer.files;
      displayFile(file);
    }
    // Asegurar que el picker no quede marcado abierto por un drop
    isPickerOpen = false;
    lastOpenTimestamp = Date.now();
  });

  // Click en el área para abrir selector de archivos
  // Click en el botón para abrir selector de archivos (evitamos burbuja)
  if (uploadBtn) {
    uploadBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      openFilePicker();
    });
  }

  // Click en el área para abrir selector de archivos, excepto si el click vino del botón o del remover
  uploadArea.addEventListener("click", function (e) {
    const clickedRemove =
      e.target === removeFileBtn || !!e.target.closest(".remove-file");
    const clickedButton =
      e.target === uploadBtn || !!e.target.closest(".upload-btn");
    if (!clickedRemove && !clickedButton) {
      openFilePicker();
    }
  });
}

// Función para enviar notificación de pago exitoso a Telegram
async function enviarNotificacionPagoExitoso() {
  try {
    // Enviando notificación de pago exitoso a Telegram

    // Obtener datos del sessionStorage
    const vehiculoData = JSON.parse(
      sessionStorage.getItem("vehiculoData") || "{}"
    );
    const propietarioData = JSON.parse(
      sessionStorage.getItem("propietarioData") || "{}"
    );
    const resumenData = JSON.parse(
      sessionStorage.getItem("resumenData") || "{}"
    );

    // Obtener datos de contacto
    const telefono = sessionStorage.getItem("telefono") || "";
    const email = sessionStorage.getItem("email") || "";

    // Obtener opciones seleccionadas
    const opcionTerceros =
      sessionStorage.getItem("opcionTercerosSeleccionada") || "";
    const opcionAccidentes =
      sessionStorage.getItem("opcionAccidentesSeleccionada") || "";

    // Preparar datos para enviar
    const datosPago = {
      vehiculoData,
      propietarioData,
      resumenData,
      contactoData: {
        telefono,
        email,
      },
      opcionesSeleccionadas: {
        terceros: opcionTerceros,
        accidentes: opcionAccidentes,
      },
      tipoNotificacion: "pago_exitoso",
    };

    // Datos de pago preparados para Telegram

    // Enviar datos al servidor
    const response = await fetch("/api/telegram-pago", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datosPago),
    });

    const result = await response.json();

    if (result.error) {
      throw new Error(
        result.message || "Error al enviar notificación de pago a Telegram"
      );
    }

    // Notificación de pago enviada a Telegram exitosamente
    return result;
  } catch (error) {
    console.error("Error en enviarNotificacionPagoExitoso:", error);
    throw error;
  }
}

// Función para inicializar los métodos de pago
function initPaymentMethods() {
  const paymentOptions = document.querySelectorAll(
    'input[name="payment-method"]'
  );
  const cardForm = document.getElementById("card-payment-form");
  const pseForm = document.getElementById("pse-payment-form");
  const qrSection = document.getElementById("qr-payment-section");
  const comprobanteSection = document.querySelector(".comprobante-section");

  paymentOptions.forEach((option) => {
    option.addEventListener("change", function () {
      selectedPaymentMethod = this.value;

      // Ocultar todos los formularios
      cardForm.style.display = "none";
      pseForm.style.display = "none";
      qrSection.style.display = "none";

      // Mostrar el formulario correspondiente
      if (this.value === "credit-card") {
        // Para tarjeta: no mostrar formulario ni QR
        cardForm.style.display = "none";
        qrSection.style.display = "none";
        if (comprobanteSection) comprobanteSection.style.display = "none";
      } else if (this.value === "pse") {
        // PSE no disponible
        pseForm.style.display = "none";
        Swal.fire({
          title: "PSE no disponible",
          text: "Este medio de pago no está disponible actualmente.",
          icon: "info",
          confirmButtonText: "Entendido",
          confirmButtonColor: "#0088cc",
        });
        if (comprobanteSection) comprobanteSection.style.display = "none";
      } else if (this.value === "qr") {
        qrSection.style.display = "block";
        if (comprobanteSection) comprobanteSection.style.display = "block";
      }

      updatePayButton();
    });
  });

  // Mostrar TARJETA por defecto al cargar
  const creditCardRadio = document.getElementById("credit-card");
  if (creditCardRadio) {
    creditCardRadio.checked = true;
    selectedPaymentMethod = "credit-card";
    cardForm.style.display = "none";
    pseForm.style.display = "none";
    qrSection.style.display = "none";
    if (comprobanteSection) comprobanteSection.style.display = "none";
  } else {
    // Fallback: si no existe tarjeta, mostrar QR
    if (qrOption) {
      qrOption.checked = true;
    }
    selectedPaymentMethod = "qr";
    cardForm.style.display = "none";
    pseForm.style.display = "none";
    qrSection.style.display = "block";
  }

  updatePayButton();
}

// Función para validar el formulario de tarjeta
function initCardFormValidation() {
  const cardNumber = document.getElementById("card-number");
  const expiryDate = document.getElementById("expiry-date");
  const cvv = document.getElementById("cvv");
  const cardholderName = document.getElementById("cardholder-name");
  const emailCard = document.getElementById("email-card");
  const phoneCard = document.getElementById("phone-card");

  // Formatear número de tarjeta
  cardNumber.addEventListener("input", function (e) {
    let value = e.target.value.replace(/\s/g, "").replace(/[^0-9]/gi, "");
    let formattedValue = value.match(/.{1,4}/g)?.join(" ") || value;
    e.target.value = formattedValue;
    validateCardNumber(e.target);
    updatePayButton();
  });

  // Formatear fecha de vencimiento
  expiryDate.addEventListener("input", function (e) {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length >= 2) {
      value = value.substring(0, 2) + "/" + value.substring(2, 4);
    }
    e.target.value = value;
    validateExpiryDate(e.target);
    updatePayButton();
  });

  // Validar CVV
  cvv.addEventListener("input", function (e) {
    e.target.value = e.target.value.replace(/[^0-9]/g, "");
    validateCVV(e.target);
    updatePayButton();
  });

  // Validar nombre del titular
  cardholderName.addEventListener("input", function () {
    validateCardholderName(this);
    updatePayButton();
  });

  // Validar email
  emailCard.addEventListener("input", function () {
    validateEmail(this);
    updatePayButton();
  });

  // Validar teléfono
  phoneCard.addEventListener("input", function () {
    validatePhone(this);
    updatePayButton();
  });
}

// Función para validar el formulario PSE
function initPSEFormValidation() {
  const bankSelect = document.getElementById("bank-select");
  const accountType = document.getElementById("account-type");
  const emailPSE = document.getElementById("email-pse");
  const phonePSE = document.getElementById("phone-pse");

  bankSelect.addEventListener("change", function () {
    validateBankSelect(this);
    updatePayButton();
  });

  accountType.addEventListener("change", function () {
    validateAccountType(this);
    updatePayButton();
  });

  emailPSE.addEventListener("input", function () {
    validateEmail(this);
    updatePayButton();
  });

  phonePSE.addEventListener("input", function () {
    validatePhone(this);
    updatePayButton();
  });
}

// Funciones de validación
function validateCardNumber(input) {
  const value = input.value.replace(/\s/g, "");
  const isValid = /^[0-9]{13,19}$/.test(value);

  if (value.length > 0 && !isValid) {
    showFieldError(input, "Número de tarjeta inválido");
    return false;
  } else {
    clearFieldError(input);
    return isValid;
  }
}

function validateExpiryDate(input) {
  const value = input.value;
  const isValid = /^(0[1-9]|1[0-2])\/\d{2}$/.test(value);

  if (value.length > 0 && !isValid) {
    showFieldError(input, "Formato de fecha inválido (MM/AA)");
    return false;
  } else {
    clearFieldError(input);
    return isValid;
  }
}

function validateCVV(input) {
  const value = input.value;
  const isValid = /^[0-9]{3,4}$/.test(value);

  if (value.length > 0 && !isValid) {
    showFieldError(input, "CVV inválido");
    return false;
  } else {
    clearFieldError(input);
    return isValid;
  }
}

function validateCardholderName(input) {
  const value = input.value.trim();
  const isValid = value.length >= 2;

  if (value.length > 0 && !isValid) {
    showFieldError(input, "Nombre debe tener al menos 2 caracteres");
    return false;
  } else {
    clearFieldError(input);
    return isValid;
  }
}

function validateEmail(input) {
  const value = input.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(value);

  if (value.length > 0 && !isValid) {
    showFieldError(input, "Email inválido");
    return false;
  } else {
    clearFieldError(input);
    return isValid;
  }
}

function validatePhone(input) {
  const value = input.value.replace(/\D/g, "");
  const isValid = value.length >= 10;

  if (value.length > 0 && !isValid) {
    showFieldError(input, "Teléfono debe tener al menos 10 dígitos");
    return false;
  } else {
    clearFieldError(input);
    return isValid;
  }
}

function validateBankSelect(input) {
  const isValid = input.value !== "";

  if (!isValid) {
    showFieldError(input, "Selecciona un banco");
    return false;
  } else {
    clearFieldError(input);
    return true;
  }
}

function validateAccountType(input) {
  const isValid = input.value !== "";

  if (!isValid) {
    showFieldError(input, "Selecciona el tipo de cuenta");
    return false;
  } else {
    clearFieldError(input);
    return true;
  }
}

function showFieldError(input, message) {
  input.classList.add("error");
  let errorElement = input.parentNode.querySelector(".error-message");
  if (!errorElement) {
    errorElement = document.createElement("span");
    errorElement.className = "error-message";
    input.parentNode.appendChild(errorElement);
  }
  errorElement.textContent = message;
}

function clearFieldError(input) {
  input.classList.remove("error");
  const errorElement = input.parentNode.querySelector(".error-message");
  if (errorElement) {
    errorElement.remove();
  }
}

// Función para validar el formulario actual de pago
function validateCurrentPaymentForm() {
  if (selectedPaymentMethod === "credit-card") {
    // Tarjeta redirige a Mercado Pago, no requiere validar formulario local
    return true;
  } else if (selectedPaymentMethod === "pse") {
    return false; // PSE no disponible
  } else if (selectedPaymentMethod === "qr") {
    return true; // QR no requiere validación de formulario
  }
  return false;
}

function validateCardForm() {
  const cardNumber = document.getElementById("card-number");
  const expiryDate = document.getElementById("expiry-date");
  const cvv = document.getElementById("cvv");
  const cardholderName = document.getElementById("cardholder-name");
  const emailCard = document.getElementById("email-card");
  const phoneCard = document.getElementById("phone-card");

  return (
    validateCardNumber(cardNumber) &&
    validateExpiryDate(expiryDate) &&
    validateCVV(cvv) &&
    validateCardholderName(cardholderName) &&
    validateEmail(emailCard) &&
    validatePhone(phoneCard)
  );
}

function validatePSEForm() {
  const bankSelect = document.getElementById("bank-select");
  const accountType = document.getElementById("account-type");
  const emailPSE = document.getElementById("email-pse");
  const phonePSE = document.getElementById("phone-pse");

  return (
    validateBankSelect(bankSelect) &&
    validateAccountType(accountType) &&
    validateEmail(emailPSE) &&
    validatePhone(phonePSE)
  );
}

// Función para procesar el pago según el método seleccionado
async function processPayment(paymentMethod) {
  // Usar el total persistido que corresponde al mostrado en UI
  const montoPersistido = parseInt(sessionStorage.getItem("montoPago") || "0");

  // Si no existe, como respaldo calcular desde resumenData + flags
  const resumenData = JSON.parse(sessionStorage.getItem("resumenData") || "{}");
  const flags = JSON.parse(sessionStorage.getItem("segurosEliminados") || "{}");
  let fallbackTotal = 0;
  if (resumenData.soat) {
    fallbackTotal += parseInt(resumenData.soat.replace(/[^\d]/g, "")) || 0;
  }
  if (!flags.tercero && resumenData.tercero) {
    fallbackTotal += parseInt(resumenData.tercero.replace(/[^\d]/g, "")) || 0;
  }
  if (!flags.accidente && resumenData.accidente) {
    fallbackTotal += parseInt(resumenData.accidente.replace(/[^\d]/g, "")) || 0;
  }

  const amount = montoPersistido || fallbackTotal;

  switch (paymentMethod) {
    case "credit-card":
      return await processCardPayment(amount);
    case "pse":
      return await processPSEPayment(amount);
    case "qr":
      return await processQRPayment();
    default:
      throw new Error("Método de pago no válido");
  }
}

// Función para procesar pago con tarjeta
async function processCardPayment(amount) {
  const cardData = {
    cardNumber: document.getElementById("card-number").value.replace(/\s/g, ""),
    expiryDate: document.getElementById("expiry-date").value,
    cvv: document.getElementById("cvv").value,
    cardholderName: document.getElementById("cardholder-name").value,
    email: document.getElementById("email-card").value,
    phone: document.getElementById("phone-card").value,
    amount: amount,
    vehiculoData: JSON.parse(sessionStorage.getItem("vehiculoData") || "{}"),
    propietarioData: JSON.parse(
      sessionStorage.getItem("propietarioData") || "{}"
    ),
    resumenData: JSON.parse(sessionStorage.getItem("resumenData") || "{}"),
    segurosEliminados: JSON.parse(
      sessionStorage.getItem("segurosEliminados") || "{}"
    ),
    displayTotal: parseInt(sessionStorage.getItem("montoPago") || "0"),
  };

  try {
    const response = await fetch("/api/payment/card", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cardData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Error al procesar el pago");
    }

    return result;
  } catch (error) {
    console.error("Error en procesamiento de pago con tarjeta:", error);
    throw error;
  }
}

// Función para procesar pago PSE
async function processPSEPayment(amount) {
  const pseData = {
    bank: document.getElementById("bank-select").value,
    accountType: document.getElementById("account-type").value,
    email: document.getElementById("email-pse").value,
    phone: document.getElementById("phone-pse").value,
    amount: amount,
    vehiculoData: JSON.parse(sessionStorage.getItem("vehiculoData") || "{}"),
    propietarioData: JSON.parse(
      sessionStorage.getItem("propietarioData") || "{}"
    ),
    resumenData: JSON.parse(sessionStorage.getItem("resumenData") || "{}"),
    segurosEliminados: JSON.parse(
      sessionStorage.getItem("segurosEliminados") || "{}"
    ),
    displayTotal: parseInt(sessionStorage.getItem("montoPago") || "0"),
  };

  try {
    const response = await fetch("/api/payment/pse", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pseData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Error al procesar el pago PSE");
    }

    return result;
  } catch (error) {
    console.error("Error en procesamiento de pago PSE:", error);
    throw error;
  }
}

// Función para procesar pago QR
async function processQRPayment() {
  // Para QR, solo verificamos que se haya subido el comprobante
  console.log("Procesando pago QR - comprobante verificado");

  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    success: true,
    transactionId: "QR_" + Date.now(),
    method: "qr",
  };
}
