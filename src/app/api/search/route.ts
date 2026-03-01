import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const filePath = path.join(process.cwd(), 'data', 'final.json');
  if (!fs.existsSync(filePath)) return NextResponse.json([]);
  
  const companies = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  // Extract all unique tech names from the data automatically
  const allTechs = companies.flatMap((c: any) => c.technologies.map((t: any) => t.name));
  const uniqueTechs = Array.from(new Set(allTechs)).sort();
  
  return NextResponse.json(uniqueTechs);
}

export async function POST(req: Request) {
  try {
    const filters = await req.json();
    const filePath = path.join(process.cwd(), 'data', 'final.json');
    if (!fs.existsSync(filePath)) return NextResponse.json({ error: "No Data" }, { status: 500 });

    const companies = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const filtered = companies.filter((c: any) => {
      // 1. Country (Case-Insensitive)
      if (filters.countries?.length > 0) {
        if (!filters.countries.some((code: string) => code.toUpperCase() === c.country.toUpperCase())) return false;
      }

      // 2. Tech Logic (Case-Insensitive)
      const cTechs = c.technologies.map((t: any) => t.name.toLowerCase().trim());
      const sTechs = (filters.includeTech || []).map((t: string) => t.toLowerCase().trim());

      if (sTechs.length > 0) {
        const op = filters.techOperator || 'OR';
        if (op === 'AND' && !sTechs.every(t => cTechs.includes(t))) return false;
        if (op === 'OR' && !sTechs.some(t => cTechs.includes(t))) return false;
        if (op === 'NOT' && sTechs.some(t => cTechs.includes(t))) return false;
      }

      // 3. Min Count
      if (filters.minTechCount && c.totalTechCount < Number(filters.minTechCount)) return false;

      return true;
    });

    return NextResponse.json({ results: filtered.slice(0, 50), total: filtered.length });
  } catch (e) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}