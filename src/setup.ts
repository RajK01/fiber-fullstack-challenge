import fs from "fs";
import path from "path";
import axios from "axios";
import AdmZip from "adm-zip";

const DATA_URL = "https://fiber-challenges.s3.us-east-1.amazonaws.com/sample-data.zip";
const DATA_DIR = path.join(process.cwd(), "data");

async function main() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
  const zipPath = path.join(DATA_DIR, "sample-data.zip");

  console.log("⬇️ Downloading...");
  const res = await axios.get(DATA_URL, { responseType: "arraybuffer" });
  fs.writeFileSync(zipPath, res.data);

  const zip = new AdmZip(zipPath);
  zip.extractAllTo(DATA_DIR, true);

  const load = (f: string) => {
    let p = path.join(DATA_DIR, f);
    if (!fs.existsSync(p)) p = path.join(DATA_DIR, "sample-data", f);
    const buf = fs.readFileSync(p);
    const content = buf[0] === 0xFF && buf[1] === 0xFE ? buf.toString('utf16le') : buf.toString('utf8').replace(/\0/g, '');
    try { return JSON.parse(content); } catch {
      return content.split('\n').filter(l => l.trim()).map(l => JSON.parse(l.replace(/^[^{\[]+/, '').replace(/[^}\]]+$/, '')));
    }
  };

  const meta = load("metaData.sample.json");
  const tech = load("techData.sample.json");
  const idx = load("techIndex.sample.json");

  const techLookup: any = {};
  idx.forEach((t: any) => { techLookup[t.Name] = t.Category; });

  const techByD: any = {};
  tech.forEach((item: any) => {
    techByD[item.D] = (item.T || []).map((t: any) => ({ name: t.N, category: techLookup[t.N] || "Other" }));
  });

  const final = meta.map((c: any) => ({
    domain: c.D,
    name: c.CN || c.D,
    country: c.CO || "Unknown",
    industry: c.CAT || "Unknown",
    technologies: techByD[c.D] || [],
    totalTechCount: (techByD[c.D] || []).length
  }));

  fs.writeFileSync(path.join(DATA_DIR, "final.json"), JSON.stringify(final, null, 2));
  console.log("✅ Ready!");
}
main();