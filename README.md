## Fiber AI Full-Stack Challenge - Prospecting Engine

### 👤 Candidate Info
- **Name:** Rajeev Kumar
- **GitHub:** [Your Username]
- **Role:** Full-Stack Engineer Challenge

### 🚀 Overview
A high-performance prospecting engine built with **Next.js 15**, **TypeScript**, and **Tailwind CSS**. This application allows users to perform complex, multi-layered searches across BuiltWith technology datasets, identifying companies based on tech stack, geography, and industry metadata.

### 🛠️ Tech Stack
- **Frontend:** Next.js (App Router), Lucide Icons, Framer Motion (for animations)
- **Styling:** Tailwind CSS (Custom "Romantic/Boutique" UI)
- **Search Engine:** In-memory filtered search with Debounced execution
- **Data Handling:** Custom ETL script (`setup.ts`) to join and normalize BuiltWith JSON files

### ✨ Features Implemented
- **Complex Logic:** Supports `AND`, `OR`, and `NOT` operators for technology stacks.
- **Unified Search:** Merged inconsistent data (e.g., "gb" vs "GB") into a clean, normalized global filter.
- **Advanced Filtering:** Filter by Country, Industry, and Minimum Technology Count.
- **Typeahead Select:** Custom dropdowns for Technology selection with tag-based multi-select.
- **Data Export:** Instant export of results to **CSV** or **JSON**.
- **Responsive & "Romantic" UI:** A glassmorphic, high-end interface designed for modern sales teams.

### ⚙️ Setup & Running

### 1. Prepare Data
This command downloads the raw BuiltWith datasets, joins `metaData`, `techData`, and `techIndex` on `domain` and `name`, and prepares the `final.json` used by the engine.
```bash
npm run setup
```
### 2. Run Development Server
```bash
npm run dev
```
