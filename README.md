# AROVAVE GLOBAL - Export Rate Calculator

A comprehensive web application for calculating EX-FACTORY, FOB, and CIF export prices.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Supabase Database

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor in your Supabase dashboard
3. Copy the contents of `database/schema.sql` and run it
4. This will create all tables with sample data

### 3. Configure Environment

1. Copy `.env.example` to `.env.local`
2. Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Find these in Supabase: Settings → API

### 4. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📱 User Interface

The calculator provides a simple, mobile-friendly interface for:
- Selecting products with auto-populated HSN codes and prices
- Choosing manufacturing location and port of loading
- Selecting destination country and port
- Optional certification selection
- One-click rate calculation

## 🔐 Admin Panel

Access at `/admin` with default credentials:
- **Username:** admin
- **Password:** admin123

⚠️ Change these credentials in production!

### Admin Features
- **Products** - Manage export products with HSN codes and base prices
- **Factory Locations** - Configure transport costs
- **Indian Ports** - Set handling and documentation charges
- **Countries & Ports** - Manage destination ports with freight rates
- **Certifications** - Add optional/mandatory certifications
- **Settings** - Insurance rates, API keys, company info

## 📊 Calculation Logic

```
EX-FACTORY = Base Price × Quantity

FOB = EX-FACTORY + Inland Transport + Port Handling + Documentation + Certifications

CIF = FOB + International Freight + Insurance
```

## 🛠 Tech Stack

- **Frontend:** Next.js 14 (React)
- **Styling:** Vanilla CSS with design system
- **Database:** Supabase (PostgreSQL)
- **PDF:** jsPDF

## 📁 Project Structure

```
├── src/
│   ├── pages/
│   │   ├── index.js          # Calculator UI
│   │   └── admin/            # Admin panel pages
│   ├── lib/
│   │   ├── db.js             # Supabase client
│   │   ├── calculator.js     # Price calculation
│   │   └── pdf.js            # PDF generation
│   └── styles/
│       └── globals.css       # Design system
├── database/
│   └── schema.sql            # Supabase schema
└── package.json
```

## 📄 License

Private - Arovave Global
