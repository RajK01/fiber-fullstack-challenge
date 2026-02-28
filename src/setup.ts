import fs from "fs";
import path from "path";
import axios from "axios";
import AdmZip from "adm-zip";

const DATA_URL = "https://fiber-challenges.s3.us-east-1.amazonaws.com/sample-data.zip";
const DATA_DIR = path.join(process.cwd(), "data");

async function downloadAndExtract() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
  }

  const zipPath = path.join(DATA_DIR, "sample-data.zip");

  console.log("⬇️ Downloading dataset...");
  const response = await axios.get(DATA_URL, { responseType: "arraybuffer" });
  fs.writeFileSync(zipPath, response.data);

  console.log("📦 Extracting ZIP...");
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(DATA_DIR, true);

  // Small delay to ensure Windows file system handles the new files
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log("✅ Extraction complete.");
}

function loadJson(fileName: string) {
  let filePath = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(DATA_DIR, "sample-data", fileName);
  }

  const buffer = fs.readFileSync(filePath);
  
  let content: string;
  // Handle UTF-16 LE (Common in BuiltWith exports)
  if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
    content = buffer.toString('utf16le');
  } else {
    content = buffer.toString('utf8').replace(/\0/g, '');
  }

  const cleanContent = content.trim().replace(/^\uFEFF/, '');
  
  try {
    // Try standard JSON parse (for techIndex which is a standard array)
    return JSON.parse(cleanContent);
  } catch (e) {
    // Handle JSONL (Line-by-line) for metaData and techData
    const lines = cleanContent.split(/\r?\n/);
    const results = [];
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      if (!line) continue;
      
      line = line.replace(/^[^{\[>]+/, '').replace(/[^}\]]+$/, '');

      try {
        if (line) results.push(JSON.parse(line));
      } catch {
        const match = line.match(/\{.*\}/);
        if (match) {
            try { results.push(JSON.parse(match[0])); } catch { continue; }
        }
      }
    }
    return results;
  }
}

async function main() {
  try {
    await downloadAndExtract();

    console.log("📊 Loading JSON files...");
    const metaData = loadJson("metaData.sample.json");
    const techData = loadJson("techData.sample.json");
    const techIndex = loadJson("techIndex.sample.json");

    console.log(`✅ Files Loaded: Meta(${metaData.length}), TechData(${techData.length}), Index(${techIndex.length})`);

    // --- JOINING LOGIC ---
    console.log("🔗 Joining datasets...");
    
    // Create a lookup for Technology Categories
    const techLookup: Record<string, any> = {};
    techIndex.forEach((t: any) => { 
      if (t.Name) techLookup[t.Name] = t; 
    });

    // Create a lookup for Domain Technologies
    const techByDomain: Record<string, any> = {};
    techData.forEach((item: any) => {
      techByDomain[item.D] = (item.T || []).map((t: any) => ({
        name: t.N,
        category: techLookup[t.N]?.Category || "Other"
      }));
    });

    // Merge everything into the Final Record
    const finalData = metaData.map((company: any) => {
      const techs = techByDomain[company.D] || [];
      
      // Calculate stats per company
      const catStats: Record<string, number> = {};
      techs.forEach((t: any) => {
        catStats[t.category] = (catStats[t.category] || 0) + 1;
      });

      return {
        domain: company.D,
        name: company.CN || company.D, // Fallback to domain if name is missing
        country: company.CO || "Unknown",
        industry: company.CAT || "Unknown",
        technologies: techs,
        totalTechCount: techs.length,
        categoryStats: catStats
      };
    });

    const outPath = path.join(DATA_DIR, "final.json");
    fs.writeFileSync(outPath, JSON.stringify(finalData, null, 2));
    console.log(`\n💾 SUCCESS! Created: ${outPath}`);
    console.log(`🚀 Total companies processed: ${finalData.length}`);

  } catch (error: any) {
    console.error("Setup Error:", error.message);
  }
}

main();