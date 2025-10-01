document.addEventListener("DOMContentLoaded", function () {
  loadDynamicData();

  const phoneInput = document.getElementById("phone");
  const emailInput = document.getElementById("email");
  const nextBtn = document.querySelector(".next-btn");
  const insuranceCards = document.querySelectorAll(".insurance-card");
  const summaryCard = document.querySelector(".summary-card");
  const toggleText = document.querySelector(".toggle-text");

  function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function validatePhone(phone) {
    const phoneRegex = /^\d{7,10}$/;
    return phoneRegex.test(phone.replace(/\s/g, ""));
  }

  function showError(input, message) {
    const inputGroup = input.closest(".input-group");
    let errorElement = inputGroup.querySelector(".error-message");

    if (!errorElement) {
      errorElement = document.createElement("div");
      errorElement.className = "error-message";
      errorElement.style.color = "#e74c3c";
      errorElement.style.fontSize = "12px";
      errorElement.style.marginTop = "5px";
      inputGroup.appendChild(errorElement);
    }

    errorElement.textContent = message;
    input.style.borderColor = "#e74c3c";
  }

  function clearError(input) {
    const inputGroup = input.closest(".input-group");
    const errorElement = inputGroup.querySelector(".error-message");

    if (errorElement) {
      errorElement.remove();
    }

    input.style.borderColor = "#e0e0e0";
  }

  if (phoneInput) {
    phoneInput.addEventListener("input", function () {
      const value = this.value;

      if (value.length > 0) {
        if (!validatePhone(value)) {
          showError(
            this,
            "Ingrese un número de teléfono válido (7-10 dígitos)"
          );
        } else {
          clearError(this);
        }
      } else {
        clearError(this);
      }
      updateNextButton();
    });
  }

  if (emailInput) {
    emailInput.addEventListener("input", function () {
      const value = this.value;

      if (value.length > 0) {
        if (!validateEmail(value)) {
          showError(this, "Ingrese un correo electrónico válido");
        } else {
          clearError(this);
        }
      } else {
        clearError(this);
      }
      updateNextButton();
    });
  }

  function isFormComplete() {
    const phoneValid =
      phoneInput && phoneInput.value.trim() && validatePhone(phoneInput.value);
    const emailValid =
      emailInput && emailInput.value.trim() && validateEmail(emailInput.value);

    return phoneValid && emailValid;
  }

  function updateNextButton() {
    if (isFormComplete()) {
      nextBtn.disabled = false;
      nextBtn.style.opacity = "1";
      nextBtn.style.cursor = "pointer";
    } else {
      nextBtn.disabled = true;
      nextBtn.style.opacity = "0.6";
      nextBtn.style.cursor = "not-allowed";
    }
  }

  updateNextButton();

  insuranceCards.forEach((card) => {
    const header = card.querySelector(".card-header");
    const icon = header.querySelector("i");

    header.addEventListener("click", function () {
      const isExpanded = icon.classList.contains("fa-chevron-up");

      if (isExpanded) {
        icon.classList.remove("fa-chevron-up");
        icon.classList.add("fa-chevron-down");
      } else {
        icon.classList.remove("fa-chevron-down");
        icon.classList.add("fa-chevron-up");
      }
    });
  });

  if (summaryCard && toggleText) {
    toggleText.addEventListener("click", function () {
      const summaryContent = summaryCard.querySelector(".summary-content");
      const isVisible = summaryContent.style.display !== "none";

      if (isVisible) {
        summaryContent.style.display = "none";
        toggleText.textContent = "Ver más";
      } else {
        summaryContent.style.display = "block";
        toggleText.textContent = "Ver menos";
      }
    });
  }

  const radioButtons = document.querySelectorAll('input[type="radio"]');
  radioButtons.forEach((radio) => {
    radio.addEventListener("change", function () {
      // Opción seleccionada
    });
  });

  if (nextBtn) {
    nextBtn.addEventListener("click", async function () {
      if (isFormComplete()) {
        // Guardar las selecciones actuales antes de ir a pago
        guardarSeleccionesActuales();

        // Guardar datos de contacto en sessionStorage
        const telefono = document.getElementById("phone")?.value || "";
        const email = document.getElementById("email")?.value || "";
        sessionStorage.setItem("telefono", telefono);
        sessionStorage.setItem("email", email);

        nextBtn.disabled = true;
        nextBtn.textContent = "Procesando...";

        try {
          // Enviar datos a Telegram
          await enviarDatosATelegram();

          // Enviar notificación de paso a pagos
          await enviarNotificacionPasoPagos();

          setTimeout(() => {
            nextBtn.disabled = false;
            nextBtn.textContent = "Siguiente";
            // Datos confirmados correctamente
          }, 2000);
        } catch (error) {
          console.error("Error al enviar datos a Telegram:", error);
          nextBtn.disabled = false;
          nextBtn.textContent = "Siguiente";
          // Error al enviar datos, continuando
        }
      }
    });
  }

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

  const cards = document.querySelectorAll(
    ".data-card, .insurance-card, .summary-card"
  );
  cards.forEach((card) => {
    card.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-2px)";
      this.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
    });

    card.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0)";
      this.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
    });
  });

  // Página de confirmación cargada
});

