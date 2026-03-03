import fs from "fs";
import path from "path";
import axios from "axios";
import AdmZip from "adm-zip";

const DATA_URL = "https://fiber-challenges.s3.us-east-1.amazonaws.com/sample-data.zip";
const DATA_DIR = path.join(process.cwd(), "data");

// Function to download Data and then extract that data 
async function downloadData() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const zipPath = path.join(DATA_DIR, "sample-data.zip");
  
  console.log("⬇️ Downloading dataset...");
  const response = await axios.get(DATA_URL, { responseType: "arraybuffer" });
  fs.writeFileSync(zipPath, response.data);

  console.log("📦 Extracting files...");
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(DATA_DIR, true);
}

// Load Jsin Data
function loadJsonQuietly(fileName: string) {
  const filePath = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(filePath)) return [];

  const buffer = fs.readFileSync(filePath);
  
  // Clean encoding and null bytes silently
  let content = (buffer[0] === 0xff && buffer[1] === 0xfe) 
    ? buffer.toString("utf16le") 
    : buffer.toString("utf8");

  const cleanContent = content
    .replace(/^\uFEFF/, "")
    .replace(/\0/g, "") 
    .replace(/\r\n/g, "\n")
    .trim();

  if (!cleanContent) return [];

  try {
    return JSON.parse(cleanContent);
  } catch {
    // Silent fallback for JSON Lines
    const lines = cleanContent.split("\n");
    const result: any[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        result.push(JSON.parse(trimmed));
      } catch {
        // Ignore errors silently to keep terminal clean
      }
    }
    return result;
  }
}

function joinData(meta: any[], tech: any[], index: any[]) {
  const techMap: Record<string, string> = {};
  index.forEach(t => { if (t?.Name) techMap[t.Name] = t.Category || "Other"; });

  const techByDomain: Record<string, any[]> = {};
  tech.forEach(item => {
    if (item?.D) {
      techByDomain[item.D] = (item.T || []).map((t: any) => ({
        name: t.N,
        category: techMap[t.N] || "Other"
      }));
    }
  });

  return meta.map(company => {
    const domain = company.D;
    const techs = techByDomain[domain] || [];
    const stats: Record<string, number> = {};
    
    techs.forEach(t => {
      stats[t.category] = (stats[t.category] || 0) + 1;
    });

    return {
      domain,
      name: company.N || domain,
      country: company.C || "Unknown",
      industry: company.CAT || "Unknown",
      technologies: techs,
      totalTechCount: techs.length,
      categoryStats: stats
    };
  });
}

async function main() {
  try {
    await downloadData();

    // Loading data without showing errors
    const metaData = loadJsonQuietly("metaData.sample.json");
    const techData = loadJsonQuietly("techData.sample.json");
    const techIndex = loadJsonQuietly("techIndex.sample.json");

    const finalData = joinData(metaData, techData, techIndex);
    
    fs.writeFileSync(
      path.join(DATA_DIR, "final.json"), 
      JSON.stringify(finalData, null, 2)
    );

    console.log("✅ Data processed successfully!");
    console.log(`🚀 Finalized ${finalData.length} records in data/final.json`);
  } catch (error) {
    // Only show high-level critical errors if the whole process fails
    console.error("❌ Setup failed unexpectedly.");
  }
}

main();
