import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const filters = await req.json();
    
    // 1. Load the pre-joined data
    const filePath = path.join(process.cwd(), 'data', 'final.json');
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "Data not initialized. Run the setup script first." }, 
        { status: 500 }
      );
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    let companies = JSON.parse(fileContent);

    // 2. Apply Filtering Logic
    const filteredResults = companies.filter((company: any) => {
      
      // Country Filter
      if (filters.countries?.length > 0) {
        if (!filters.countries.includes(company.country)) return false;
      }

      // Industry Filter
      if (filters.industries?.length > 0) {
        if (!filters.industries.includes(company.industry)) return false;
      }

      // Prepare tech names for easy comparison
      const companyTechNames = company.technologies.map((t: any) => t.name);

      // Technology Include Filter (AND / OR Logic)
      if (filters.includeTech?.length > 0) {
        if (filters.techOperator === 'AND') {
          const hasAll = filters.includeTech.every((tech: string) => 
            companyTechNames.includes(tech)
          );
          if (!hasAll) return false;
        } else {
          const hasAny = filters.includeTech.some((tech: string) => 
            companyTechNames.includes(tech)
          );
          if (!hasAny) return false;
        }
      }

      // Technology Exclude Filter
      if (filters.excludeTech?.length > 0) {
        const hasExcluded = filters.excludeTech.some((tech: string) => 
          companyTechNames.includes(tech)
        );
        if (hasExcluded) return false;
      }

      // Minimum Technology Count Filter
      if (filters.minTechCount !== undefined) {
        if (company.totalTechCount < filters.minTechCount) return false;
      }

      return true;
    });

    // 3. Pagination Logic
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const startIndex = (page - 1) * limit;
    const paginatedResults = filteredResults.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      results: paginatedResults,
      total: filteredResults.length,
      page,
      totalPages: Math.ceil(filteredResults.length / limit)
    });

  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}