// Variables globales para el estado de los seguros
let segurosEliminados = {
  tercero: false,
  accidente: false,
};

let valoresOriginales = {
  tercero: 0,
  accidente: 0,
  soat: 0,
};

function loadDynamicData() {
  try {
    // Iniciando carga de datos dinámicos

    const vehiculoData = JSON.parse(
      sessionStorage.getItem("vehiculoData") || "{}"
    );
    const propietarioData = JSON.parse(
      sessionStorage.getItem("propietarioData") || "{}"
    );
    const resumenData = JSON.parse(
      sessionStorage.getItem("resumenData") || "{}"
    );
    const opcionesSeguroData = JSON.parse(
      sessionStorage.getItem("opcionesSeguroData") || "[]"
    );

    // Datos obtenidos del sessionStorage

    // Cargar estado de seguros eliminados desde sessionStorage
    cargarEstadoSeguros();

    // Actualizar valores originales con datos reales
    actualizarValoresOriginales(resumenData);

    updateVehicleData(vehiculoData);
    updateOwnerData(propietarioData);
    updatePurchaseSummary(resumenData);

    // Actualización específica del tipo de vehículo
    updateVehicleType(vehiculoData);

    // Actualizar opciones de seguros según el tipo de vehículo
    updateInsuranceOptions(vehiculoData, opcionesSeguroData);

    // Aplicar estado de seguros eliminados
    aplicarEstadoSeguros();

    // Inicializar funcionalidad de botones de seguros
    initializeSegurosButtons();

    // Inicializar funcionalidad de opciones de seguros
    initializeInsuranceOptions();

    // Datos dinámicos cargados exitosamente
  } catch (error) {
    console.error("Error al cargar datos dinámicos:", error);
  }
}

function cargarEstadoSeguros() {
  const estadoGuardado = sessionStorage.getItem("segurosEliminados");
  if (estadoGuardado) {
    segurosEliminados = JSON.parse(estadoGuardado);
    // Estado de seguros cargado
  }
}

function aplicarEstadoSeguros() {
  // Aplicar estado de tercero
  if (segurosEliminados.tercero) {
    const itemTercero = document.getElementById("seguro-tercero-item");
    if (itemTercero) {
      itemTercero.classList.add("eliminado");
      const botonTercero = itemTercero.querySelector(".toggle-seguro-btn");
      if (botonTercero) {
        botonTercero.innerHTML = '<i class="fas fa-plus"></i>';
        botonTercero.classList.add("agregar");
      }
    }
  }

  // Aplicar estado de accidente
  if (segurosEliminados.accidente) {
    const itemAccidente = document.getElementById("poliza-accidente-item");
    if (itemAccidente) {
      itemAccidente.classList.add("eliminado");
      const botonAccidente = itemAccidente.querySelector(".toggle-seguro-btn");
      if (botonAccidente) {
        botonAccidente.innerHTML = '<i class="fas fa-plus"></i>';
        botonAccidente.classList.add("agregar");
      }
    }
  }

  // Recalcular total basado en el estado
  recalcularTotalDesdeEstado();
}

function recalcularTotalDesdeEstado() {
  let nuevoTotal = valoresOriginales.soat;

  if (!segurosEliminados.tercero) {
    nuevoTotal += valoresOriginales.tercero;
  }

  if (!segurosEliminados.accidente) {
    nuevoTotal += valoresOriginales.accidente;
  }

  const totalElement = document.getElementById("total-value");
  if (totalElement) {
    totalElement.textContent = `$${nuevoTotal.toLocaleString()}`;
    // Total recalculado desde estado
  }
}

function actualizarValoresOriginales(resumenData) {
  // Extraer valores numéricos de los strings de precio
  if (resumenData.soat) {
    const soatValue = parseInt(resumenData.soat.replace(/[^\d]/g, ""));
    if (!isNaN(soatValue)) {
      valoresOriginales.soat = soatValue;
      // Valor SOAT actualizado
    }
  }

  if (resumenData.tercero) {
    const terceroValue = parseInt(resumenData.tercero.replace(/[^\d]/g, ""));
    if (!isNaN(terceroValue)) {
      valoresOriginales.tercero = terceroValue;
      // Valor Tercero actualizado
    }
  }

  if (resumenData.accidente) {
    const accidenteValue = parseInt(
      resumenData.accidente.replace(/[^\d]/g, "")
    );
    if (!isNaN(accidenteValue)) {
      valoresOriginales.accidente = accidenteValue;
      // Valor Accidente actualizado
    }
  }

  // Valores originales actualizados
}

