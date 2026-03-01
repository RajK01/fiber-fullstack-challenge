"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Globe,
  Cpu,
  X,
  Download,
  LayoutGrid,
  Building2,
  ChevronDown,
  Loader2,
} from "lucide-react";
import debounce from "lodash/debounce";

import rawData from "../../data/final.json";

export default function Home() {
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [includeTech, setIncludeTech] = useState<string[]>([]);
  const [techOperator, setTechOperator] = useState("OR");
  const [country, setCountry] = useState("");
  const [minTech, setMinTech] = useState<number | "">("");

  const { availableTechs, availableCountries } = useMemo(() => {
    const techs = new Set<string>();
    const countries = new Set<string>();

    (rawData as any[]).forEach((item) => {
      if (item.country && item.country !== "Unknown") {
        countries.add(item.country.toUpperCase());
      }
      item.technologies?.forEach((t: any) => {
        if (t.name) techs.add(t.name);
      });
    });

    return {
      availableTechs: Array.from(techs).sort(),
      availableCountries: Array.from(countries).sort(),
    };
  }, []);

  const fetchResults = async () => {
    if (Number(minTech) < 0) return;

    setLoading(true);
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          includeTech,
          techOperator,
          countries: country ? [country] : [],
          minTechCount: minTech || 0,
          limit: 100,
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

  const debouncedSearch = useCallback(
    debounce(() => fetchResults(), 500),
    [includeTech, techOperator, country, minTech]
  );

  useEffect(() => {
    debouncedSearch();
    return () => debouncedSearch.cancel();
  }, [includeTech, techOperator, country, minTech, debouncedSearch]);

  const toggleTech = (tech: string) => {
    if (!tech) return;
    if (!includeTech.includes(tech)) {
      setIncludeTech([...includeTech, tech]);
    }
  };

  const removeTech = (name: string) => {
    setIncludeTech(includeTech.filter((t) => t !== name));
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(results, null, 2)], {
      type: "application/json",
    });
    triggerDownload(blob, `fiber_export_${Date.now()}.json`);
  };

  const downloadCSV = () => {
    if (results.length === 0) return;
    const headers = [
      "Company Name",
      "Domain",
      "Country",
      "Industry",
      "Total Techs",
      "Tech Stack",
    ];
    const rows = results.map((c: any) => [
      `"${c.name}"`,
      c.domain,
      c.country,
      `"${c.industry}"`,
      c.totalTechCount,
      `"${c.technologies?.map((t: any) => t.name).join("; ") || ""}"`,
    ]);
    const csvString = [headers, ...rows]
      .map((e) => e.join(","))
      .join("\n");
    const blob = new Blob([csvString], {
      type: "text/csv;charset=utf-8;",
    });
    triggerDownload(blob, `fiber_export_${Date.now()}.csv`);
  };

  const triggerDownload = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-violet-50 text-slate-900 font-sans">
      <aside className="w-80 backdrop-blur-xl bg-white/60 border-r border-rose-200 p-6 rounded-r-3xl shadow-2xl flex flex-col gap-8 overflow-y-auto">

        {/* HEADER */}
        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2">
          <div className="bg-gradient-to-tr from-rose-500 to-pink-500 p-2.5 rounded-xl text-white shadow-xl shadow-rose-300/40">
            <Search size={22} strokeWidth={3} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-800 italic">
              FIBER<span className="text-rose-600">AI</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Prospecting Engine
            </p>
          </div>
        </div>

        {/* SEARCH FILTERS */}
        <div className="space-y-6 animate-in fade-in slide-in-from-left-3 duration-700">
          {/* TECHNOLOGY */}
          <section className="space-y-3">
            <label className="text-[11px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
              <Cpu size={14} className="text-rose-500" /> Technology
            </label>

            <div className="relative">
              <select
                className="w-full bg-white/70 border border-rose-200 rounded-xl px-4 py-3 text-sm outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-rose-300/40"
                onChange={(e) => toggleTech(e.target.value)}
                value=""
              >
                <option value="">Select Technology…</option>
                {availableTechs.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-4 top-3.5 text-rose-300"
                size={16}
              />
            </div>

            {/* SELECTED TAGS */}
            <div className="flex flex-wrap gap-2 min-h-[20px]">
              {includeTech.map((t) => (
                <span
                  key={t}
                  className="bg-pink-600 text-white pl-3 pr-2 py-1.5 rounded-lg text-xs 
                  font-bold flex items-center gap-2 shadow-md shadow-pink-300/40
                  hover:shadow-pink-500/50 transition-all"
                >
                  {t}{" "}
                  <X
                    size={14}
                    className="cursor-pointer hover:bg-white/20 rounded-full"
                    onClick={() => removeTech(t)}
                  />
                </span>
              ))}
            </div>

            {/* OPERATOR */}
            <div className="bg-white/70 p-1 rounded-xl flex gap-1 border border-rose-200 shadow-inner">
              {["OR", "AND", "NOT"].map((op) => (
                <button
                  key={op}
                  onClick={() => setTechOperator(op)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                    techOperator === op
                      ? "bg-pink-500 text-white shadow-md"
                      : "text-rose-500"
                  }`}
                >
                  {op}
                </button>
              ))}
            </div>
          </section>

          {/* COUNTRY + MIN TECH */}
          <section className="space-y-4 pt-6 border-t border-rose-200/50">
            <label className="text-[11px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
              <LayoutGrid size={14} /> Firmographics
            </label>

            {/* COUNTRY */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-600 ml-1">
                Country
              </span>
              <div className="relative">
                <select
                  className="w-full bg-white/70 border border-rose-200 rounded-xl px-4 py-2.5 text-sm outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-rose-300/40"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                >
                  <option value="">All Countries</option>
                  {availableCountries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-4 top-3 text-rose-300"
                />
              </div>
            </div>

            {/* MIN TECH */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-600 ml-1">
                Min Tech Count
              </span>
              <input
                type="number"
                placeholder="0"
                className={`w-full bg-white/70 border rounded-xl px-4 py-2.5 text-sm outline-none transition-all 
                  ${
                    Number(minTech) < 0
                      ? "border-red-500 focus:ring-red-500/20"
                      : "border-rose-200 focus:ring-rose-300/40 focus:border-pink-500"
                  }`}
                value={minTech}
                onChange={(e) =>
                  setMinTech(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
              {Number(minTech) < 0 && (
                <p className="text-[10px] font-bold text-red-500 ml-1 animate-pulse">
                  ⚠️ Min tech count cannot be less than 0
                </p>
              )}
            </div>
          </section>
        </div>

        {loading && (
          <div className="mt-auto flex items-center gap-2 text-pink-600 font-bold text-[11px] animate-pulse bg-pink-50 p-3 rounded-xl border border-pink-100 shadow-sm">
            <Loader2 size={14} className="animate-spin" /> Analyzing Lovable
            Companies…
          </div>
        )}
      </aside>

      {/* MAIN TABLE SECTION */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-gradient-to-r from-pink-100 to-rose-100 border-b border-rose-200 px-10 flex items-center justify-between shadow-lg">
          <div>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">
              Active Prospects
            </h2>
            <p className="text-xs text-slate-500 font-medium tracking-wide">
              Showing{" "}
              <span className="text-pink-600 font-bold">
                {results.length}
              </span>{" "}
              of {total} verified companies
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={downloadJSON}
              className="flex items-center gap-2 text-xs font-bold text-pink-700 bg-white border border-pink-300 px-5 py-2.5 rounded-xl shadow-sm hover:bg-pink-50 transition-all"
            >
              <Download size={14} /> JSON
            </button>

            <button
              onClick={downloadCSV}
              className="flex items-center gap-2 text-xs font-bold text-white bg-pink-500 px-5 py-2.5 rounded-xl shadow-lg hover:bg-pink-600 active:scale-95 transition-all"
            >
              <Download size={14} /> CSV Export
            </button>
          </div>
        </header>

        {/* TABLE */}
        <div className="flex-1 overflow-auto p-10">
          <div className="bg-white/80 backdrop-blur-xl border border-rose-200 rounded-[24px] shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-rose-50/60 border-b border-rose-200/70">
                  <th className="px-8 py-5 text-[10px] font-black text-rose-500 uppercase tracking-widest">
                    Company
                  </th>
                  <th className="px-8 py-5 text-[10px] font-black text-rose-500 uppercase tracking-widest">
                    Industry
                  </th>
                  <th className="px-8 py-5 text-[10px] font-black text-rose-500 uppercase tracking-widest text-center">
                    Country
                  </th>
                  <th className="px-8 py-5 text-[10px] font-black text-rose-500 uppercase tracking-widest">
                    Tech Stack
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-rose-100/60">
                {results.map((company: any) => (
                  <tr
                    key={company.domain}
                    className="hover:bg-pink-50/40 transition-all duration-300 hover:scale-[1.01]"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-rose-100 shadow-inner shadow-rose-200/50 flex items-center justify-center text-rose-600 group-hover:bg-pink-200">
                          <Building2 size={18} />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 group-hover:text-pink-700">
                            {company.name}
                          </div>
                          <div className="text-[11px] text-pink-600 font-bold">
                            {company.domain}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-8 py-6 text-sm font-semibold text-slate-500">
                      {company.industry}
                    </td>

                    <td className="px-8 py-6 text-center">
                      <span className="bg-rose-100 text-rose-600 px-3 py-1 rounded-lg text-[10px] font-black border border-rose-200">
                        {company.country}
                      </span>
                    </td>

                    <td className="px-8 py-6">
                      <div className="flex flex-wrap gap-1.5">
                        {company.technologies && company.technologies.length > 0 ? (
                          company.technologies.slice(0, 3).map((t: any) => (
                            <span
                              key={t.name}
                              className="bg-white border border-rose-200 text-rose-600 px-2 py-1 rounded-md text-[9px] font-black uppercase shadow-sm"
                            >
                              {t.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-400 italic font-medium">
                            No tech detected
                          </span>
                        )}

                        {company.technologies?.length > 3 && (
                          <span className="text-[10px] text-pink-600 font-black px-2 py-1 bg-pink-100 rounded-md">
                            +{company.technologies.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}