#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const workflowPath = path.join(repoRoot, ".github", "workflows", "static.yml");
const sitemapPath = path.join(repoRoot, "sitemap.xml");

const toPosix = (value) => value.replace(/\\/g, "/");

const tokenizeShellLine = (line) => {
  const tokens = [];
  const pattern = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let match;
  while ((match = pattern.exec(line)) !== null) {
    tokens.push(match[1] ?? match[2] ?? match[3]);
  }
  return tokens;
};

const listFilesRecursive = (directory) => {
  const files = [];

  const walk = (currentDir) => {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    entries.forEach((entry) => {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        files.push(fullPath);
      }
    });
  };

  walk(directory);
  return files;
};

const parseDeployArtifactFiles = (workflowContent) => {
  const included = new Set();
  const warnings = [];
  const cpLines = workflowContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("cp "));

  cpLines.forEach((line) => {
    const tokens = tokenizeShellLine(line);
    if (tokens.length < 3 || tokens[0] !== "cp") {
      return;
    }

    let args = tokens.slice(1);
    let recursive = false;
    args = args.filter((token) => {
      if (token === "-R" || token === "-r") {
        recursive = true;
        return false;
      }
      return true;
    });

    if (args.length < 2) {
      return;
    }

    const destination = args[args.length - 1];
    const sources = args.slice(0, -1);

    if (!destination.startsWith(".pages")) {
      return;
    }

    const destinationRelative = toPosix(destination.replace(/^\.pages\/?/, ""));

    sources.forEach((source) => {
      const sourceAbsolute = path.join(repoRoot, source);

      if (!fs.existsSync(sourceAbsolute)) {
        warnings.push(`Bronbestand niet gevonden in workflow: ${source}`);
        return;
      }

      if (recursive) {
        if (!fs.statSync(sourceAbsolute).isDirectory()) {
          warnings.push(`Workflow gebruikt -R op niet-map: ${source}`);
          return;
        }

        const sourceFiles = listFilesRecursive(sourceAbsolute);
        sourceFiles.forEach((sourceFileAbsolute) => {
          const relativeInSource = toPosix(path.relative(sourceAbsolute, sourceFileAbsolute));
          const outputPath = destinationRelative
            ? toPosix(path.posix.join(destinationRelative, relativeInSource))
            : relativeInSource;
          included.add(outputPath);
        });
      } else {
        const sourceBaseName = toPosix(path.basename(source));
        const outputPath = destinationRelative
          ? toPosix(path.posix.join(destinationRelative, sourceBaseName))
          : sourceBaseName;
        included.add(outputPath);
      }
    });
  });

  return { included, warnings };
};

const collectAttributeValues = (htmlContent) => {
  const values = [];
  const doubleQuotePattern = /(?:src|href|srcset|poster)\s*=\s*"([^"]+)"/gi;
  const singleQuotePattern = /(?:src|href|srcset|poster)\s*=\s*'([^']+)'/gi;

  let match;
  while ((match = doubleQuotePattern.exec(htmlContent)) !== null) {
    values.push(match[1].trim());
  }
  while ((match = singleQuotePattern.exec(htmlContent)) !== null) {
    values.push(match[1].trim());
  }

  return values;
};

const isExternalReference = (reference) => {
  return (
    !reference ||
    reference.startsWith("http://") ||
    reference.startsWith("https://") ||
    reference.startsWith("mailto:") ||
    reference.startsWith("tel:") ||
    reference.startsWith("data:") ||
    reference.startsWith("javascript:") ||
    reference.startsWith("#")
  );
};

const splitAttributeReference = (reference) => {
  if (!reference.includes(",")) {
    return [reference];
  }

  return reference
    .split(",")
    .map((part) => part.trim().split(/\s+/)[0])
    .filter(Boolean);
};

const normalizeReference = (rawReference, sourceHtmlPath) => {
  const clean = rawReference.split("#")[0].split("?")[0];
  if (!clean) {
    return "";
  }

  if (clean.startsWith("/")) {
    return toPosix(clean.slice(1));
  }

  const sourceDir = toPosix(path.posix.dirname(sourceHtmlPath));
  return toPosix(path.posix.normalize(path.posix.join(sourceDir, clean)));
};

const getSitemapHtmlPages = () => {
  if (!fs.existsSync(sitemapPath)) {
    return [];
  }

  const sitemap = fs.readFileSync(sitemapPath, "utf8");
  const locPattern = /<loc>([^<]+)<\/loc>/g;
  const htmlPages = [];
  let match;

  while ((match = locPattern.exec(sitemap)) !== null) {
    const loc = match[1].trim();
    try {
      const url = new URL(loc);
      const pathname = url.pathname.replace(/^\/+/, "");
      if (pathname === "" || pathname.endsWith("/")) {
        htmlPages.push("index.html");
      } else if (pathname.endsWith(".html")) {
        htmlPages.push(path.posix.basename(pathname));
      }
    } catch {
      // Ongeldige URL in sitemap slaan we over.
    }
  }

  return [...new Set(htmlPages)];
};