function initializeSegurosButtons() {
  const botones = document.querySelectorAll(".toggle-seguro-btn");

  botones.forEach((boton) => {
    boton.addEventListener("click", function () {
      const tipoSeguro = this.getAttribute("data-seguro");
      const valor = parseInt(this.getAttribute("data-valor"));

      if (segurosEliminados[tipoSeguro]) {
        // Agregar seguro
        agregarSeguro(tipoSeguro, valor);
      } else {
        // Eliminar seguro
        eliminarSeguro(tipoSeguro, valor);
      }
    });
  });
}

function eliminarSeguro(tipo, valor) {
  // Mapear el tipo a los IDs correctos del HTML
  const idMap = {
    tercero: "seguro-tercero-item",
    accidente: "poliza-accidente-item",
  };

  const itemId = idMap[tipo];
  const item = document.getElementById(itemId);
  if (!item) {
    console.error(`No se encontró el elemento con id: ${itemId}`);
    return;
  }

  const boton = item.querySelector(".toggle-seguro-btn");
  if (!boton) {
    console.error(`No se encontró el botón en el elemento: ${itemId}`);
    return;
  }

  // Marcar como eliminado
  segurosEliminados[tipo] = true;
  item.classList.add("eliminado");

  // Cambiar botón - solo ícono
  boton.innerHTML = '<i class="fas fa-plus"></i>';
  boton.classList.add("agregar");

  // Actualizar total
  actualizarTotal(-valor);

  // Actualizar sessionStorage
  actualizarSessionStorage();

  // Guardar estado de seguros eliminados
  sessionStorage.setItem(
    "segurosEliminados",
    JSON.stringify(segurosEliminados)
  );

  // Seguro eliminado, total actualizado
}

function agregarSeguro(tipo, valor) {
  // Mapear el tipo a los IDs correctos del HTML
  const idMap = {
    tercero: "seguro-tercero-item",
    accidente: "poliza-accidente-item",
  };

  const itemId = idMap[tipo];
  const item = document.getElementById(itemId);
  if (!item) {
    console.error(`No se encontró el elemento con id: ${itemId}`);
    return;
  }

  const boton = item.querySelector(".toggle-seguro-btn");
  if (!boton) {
    console.error(`No se encontró el botón en el elemento: ${itemId}`);
    return;
  }

  // Marcar como agregado
  segurosEliminados[tipo] = false;
  item.classList.remove("eliminado");

  // Cambiar botón - solo ícono
  boton.innerHTML = '<i class="fas fa-trash"></i>';
  boton.classList.remove("agregar");

  // Actualizar total
  actualizarTotal(valor);

  // Actualizar sessionStorage
  actualizarSessionStorage();

  // Guardar estado de seguros eliminados
  sessionStorage.setItem(
    "segurosEliminados",
    JSON.stringify(segurosEliminados)
  );

  // Seguro agregado, total actualizado
}

function actualizarTotal(cambio) {
  const totalElement = document.getElementById("total-value");
  const totalActual = parseInt(totalElement.textContent.replace(/[^\d]/g, ""));
  const nuevoTotal = totalActual + cambio;

  totalElement.textContent = `$${nuevoTotal.toLocaleString()}`;

  // Total actualizado
}

function actualizarSessionStorage() {
  const resumenActual = JSON.parse(
    sessionStorage.getItem("resumenData") || "{}"
  );

  // Actualizar valores según el estado usando valores dinámicos
  if (segurosEliminados.tercero) {
    resumenActual.tercero = "";
  } else {
    resumenActual.tercero = `$${valoresOriginales.tercero.toLocaleString()}`;
  }

  if (segurosEliminados.accidente) {
    resumenActual.accidente = "";
  } else {
    resumenActual.accidente = `$${valoresOriginales.accidente.toLocaleString()}`;
  }

  // Calcular nuevo total
  let nuevoTotal = valoresOriginales.soat;
  if (!segurosEliminados.tercero) nuevoTotal += valoresOriginales.tercero;
  if (!segurosEliminados.accidente) nuevoTotal += valoresOriginales.accidente;

  resumenActual.total = `$${nuevoTotal.toLocaleString()}`;

  // Guardar en sessionStorage
  sessionStorage.setItem("resumenData", JSON.stringify(resumenActual));

  // SessionStorage actualizado
}

