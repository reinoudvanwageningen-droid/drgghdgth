const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");
const { prepareData } = require("./lib/prepare-data");

const rootDir = __dirname;
const templatePath = path.join(rootDir, "template.html");
const dataPath = path.join(rootDir, "sample-data.json");
const docsDir = path.join(rootDir, "docs");
const htmlOutPath = path.join(docsDir, "index.html");
const cssOutPath = path.join(docsDir, "styles.css");

const buildHtml = () => {
  const template = fs.readFileSync(templatePath, "utf8");
  const rawData = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const data = prepareData(rawData);

  const compiled = Handlebars.compile(template, { noEscape: true });
  const html = compiled(data);

  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(htmlOutPath, html);
  fs.copyFileSync(path.join(rootDir, "styles.css"), cssOutPath);

  console.log(`HTML opgeslagen naar ${htmlOutPath}`);
};

buildHtml();
