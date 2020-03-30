const puppeteer = require("puppeteer");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8000;

app.get("/:dui", async (req, res) => {
  let dui = req.params.dui;
  let response = { success: false, msg: "DUI invalido" };
  if (dui.length === 9) {
    dui = dui.substr(0, 8) + "-" + dui.substr(8, 1);
    if (validarDUI(dui)) {
      response = await buscarInfo(dui);
    }
  }
  res.json(response);
});

// app.listen(8000);
app.listen(PORT, () => {
  console.log(`App Running in port ${PORT}`);
});

const buscarInfo = async dui => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://covid19-elsalvador.com/");
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
    return elemento ? elemento.textContent.replace(/\n/g, " ").trim() : false;
  });
  await browser.close();
  if (respuesta) {
    return { success: true, msg: respuesta };
  } else {
    return {
      success: false,
      msg:
        "Este DUI no está sujeto a recibir el beneficio de los $300. Intenta ingreso el DUI de otra persona de tu vivienda. Si después de haber consultado todos los números de DUI de tu grupo familiar y ninguno aparece en el registro, dirígete al Centro de Atención por Demanda (CENADE) más cercano"
    };
  }
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