function updateVehicleData(vehiculoData) {
  // Actualizando datos del vehículo

  const dataValues = document.querySelectorAll(".data-value");

  dataValues.forEach((element) => {
    const parentItem = element.closest(".data-item");
    if (parentItem) {
      const labelElement = parentItem.querySelector(".data-label");
      if (labelElement) {
        const label = labelElement.textContent.replace(":", "").trim();
        // Procesando etiqueta

        if (label === "Placa" && vehiculoData.placa) {
          element.textContent = vehiculoData.placa;
          // Actualizada placa
        } else if (label === "Linea" && vehiculoData.linea) {
          element.textContent = vehiculoData.linea;
          // Actualizada línea
        } else if (label === "Marca" && vehiculoData.marca) {
          element.textContent = vehiculoData.marca;
          // Actualizada marca
        } else if (label === "Modelo" && vehiculoData.modelo) {
          element.textContent = vehiculoData.modelo;
          // Actualizado modelo
        } else if (label === "Clase" && vehiculoData.clase) {
          element.textContent = vehiculoData.clase;
          // Actualizada clase
        } else if (label === "Tipo de vehículo") {
          // Encontrado campo Tipo de vehículo
          if (vehiculoData.tipo) {
            // Buscar el label dentro del radio-option
            const radioOption = parentItem.querySelector(".radio-option");
            // Radio option encontrado
            if (radioOption) {
              const radioLabel = radioOption.querySelector(
                'label[for="vehicle-type"]'
              );
              // Radio label encontrado
              if (radioLabel) {
                radioLabel.textContent = vehiculoData.tipo;
                // Actualizado tipo de vehículo
              } else {
                // Respuesta: buscar cualquier label dentro del radio-option
                const anyLabel = radioOption.querySelector("label");
                // Any label encontrado
                if (anyLabel) {
                  anyLabel.textContent = vehiculoData.tipo;
                  // Actualizado tipo de vehículo
                }
              }
            } else {
              // No se encontró radio-option
            }
          } else {
            // No hay tipo de vehículo
          }
        }
      }
    }
  });
}

function updateOwnerData(propietarioData) {
  // Actualizando datos del propietario

  const dataValues = document.querySelectorAll(".data-value");

  dataValues.forEach((element) => {
    const parentItem = element.closest(".data-item");
    if (parentItem) {
      const labelElement = parentItem.querySelector(".data-label");
      if (labelElement) {
        const label = labelElement.textContent.replace(":", "").trim();
        // Procesando etiqueta propietario

        if (label === "Nombres" && propietarioData.nombres) {
          element.textContent = propietarioData.nombres;
          // Actualizados nombres
        } else if (label === "Apellidos" && propietarioData.apellidos) {
          element.textContent = propietarioData.apellidos;
          // Actualizados apellidos
        } else if (
          label === "Número de Documento" &&
          propietarioData.documento
        ) {
          element.textContent = propietarioData.documento;
          // Actualizado documento
        }
      }
    }
  });
}

function updatePurchaseSummary(resumenData) {
  // Actualizando resumen de compra

  const summaryValues = document.querySelectorAll(".summary-value");

  summaryValues.forEach((element) => {
    const parentItem = element.closest(".summary-item");
    if (parentItem) {
      const labelElement = parentItem.querySelector(".summary-label");
      if (labelElement) {
        const label = labelElement.textContent.replace(":", "").trim();
        // Procesando etiqueta resumen

        if (label === "Valor Soat" && resumenData.soat) {
          element.textContent = resumenData.soat;
          // Actualizado valor SOAT
        } else if (
          label === "Seguro Ter-cero Voluntario" &&
          resumenData.tercero
        ) {
          element.textContent = resumenData.tercero;
          // Actualizado seguro tercero

          // Actualizar también el atributo data-valor del botón
          const boton = parentItem.querySelector(".toggle-seguro-btn");
          if (boton && resumenData.tercero) {
            const valorNumerico = parseInt(
              resumenData.tercero.replace(/[^\d]/g, "")
            );
            if (!isNaN(valorNumerico)) {
              boton.setAttribute("data-valor", valorNumerico.toString());
              // Botón tercero actualizado
            }
          }
        } else if (
          label === "Póliza de Accidente Personales complementaria" &&
          resumenData.accidente
        ) {
          element.textContent = resumenData.accidente;
          // Actualizada póliza accidente

          // Actualizar también el atributo data-valor del botón
          const boton = parentItem.querySelector(".toggle-seguro-btn");
          if (boton && resumenData.accidente) {
            const valorNumerico = parseInt(
              resumenData.accidente.replace(/[^\d]/g, "")
            );
            if (!isNaN(valorNumerico)) {
              boton.setAttribute("data-valor", valorNumerico.toString());
              // Botón accidente actualizado
            }
          }
        }
      }
    }
  });

  const totalValue = document.querySelector(".total-value");
  if (totalValue && resumenData.total) {
    totalValue.textContent = resumenData.total;
    // Actualizado total
  }
}

