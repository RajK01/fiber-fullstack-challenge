import fs from "fs";
import path from "path";
import axios from "axios";
import AdmZip from "adm-zip";

// -------------------------------------------------------------
// Script: setup.ts
// Purpose: Downloads the sample dataset ZIP, extracts it,
// loads metadata & tech mappings, merges them into a final
// normalized JSON structure, and writes final.json to /data.
// -------------------------------------------------------------

const DATA_URL = "https://fiber-challenges.s3.us-east-1.amazonaws.com/sample-data.zip";
const DATA_DIR = path.join(process.cwd(), "data");

async function main() {
  // Ensure the /data directory exists for storing downloaded files
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

  const zipPath = path.join(DATA_DIR, "sample-data.zip");

  console.log("⬇️ Downloading...");

  // Download ZIP file as raw bytes
  const res = await axios.get(DATA_URL, { responseType: "arraybuffer" });
  fs.writeFileSync(zipPath, res.data);

  // Extract ZIP contents into /data
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(DATA_DIR, true);

  // -----------------------------------------------------------
  // Utility loader:
  // Handles files that may be UTF-8, UTF-16, or newline-delimited JSON.
  // Normalizes and returns parsed JSON.
  // -----------------------------------------------------------
  const load = (f: string) => {
    let p = path.join(DATA_DIR, f);

    // Some archives place files inside sample-data/ instead
    if (!fs.existsSync(p)) p = path.join(DATA_DIR, "sample-data", f);

    const buf = fs.readFileSync(p);

    // Detect UTF-16 (0xFF 0xFE) or fallback to UTF-8
    const content =
      buf[0] === 0xFF && buf[1] === 0xFE
        ? buf.toString('utf16le')
        : buf.toString('utf8').replace(/\0/g, '');

    try {
      // Attempt direct JSON parsing
      return JSON.parse(content);
    } catch {
      // Fallback: Parse JSON lines (each line is an object)
      return content
        .split('\n')
        .filter(l => l.trim())
        .map(l =>
          JSON.parse(
            l
              .replace(/^[^{\[]+/, '') // Remove leading garbage
              .replace(/[^}\]]+$/, '') // Remove trailing garbage
          )
        );
    }
  };

  // Load all 3 source datasets
  const meta = load("metaData.sample.json");   // Company metadata
  const tech = load("techData.sample.json");   // Technology lists per domain
  const idx = load("techIndex.sample.json");   // Technology → Category mapping

  // -----------------------------------------------------------
  // Build lookup table: { TechName → Category }
  // Example: { "React": "Frontend", "Kafka": "Data" }
  // -----------------------------------------------------------
  const techLookup: any = {};
  idx.forEach((t: any) => {
    techLookup[t.Name] = t.Category;
  });

  // -----------------------------------------------------------
  // Build mapping per domain:
  // { domain → [{ name: techName, category: techCategory }] }
  // -----------------------------------------------------------
  const techByD: any = {};
  tech.forEach((item: any) => {
    techByD[item.D] = (item.T || []).map((t: any) => ({
      name: t.N,
      category: techLookup[t.N] || "Other"
    }));
  });

  // -----------------------------------------------------------
  // Final merged structure per company:
  // domain, company name, country, industry, technology list, count
  // -----------------------------------------------------------
  const final = meta.map((c: any) => ({
    domain: c.D,
    name: c.CN || c.D,
    country: c.CO || "Unknown",
    industry: c.CAT || "Unknown",
    technologies: techByD[c.D] || [],
    totalTechCount: (techByD[c.D] || []).length
  }));

  // Write final processed dataset
  fs.writeFileSync(path.join(DATA_DIR, "final.json"), JSON.stringify(final, null, 2));

  console.log("✅ Ready!");
}

main();