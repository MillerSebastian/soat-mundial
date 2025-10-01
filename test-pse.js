const http = require("http");

function post(path, body) {
  const data = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "localhost",
        port: process.env.PORT || 3000,
        path,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(raw) });
          } catch (e) {
            resolve({ status: res.statusCode, body: raw });
          }
        });
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  try {
    const resumenData = {
      soat: "$100,000",
      tercero: "$20,000",
      accidente: "$0",
    };
    const segurosEliminados = { tercero: false, accidente: true };
    const expected = 100000 + 20000 + 0;

    const payload = {
      bank: "Bancolombia",
      accountType: "ahorros",
      email: "test@ejemplo.com",
      phone: "3001234567",
      amount: expected,
      resumenData,
      segurosEliminados,
      displayTotal: expected,
    };
    const res = await post("/api/payment/pse", payload);
    console.log("/api/payment/pse:", res.status, res.body);

    if (res.status !== 200 || !res.body || !res.body.success) {
      throw new Error("Pago PSE no exitoso");
    }

    console.log("OK: Pago PSE funcionando (monto validado)");
    process.exit(0);
  } catch (e) {
    console.error("Fallo prueba de PSE:", e.message);
    process.exit(1);
  }
})(); 