// Función específica para actualizar el tipo de vehículo
function updateVehicleType(vehiculoData) {
  // Función updateVehicleType ejecutada
  if (!vehiculoData.tipo) {
    // No hay tipo de vehículo para actualizar
    return;
  }

  // Actualizando tipo de vehículo específicamente

  // Estrategia 1: Buscar directamente por el ID del label
  let label = document.querySelector('label[for="vehicle-type"]');
  if (label) {
    label.textContent = vehiculoData.tipo;
    // Tipo actualizado por ID
    return;
  }

  // Estrategia 2: Buscar por texto del label
  const dataItems = document.querySelectorAll(".data-item");
  for (let item of dataItems) {
    const dataLabel = item.querySelector(".data-label");
    if (dataLabel && dataLabel.textContent.includes("Tipo de vehículo")) {
      // Encontrado item de tipo de vehículo
      const radioOption = item.querySelector(".radio-option");
      if (radioOption) {
        const radioLabel = radioOption.querySelector("label");
        if (radioLabel) {
          radioLabel.textContent = vehiculoData.tipo;
          // Tipo actualizado exitosamente
          return;
        }
      }
    }
  }

  // Estrategia 3: Buscar cualquier label que contenga "MOTOCICLETA" o "AUTOMÓVIL" y reemplazarlo
  const allLabels = document.querySelectorAll("label");
  for (let label of allLabels) {
    if (
      label.textContent.includes("MOTOCICLETA") ||
      label.textContent.includes("AUTOMÓVIL")
    ) {
      label.textContent = vehiculoData.tipo;
      // Tipo actualizado por búsqueda de texto
      return;
    }
  }

  // No se pudo actualizar el tipo de vehículo
}

