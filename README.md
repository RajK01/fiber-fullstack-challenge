## Fiber AI Full-Stack Challenge: Prospecting Engine

### 👤 Candidate Info
- **Name:** Rajeev Kumar
- **GitHub:** RajK01
- **GitHub URL:** https://github.com/RajK01/fiber-fullstack-challenge
- **Role:** Full-Stack Engineer Challenge Submission

---

### 🚀 Overview

A high-performance Prospecting Engine built for the Fiber AI challenge using **Next.js 15**, **TypeScript**, and **Tailwind CSS**.

Supporting complex queries like:
- Companies using “Shopify OR Stripe but NOT Intercom”
- Travel companies in the UK
- Companies using 2+ technologies from a specific category

### **Data Processing**
- Custom ETL script (`setup.ts`)
- Joins:
  - `metaData.json`
  - `techData.json`
  - `techIndex.json`
- Generates unified dataset → `/data/final.json`

---

### ✨ Features

### 🔍 Advanced Search
- Multi-tech AND / OR / NOT logic builder
- Typeahead tech picker (with tags)
- Filters:
  - Country
  - Industry
  - Minimum tech count
  - Technology category

### 📊 Results Table
- Pagination
- Open domain in new tab
- Clean, readable layout

### 📤 Export Options
- Export to CSV
- Export to JSON

---

### ⚙️ Setup & How to Run

Clone the project:

```bash
git clone https://github.com/RajK01/fiber-fullstack-challenge

cd fiber-fullstack-challenge
```
Install:
```bash
npm install
```
Run the Server

```bash
npm run dev
```

