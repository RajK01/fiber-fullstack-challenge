"use client";

import { useState, useEffect } from "react";
import { Search, Globe, Building2, Cpu, Filter, X, ChevronDown, Download, Hash } from "lucide-react";

export default function Home() {
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Search State
  const [includeTech, setIncludeTech] = useState<string[]>([]);
  const [techInput, setTechInput] = useState("");
  const [techOperator, setTechOperator] = useState("OR");
  const [country, setCountry] = useState("");
  
  // NEW: Stats Filtering (Missing in previous version)
  const [minTech, setMinTech] = useState<number | "">("");
  const [industry, setIndustry] = useState("");

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
          industry: industry || undefined,
          minTechCount: minTech || undefined,
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
    const headers = ["Company Name", "Domain", "Industry", "Country", "Tech Count"];
    const rows = results.map((c: any) => [
      `"${c.name}"`, 
      c.domain, 
      `"${c.industry}"`, 
      c.country, 
      c.totalTechCount
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    triggerDownload(csvContent, "fiber_results.csv", "text/csv");
  };

  const downloadJSON = () => {
    if (results.length === 0) return;
    triggerDownload(JSON.stringify(results, null, 2), "fiber_results.json", "application/json");
  };

  const triggerDownload = (content: string, fileName: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* SIDEBAR */}
      <aside className="w-80 bg-white border-r border-slate-200 p-6 flex flex-col gap-6 overflow-y-auto shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-blue-200 shadow-lg">
            <Search size={18} strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">Fiber AI</h1>
        </div>

        <div className="space-y-6">
          {/* Section: Technology Filter */}
          <div className="space-y-3">
            <label className="text-[12px] uppercase tracking-wider font-bold text-slate-500 flex items-center gap-2">
              <Cpu size={14} /> Technologies
            </label>
            <form onSubmit={addTech} className="relative">
              <input
                type="text"
                placeholder="Search tech (e.g. React)"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
              />
              <button type="submit" className="absolute right-2 top-1.5 bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-bold hover:bg-slate-200">
                Add
              </button>
            </form>

            <div className="flex flex-wrap gap-1.5">
              {includeTech.map((t) => (
                <span key={t} className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 border border-blue-100">
                  {t} <X size={12} className="cursor-pointer hover:text-blue-900" onClick={() => removeTech(t)} />
                </span>
              ))}
            </div>

            <select 
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
              value={techOperator}
              onChange={(e) => setTechOperator(e.target.value)}
            >
              <option value="OR">Match ANY (OR)</option>
              <option value="AND">Match ALL (AND)</option>
              <option value="NOT">Exclude These (NOT)</option>
            </select>
          </div>

          {/* Section: Firmographics */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <label className="text-[12px] uppercase tracking-wider font-bold text-slate-500 flex items-center gap-2">
              <Building2 size={14} /> Company Filters
            </label>
            
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-600">Location (Country Code)</span>
              <div className="relative">
                <Globe size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="US, UK, IN..."
                  className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={country}
                  onChange={(e) => setCountry(e.target.value.toUpperCase())}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-600">Min. Technologies Used</span>
              <div className="relative">
                <Hash size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="number"
                  placeholder="e.g. 5"
                  className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={minTech}
                  onChange={(e) => setMinTech(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={fetchResults}
          disabled={loading}
          className="mt-auto w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
        >
          {loading ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search size={18} />}
          Search Companies
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-semibold text-slate-600">Search Results</h2>
            <div className="h-4 w-[1px] bg-slate-200" />
            <p className="text-sm text-slate-400">
              Found <span className="text-slate-900 font-bold">{total}</span> total
            </p>
          </div>
          
          <div className="flex gap-2">
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button 
                onClick={downloadCSV}
                disabled={results.length === 0}
                className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all disabled:opacity-50"
              >
                <Download size={14} /> CSV
              </button>
              <button 
                onClick={downloadJSON}
                disabled={results.length === 0}
                className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all disabled:opacity-50"
              >
                <Cpu size={14} /> JSON
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 bg-slate-50/50">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Company</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Industry</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Location</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tech Stack</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((company: any) => (
                  <tr key={company.domain} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{company.name}</div>
                      <div className="text-xs font-medium text-slate-400">{company.domain}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">{company.industry}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold">{company.country}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {company.technologies?.slice(0, 4).map((t: any) => (
                          <span key={t.name} className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase shadow-sm">
                            {t.name}
                          </span>
                        ))}
                        {company.technologies?.length > 4 && (
                          <span className="text-[10px] text-blue-600 font-black self-center bg-blue-50 px-1.5 py-0.5 rounded">
                            +{company.technologies.length - 4}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {results.length === 0 && !loading && (
              <div className="p-24 text-center">
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search size={24} className="text-slate-300" />
                </div>
                <h3 className="text-slate-900 font-bold">No results found</h3>
                <p className="text-slate-500 text-sm mt-1">Try adjusting your filters or search terms.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}