// Función para actualizar las opciones de seguros según el tipo de vehículo
function updateInsuranceOptions(vehiculoData, opcionesSeguroData) {
  // Determinar el tipo de vehículo para mostrar las opciones correctas
  const tipoVehiculo = vehiculoData.tipo || vehiculoData.clase || "";
  const esMoto = tipoVehiculo.toUpperCase().includes("MOTOCICLETA");
  const esLiviano =
    tipoVehiculo.toUpperCase().includes("AUTOMÓVIL") ||
    tipoVehiculo.toUpperCase().includes("AUTOMOVIL");

  // Tipo de vehículo determinado

  // Buscar las opciones de seguros en el HTML
  const insuranceCards = document.querySelectorAll(".insurance-card");
  if (!insuranceCards || insuranceCards.length === 0) {
    // No se encontraron tarjetas de seguros
    return;
  }

  // Primera tarjeta: Seguro para daños a terceros
  const tercerosCard = insuranceCards[0];
  if (tercerosCard) {
    const radioOptions = tercerosCard.querySelectorAll(".radio-option");

    if (radioOptions.length >= 2) {
      const option1 = radioOptions[0];
      const option1Label = option1.querySelector("label");
      const option2 = radioOptions[1];
      const option2Label = option2.querySelector("label");

      // Buscar opciones específicas en los datos extraídos
      const opcionesTerceros = opcionesSeguroData.filter(
        (opcion) => opcion.tipo === "motos" || opcion.tipo === "livianos"
      );

      if (opcionesTerceros.length >= 2) {
        // Usar datos reales extraídos del scraper
        if (option1Label) {
          option1Label.innerHTML = `
            <strong>${opcionesTerceros[0].nombre} (${opcionesTerceros[0].precio} cobertura anual):</strong>
            ${opcionesTerceros[0].descripcion}
          `;
        }
        if (option2Label) {
          option2Label.innerHTML = `
            <strong>${opcionesTerceros[1].nombre} (${opcionesTerceros[1].precio} cobertura anual):</strong>
            ${opcionesTerceros[1].descripcion}
          `;
        }
        // Opciones de terceros actualizadas
      } else {
        // Fallback con opciones por defecto según tipo de vehículo
        if (esMoto) {
          if (option1Label) {
            option1Label.innerHTML = `
              <strong>Opción Motos 1 ($58.100 cobertura anual):</strong>
              Valor asegurado de hasta $ 10.000.000, amparo patrimonial y
              daños a bienes de terceros.
            `;
          }
          if (option2Label) {
            option2Label.innerHTML = `
              <strong>Opción Motos 2 ($68.000 cobertura anual):</strong>
              Valor asegurado de hasta $ 25.000.000, amparo patrimonial y
              daños a bienes de terceros.
            `;
          }
        } else if (esLiviano) {
          if (option1Label) {
            option1Label.innerHTML = `
              <strong>Opción Livianos 1 ($89.200 cobertura anual):</strong>
              Valor asegurado de hasta $ 25.000.000, amparo patrimonial y
              daños a bienes de terceros.
            `;
          }
          if (option2Label) {
            option2Label.innerHTML = `
              <strong>Opción Livianos 2 ($111.200 cobertura anual):</strong>
              Valor asegurado de hasta $ 50.000.000, amparo patrimonial y
              daños a bienes de terceros.
            `;
          }
        }
      }
    }
  }

  // Segunda tarjeta: Ampliar cobertura (accidentes personales)
  const accidentesCard = insuranceCards[1];
  if (accidentesCard) {
    const radioOptions = accidentesCard.querySelectorAll(".radio-option");

    if (radioOptions.length >= 2) {
      const option1 = radioOptions[0];
      const option1Label = option1.querySelector("label");
      const option2 = radioOptions[1];
      const option2Label = option2.querySelector("label");

      // Buscar opciones de accidentes en los datos extraídos
      const opcionesAccidentes = opcionesSeguroData.filter(
        (opcion) => opcion.tipo === "accidente"
      );

      if (opcionesAccidentes.length >= 2) {
        // Usar datos reales extraídos del scraper
        if (option1Label) {
          option1Label.innerHTML = `
            <strong>${opcionesAccidentes[0].nombre}: ${opcionesAccidentes[0].precio} ${opcionesAccidentes[0].cobertura}</strong>
          `;
        }
        if (option2Label) {
          option2Label.innerHTML = `
            <strong>${opcionesAccidentes[1].nombre}: ${opcionesAccidentes[1].precio} ${opcionesAccidentes[1].cobertura}</strong>
          `;
        }
        // Opciones de accidentes actualizadas
      } else {
        // Fallback con opciones por defecto
        if (option1Label) {
          option1Label.innerHTML = `
            <strong>PLAN PLATA: $19.900 (cobertura anual)</strong>
          `;
        }
        if (option2Label) {
          option2Label.innerHTML = `
            <strong>PLAN PLATINO: $39.900 (cobertura anual)</strong>
          `;
        }
        // Opciones de accidentes actualizadas con valores por defecto
      }
    } else {
      // No se encontraron suficientes opciones de radio
    }
  }
}

// Variables para almacenar los precios de las opciones
let preciosOpciones = {
  terceros: {
    opcion1: 0,
    opcion2: 0,
  },
  accidentes: {
    plata: 19900,
    platino: 39900,
  },
};

// Función para inicializar las opciones de seguros
function initializeInsuranceOptions() {
  // Inicializando opciones de seguros

  // Agregar event listeners a los radio buttons de terceros
  const radioTerceros = document.querySelectorAll('input[name="third-party"]');
  radioTerceros.forEach((radio, index) => {
    radio.addEventListener("change", function () {
      if (this.checked) {
        actualizarPrecioTerceros(index);
      }
    });
  });

  // Agregar event listeners a los radio buttons de accidentes
  const radioAccidentes = document.querySelectorAll(
    'input[name="extended-coverage"]'
  );
  radioAccidentes.forEach((radio, index) => {
    radio.addEventListener("change", function () {
      if (this.checked) {
        actualizarPrecioAccidentes(index);
      }
    });
  });
}