const getMetaDescriptionContent = (htmlContent) => {
  const metaTagPattern = /<meta\b[^>]*>/gi;
  const attrPattern = /([^\s=]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
  let tagMatch;

  while ((tagMatch = metaTagPattern.exec(htmlContent)) !== null) {
    const tag = tagMatch[0];
    const attributes = {};
    let attrMatch;
    while ((attrMatch = attrPattern.exec(tag)) !== null) {
      const name = attrMatch[1].toLowerCase();
      const value = (attrMatch[3] ?? attrMatch[4] ?? attrMatch[5] ?? "").trim();
      attributes[name] = value;
    }

    if ((attributes.name || "").toLowerCase() === "description") {
      return attributes.content || "";
    }
  }

  return "";
};

const hasCanonicalLink = (htmlContent) =>
  /<link\b[^>]*rel\s*=\s*["']canonical["'][^>]*href\s*=\s*["'][^"']+["'][^>]*>/i.test(
    htmlContent
  );

const getHeadingLevels = (htmlContent) => {
  const levels = [];
  const headingPattern = /<h([1-6])\b/gi;
  let match;
  while ((match = headingPattern.exec(htmlContent)) !== null) {
    levels.push(Number(match[1]));
  }
  return levels;
};

const run = () => {
  const errors = [];

  if (!fs.existsSync(workflowPath)) {
    console.error("Workflowbestand niet gevonden:", workflowPath);
    process.exit(1);
  }

  const workflowContent = fs.readFileSync(workflowPath, "utf8");
  const { included, warnings } = parseDeployArtifactFiles(workflowContent);

  if (warnings.length) {
    warnings.forEach((warning) => {
      errors.push(`Workflow-waarschuwing: ${warning}`);
    });
  }

  const deployedHtmlPages = [...included].filter((item) => item.endsWith(".html")).sort();

  if (deployedHtmlPages.length === 0) {
    errors.push("Geen HTML-pagina's gedetecteerd in deploy-artefact.");
  }

  const missingLocalFiles = [];
  const missingArtifactFiles = [];

  deployedHtmlPages.forEach((htmlPage) => {
    const htmlAbsolutePath = path.join(repoRoot, htmlPage);

    if (!fs.existsSync(htmlAbsolutePath)) {
      errors.push(`Gedeployde pagina ontbreekt in repo: ${htmlPage}`);
      return;
    }

    const htmlContent = fs.readFileSync(htmlAbsolutePath, "utf8");
    const references = collectAttributeValues(htmlContent);

    if (!/<title>\s*[^<]+<\/title>/i.test(htmlContent)) {
      errors.push(`Ontbrekende of lege <title> in ${htmlPage}`);
    }

    const metaDescription = getMetaDescriptionContent(htmlContent);
    if (!metaDescription) {
      errors.push(`Ontbrekende of lege meta description in ${htmlPage}`);
    }

    if ((htmlPage === "index.html" || htmlPage === "projecten.html") && !hasCanonicalLink(htmlContent)) {
      errors.push(`Ontbrekende canonical link in ${htmlPage}`);
    }

    const headingLevels = getHeadingLevels(htmlContent);
    if (!headingLevels.length) {
      errors.push(`Geen headings gevonden in ${htmlPage}`);
    } else {
      if (headingLevels[0] !== 1) {
        errors.push(`Eerste heading moet <h1> zijn in ${htmlPage}, gevonden: <h${headingLevels[0]}>`);
      }

      for (let i = 1; i < headingLevels.length; i += 1) {
        const previous = headingLevels[i - 1];
        const current = headingLevels[i];
        if (current - previous > 1) {
          errors.push(
            `Onlogische heading-sprong in ${htmlPage}: <h${previous}> gevolgd door <h${current}>`
          );
          break;
        }
      }
    }

    references.forEach((reference) => {
      if (isExternalReference(reference)) {
        return;
      }

      const variants = splitAttributeReference(reference);
      variants.forEach((variant) => {
        const resolved = normalizeReference(variant, htmlPage);
        if (!resolved || resolved.startsWith("../")) {
          return;
        }

        const absoluteResolved = path.join(repoRoot, resolved);
        if (!fs.existsSync(absoluteResolved)) {
          missingLocalFiles.push(`${htmlPage} -> ${resolved}`);
        }

        if (!included.has(resolved)) {
          missingArtifactFiles.push(`${htmlPage} -> ${resolved}`);
        }
      });
    });

    const h1Count = (htmlContent.match(/<h1\b/gi) || []).length;
    if (h1Count !== 1) {
      errors.push(`${htmlPage} moet exact 1 <h1> bevatten, gevonden: ${h1Count}`);
    }
  });

  const sitemapPages = getSitemapHtmlPages();
  sitemapPages.forEach((page) => {
    if (!included.has(page)) {
      errors.push(`Pagina uit sitemap ontbreekt in deploy-artefact: ${page}`);
    }
  });

  const uniqueMissingLocal = [...new Set(missingLocalFiles)];
  const uniqueMissingArtifact = [...new Set(missingArtifactFiles)];

  uniqueMissingLocal.forEach((entry) => {
    errors.push(`Ontbrekend lokaal bestand: ${entry}`);
  });
  uniqueMissingArtifact.forEach((entry) => {
    errors.push(`Niet opgenomen in deploy-artefact: ${entry}`);
  });

  if (errors.length) {
    console.error("❌ Site-validatie mislukt:");
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  const referencesChecked = deployedHtmlPages.length;
  console.log("✅ Site-validatie geslaagd.");
  console.log(`- Gedeployde HTML-pagina's gecontroleerd: ${referencesChecked}`);
  console.log(`- Totaal bestanden in artefact (simulatie): ${included.size}`);
  console.log(`- Sitemap-pagina's gevalideerd: ${sitemapPages.length}`);
};

run();
