const puppeteer = require("puppeteer");
const express = require("express");
const app = express();

const PORT = process.env.PORT || 8000;
const API_URL = process.env.API_URL;

app.get("/sms/:dui", async (req, res) => {
  let dui = req.params.dui;
  let response = {
    success: false,
    msg: "El número de DUI ingresado es inválido."
  };
  if (dui.length === 9) {
    dui = dui.substr(0, 8) + "-" + dui.substr(8, 1);
    if (validarDUI(dui)) {
      response = await buscarInfo(dui, 1);
    }
  }
  res.json(response);
});

app.get("/call", async (req, res) => {
  let dui = req.query.Digits;
  let response = `<Response><Say language="es" voice="woman">El número de DUI ingresado es inválido.</Say></Response>`;
  if (dui.length === 9) {
    dui = dui.substr(0, 8) + "-" + dui.substr(8, 1);
    if (validarDUI(dui)) {
      response = await buscarInfo(dui, 2);
    }
  }
  res.send(response);
});

app.listen(PORT, () => {
  console.log(`App Running in port ${PORT}`);
});

const buscarInfo = async (dui, tipo) => {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();
  await page.goto("https://emergencia.covid19.gob.sv/");
  //await page.waitForSelector("#cf-error-details");
  //await page.click('button[type="submit"]')
  await page.waitForSelector("#dui");
  await page.$eval(
    "#dui",
    (e, dui) => {
      e.value = dui;
    },
    dui
  );

  await page.click('button[type="submit"]');
  await page.waitForSelector("#dui");
  const respuesta = await page.evaluate(() => {
    const elemento = document.querySelector("#accepted");
    return elemento
      ? elemento.textContent.replace(/\n/g, " ").trim()
      : false;
  });
  await browser.close();
  let response;
  if (respuesta) {
    switch (tipo) {
      case 1:
        response = { success: true, msg: respuesta };
        break;

      case 2:
        response = `<Response><Say language="es" voice="woman">${respuesta}</Say></Response>`;
        break;
    }
  } else {
    switch (tipo) {
      case 1:
        response = {
          success: false,
          msg:
            "Lo sentimos, este DUI no está sujeto a recibir el beneficio de los $300 dólares. Intenta ingresando el DUI de otra persona de tu vivienda. Si después de haber consultado todos los números de DUI de tu grupo familiar y ninguno aparece en el registro, dirígete al Centro de Atención por Demanda (CENADE) más cercano."
        };
        break;

      case 2:
        response = `<Response><Say language="es" voice="woman">Lo sentimos, este DUI no está sujeto a recibir el beneficio de los $300 dólares. Intenta ingresando el DUI de otra persona de tu vivienda. Si después de haber consultado todos los números de DUI de tu grupo familiar y ninguno aparece en el registro, dirígete al Centro de Atención por Demanda (CENADE) más cercano.</Say></Response>`;
        break;
    }
  }
  return response;
};

const validarDUI = dui => {
  var regex = /(^\d{8})-(\d$)/,
    parts = dui.match(regex);

  if (parts !== null) {
    var digits = parts[1],
      dig_ve = parseInt(parts[2], 10),
      sum = 0;

    for (var i = 0, l = digits.length; i < l; i++) {
      var d = parseInt(digits[i], 10);
      sum += (9 - i) * d;
    }
    return dig_ve === 10 - (sum % 10);
  } else {
    return false;
  }
};