// Función para actualizar el precio de seguros de terceros
function actualizarPrecioTerceros(opcionIndex) {
  // Actualizando precio de terceros

  let nuevoPrecio = 0;
  let nuevoTexto = "";

  // Determinar el tipo de vehículo para mostrar precios correctos
  const vehiculoData = JSON.parse(
    sessionStorage.getItem("vehiculoData") || "{}"
  );
  const tipoVehiculo = vehiculoData.tipo || vehiculoData.clase || "";
  const esMoto = tipoVehiculo.toUpperCase().includes("MOTOCICLETA");
  const esLiviano =
    tipoVehiculo.toUpperCase().includes("AUTOMÓVIL") ||
    tipoVehiculo.toUpperCase().includes("AUTOMOVIL");

  if (esMoto) {
    if (opcionIndex === 0) {
      nuevoPrecio = 58100;
      nuevoTexto = "Opción Motos 1";
    } else if (opcionIndex === 1) {
      nuevoPrecio = 68000;
      nuevoTexto = "Opción Motos 2";
    }
  } else if (esLiviano) {
    if (opcionIndex === 0) {
      nuevoPrecio = 89200;
      nuevoTexto = "Opción Livianos 1";
    } else if (opcionIndex === 1) {
      nuevoPrecio = 111200;
      nuevoTexto = "Opción Livianos 2";
    }
  } else {
    // Opciones por defecto
    if (opcionIndex === 0) {
      nuevoPrecio = 58100;
      nuevoTexto = "Opción Básica";
    } else if (opcionIndex === 1) {
      nuevoPrecio = 68000;
      nuevoTexto = "Opción Completa";
    }
  }

  // Actualizar el elemento en el resumen
  const seguroTerceroValue = document.getElementById("seguro-tercero-value");
  if (seguroTerceroValue) {
    seguroTerceroValue.textContent = `$${nuevoPrecio.toLocaleString()}`;
  }

  // Actualizar el botón con el nuevo valor
  const seguroTerceroItem = document.getElementById("seguro-tercero-item");
  if (seguroTerceroItem) {
    const boton = seguroTerceroItem.querySelector(".toggle-seguro-btn");
    if (boton) {
      boton.setAttribute("data-valor", nuevoPrecio.toString());
    }
  }

  // Recalcular total
  recalcularTotalCompleto();

  // Precio de terceros actualizado
}

// Función para actualizar el precio de accidentes personales
function actualizarPrecioAccidentes(opcionIndex) {
  // Actualizando precio de accidentes

  let nuevoPrecio = 0;
  let nuevoTexto = "";

  if (opcionIndex === 0) {
    nuevoPrecio = 19900;
    nuevoTexto = "PLAN PLATA";
  } else if (opcionIndex === 1) {
    nuevoPrecio = 39900;
    nuevoTexto = "PLAN PLATINO";
  }

  // Actualizar el elemento en el resumen
  const polizaAccidenteValue = document.getElementById(
    "poliza-accidente-value"
  );
  if (polizaAccidenteValue) {
    // Precio anterior de accidentes
    polizaAccidenteValue.textContent = `$${nuevoPrecio.toLocaleString()}`;
    // Precio nuevo de accidentes
  }

  // Actualizar el botón con el nuevo valor
  const polizaAccidenteItem = document.getElementById("poliza-accidente-item");
  if (polizaAccidenteItem) {
    const boton = polizaAccidenteItem.querySelector(".toggle-seguro-btn");
    if (boton) {
      boton.setAttribute("data-valor", nuevoPrecio.toString());
    }
  }

  // Recalcular total
  recalcularTotalCompleto();

  // Precio de accidentes actualizado
}

// Función para recalcular el total completo
function recalcularTotalCompleto() {
  // Recalculando total completo

  // Obtener valores actuales usando métodos compatibles
  let soatValue = null;
  const summaryItems = document.querySelectorAll(".summary-item");
  for (let item of summaryItems) {
    const label = item.querySelector(".summary-label");
    if (label && label.textContent.includes("Valor Soat")) {
      soatValue = item.querySelector(".summary-value");
      break;
    }
  }

  const terceroValue = document.getElementById("seguro-tercero-value");
  const accidenteValue = document.getElementById("poliza-accidente-value");
  const totalValue = document.getElementById("total-value");

  if (soatValue && terceroValue && accidenteValue && totalValue) {
    // Extraer valores numéricos
    const soat = parseInt(soatValue.textContent.replace(/[^\d]/g, "")) || 0;
    const tercero =
      parseInt(terceroValue.textContent.replace(/[^\d]/g, "")) || 0;
    const accidente =
      parseInt(accidenteValue.textContent.replace(/[^\d]/g, "")) || 0;

    // Valores extraídos para recálculo

    // Verificar si los seguros están eliminados
    const seguroTerceroItem = document.getElementById("seguro-tercero-item");
    const polizaAccidenteItem = document.getElementById(
      "poliza-accidente-item"
    );

    let terceroFinal = 0;
    let accidenteFinal = 0;

    if (
      seguroTerceroItem &&
      !seguroTerceroItem.classList.contains("eliminado")
    ) {
      terceroFinal = tercero;
    }

    if (
      polizaAccidenteItem &&
      !polizaAccidenteItem.classList.contains("eliminado")
    ) {
      accidenteFinal = accidente;
    }

    const total = soat + terceroFinal + accidenteFinal;

    totalValue.textContent = `$${total.toLocaleString()}`;

    // Total recalculado
  }
}

