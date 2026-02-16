const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");
const { chromium } = require("playwright");
const { prepareData } = require("./lib/prepare-data");

const rootDir = __dirname;
const templatePath = path.join(rootDir, "template.html");
const dataPath = path.join(rootDir, "sample-data.json");
const outDir = path.join(rootDir, "out");
const htmlOutPath = path.join(outDir, "factuur.html");
const pdfOutPath = path.join(outDir, "factuur.pdf");

const renderTemplate = async () => {
  const template = fs.readFileSync(templatePath, "utf8");
  const rawData = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const data = prepareData(rawData);

  const compiled = Handlebars.compile(template, { noEscape: true });
  const html = compiled(data);

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(htmlOutPath, html);

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(`file://${htmlOutPath}`, { waitUntil: "networkidle" });
  await page.pdf({
    path: pdfOutPath,
    format: "A4",
    margin: {
      top: "0mm",
      bottom: "0mm",
      left: "0mm",
      right: "0mm"
    },
    printBackground: true
  });

  await browser.close();

  console.log(`PDF opgeslagen naar ${pdfOutPath}`);
};

renderTemplate().catch((error) => {
  console.error(error);
  process.exit(1);
});
