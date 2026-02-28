"use client";

import { useState, useEffect } from "react";
import { Search, Globe, Building2, Cpu, Filter, X } from "lucide-react";

export default function Home() {
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Search State
  const [includeTech, setIncludeTech] = useState<string[]>([]);
  const [techInput, setTechInput] = useState("");
  const [techOperator, setTechOperator] = useState("OR");
  const [country, setCountry] = useState("");

  const fetchResults = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          includeTech,
          techOperator,
          countries: country ? [country] : [],
          limit: 50,
        }),
      });
      const data = await response.json();
      setResults(data.results || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchResults();
  }, []);

  const addTech = (e: React.FormEvent) => {
    e.preventDefault();
    if (techInput && !includeTech.includes(techInput)) {
      setIncludeTech([...includeTech, techInput]);
      setTechInput("");
    }
  };

  const removeTech = (name: string) => {
    setIncludeTech(includeTech.filter((t) => t !== name));
  };

  const downloadCSV = () => {
    if (results.length === 0) return;

    // Define the headers
    const headers = ["Company Name", "Domain", "Industry", "Country", "Tech Count"];
    
    // Map the results to rows
    const rows = results.map(c => [
      `"${c.name}"`, 
      c.domain, 
      `"${c.industry}"`, 
      c.country, 
      c.totalTechCount
    ]);

    // Combine headers and rows
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");

    // Create a blob and download it
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "fiber_search_results.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-screen bg-gray-50 text-slate-900">
      {/* SIDEBAR */}
      <aside className="w-80 bg-white border-r p-6 flex flex-col gap-6 overflow-y-auto">
        <div className="flex items-center gap-2 mb-2">
          <div className="bg-blue-600 p-1.5 rounded-lg text-white">
            <Search size={20} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Fiber AI Search</h1>
        </div>

        <hr />

        {/* Tech Filter */}
        <div>
          <label className="text-sm font-semibold flex items-center gap-2 mb-3">
            <Cpu size={16} /> Technologies
          </label>
          <form onSubmit={addTech} className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="e.g. Shopify"
              className="flex-1 border rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
            />
            <button type="submit" className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700">
              Add
            </button>
          </form>

          <div className="flex flex-wrap gap-2 mb-3">
            {includeTech.map((t) => (
              <span key={t} className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                {t} <X size={12} className="cursor-pointer" onClick={() => removeTech(t)} />
              </span>
            ))}
          </div>

          <select 
            className="w-full border rounded-md px-3 py-1.5 text-sm"
            value={techOperator}
            onChange={(e) => setTechOperator(e.target.value)}
          >
            <option value="OR">Match ANY (OR)</option>
            <option value="AND">Match ALL (AND)</option>
          </select>
        </div>

        {/* Country Filter */}
        <div>
          <label className="text-sm font-semibold flex items-center gap-2 mb-2">
            <Globe size={16} /> Country Code
          </label>
          <input
            type="text"
            placeholder="e.g. US, UK, IN"
            className="w-full border rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={country}
            onChange={(e) => setCountry(e.target.value.toUpperCase())}
          />
        </div>

        <button 
          onClick={fetchResults}
          disabled={loading}
          className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-semibold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
        >
          {loading ? "Searching..." : "Search Companies"}
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b px-8 flex items-center justify-between">
          <p className="text-sm text-slate-500 font-medium">
            Showing <span className="text-slate-900 font-bold">{results.length}</span> of {total} companies
          </p>
          
          {/* Add this button here */}
          <button 
            onClick={downloadCSV}
            disabled={results.length === 0}
            className="flex items-center gap-2 text-sm font-semibold bg-white border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            <Filter size={16} className="rotate-180" /> {/* Using filter icon as a sort of export symbol */}
            Export CSV
          </button>
      </header>

        <div className="flex-1 overflow-auto p-8">
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Company</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Industry</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Location</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Tech Stack</th>
                </tr>
              </thead>
              <tbody>
                {results.map((company: any) => (
                  <tr key={company.domain} className="border-b hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{company.name}</div>
                      <div className="text-xs text-blue-600">{company.domain}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{company.industry}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{company.country}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {company.technologies && company.technologies.length > 0 ? (
                          <>
                            {company.technologies.slice(0, 3).map((t: any) => (
                              <span key={t.name} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                                {t.name}
                              </span>
                            ))}
                            {company.technologies.length > 3 && (
                              <span className="text-[10px] text-slate-400 font-bold self-center">
                                +{company.technologies.length - 3} more
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400 text-xs italic">No tech data</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {results.length === 0 && !loading && (
              <div className="p-20 text-center text-slate-400">
                No companies found matching your criteria.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}