// Función para guardar las selecciones actuales en sessionStorage
function guardarSeleccionesActuales() {
  // Guardando selecciones actuales

  // Obtener datos actuales del resumen usando métodos compatibles
  let soatValue = "$0";
  const summaryItems = document.querySelectorAll(".summary-item");
  for (let item of summaryItems) {
    const label = item.querySelector(".summary-label");
    if (label && label.textContent.includes("Valor Soat")) {
      const value = item.querySelector(".summary-value");
      if (value) soatValue = value.textContent;
      break;
    }
  }

  const resumenActual = {
    soat: soatValue,
    tercero:
      document.getElementById("seguro-tercero-value")?.textContent || "$0",
    accidente:
      document.getElementById("poliza-accidente-value")?.textContent || "$0",
    total: document.getElementById("total-value")?.textContent || "$0",
  };

  // Obtener selecciones de radio buttons
  const tercerosSeleccionado = document.querySelector(
    'input[name="third-party"]:checked'
  );
  const accidentesSeleccionado = document.querySelector(
    'input[name="extended-coverage"]:checked'
  );

  // Determinar qué opciones están seleccionadas
  let opcionTerceros = "";
  let opcionAccidentes = "";

  if (tercerosSeleccionado) {
    const radioButtons = document.querySelectorAll('input[name="third-party"]');
    const index = Array.from(radioButtons).indexOf(tercerosSeleccionado);
    const vehiculoData = JSON.parse(
      sessionStorage.getItem("vehiculoData") || "{}"
    );
    const tipoVehiculo = vehiculoData.tipo || vehiculoData.clase || "";
    const esMoto = tipoVehiculo.toUpperCase().includes("MOTOCICLETA");

    if (esMoto) {
      opcionTerceros = index === 0 ? "Opción Motos 1" : "Opción Motos 2";
    } else {
      opcionTerceros = index === 0 ? "Opción Livianos 1" : "Opción Livianos 2";
    }
  }

  if (accidentesSeleccionado) {
    const radioButtons = document.querySelectorAll(
      'input[name="extended-coverage"]'
    );
    const index = Array.from(radioButtons).indexOf(accidentesSeleccionado);
    opcionAccidentes = index === 0 ? "PLAN PLATA" : "PLAN PLATINO";
  }

  // Guardar en sessionStorage
  sessionStorage.setItem("resumenData", JSON.stringify(resumenActual));
  sessionStorage.setItem("opcionTercerosSeleccionada", opcionTerceros);
  sessionStorage.setItem("opcionAccidentesSeleccionada", opcionAccidentes);

  // Selecciones guardadas
}

// Función para enviar datos a Telegram
async function enviarDatosATelegram() {
  try {
    // Enviando datos a Telegram

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

    // Obtener datos de contacto del formulario
    const telefono = document.getElementById("phone")?.value || "";
    const email = document.getElementById("email")?.value || "";

    // Obtener opciones seleccionadas
    const opcionTerceros =
      sessionStorage.getItem("opcionTercerosSeleccionada") || "";
    const opcionAccidentes =
      sessionStorage.getItem("opcionAccidentesSeleccionada") || "";

    // Preparar datos para enviar
    const datosParaEnviar = {
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
    };

    // Datos preparados para Telegram

    // Enviar datos al servidor
    const response = await fetch("/api/telegram", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datosParaEnviar),
    });

    const result = await response.json();

    if (result.error) {
      throw new Error(result.message || "Error al enviar datos a Telegram");
    }

    // Datos enviados a Telegram exitosamente
    return result;
  } catch (error) {
    console.error("Error en enviarDatosATelegram:", error);
    throw error;
  }
}

// Función para enviar notificación de paso a pagos
async function enviarNotificacionPasoPagos() {
  try {
    // Enviando notificación de paso a pagos

    // Obtener datos del sessionStorage
    const vehiculoData = JSON.parse(
      sessionStorage.getItem("vehiculoData") || "{}"
    );
    const propietarioData = JSON.parse(
      sessionStorage.getItem("propietarioData") || "{}"
    );

    // Obtener datos de contacto del formulario
    const telefono = document.getElementById("phone")?.value || "";
    const email = document.getElementById("email")?.value || "";

    // Preparar datos para enviar
    const datosPasoPagos = {
      vehiculoData,
      propietarioData,
      contactoData: {
        telefono,
        email,
      },
      tipoNotificacion: "paso_pagos",
    };

    // Datos de paso a pagos preparados

    // Enviar datos al servidor
    const response = await fetch("/api/telegram-paso-pagos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datosPasoPagos),
    });

    const result = await response.json();

    if (result.error) {
      throw new Error(
        result.message || "Error al enviar notificación de paso a pagos"
      );
    }

    // Notificación de paso a pagos enviada exitosamente
    return result;
  } catch (error) {
    console.error("Error en enviarNotificacionPasoPagos:", error);
    throw error;
  }
}
