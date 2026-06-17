# PartFinder AG - Setup & Development Guide

## 📋 Quick Start

### 1. Install Dependencies
```bash
cd "/Users/emmascheck/Desktop/ag parts"
npm install
```

### 2. Run Locally
```bash
npm run dev
```
This opens the app at `http://localhost:3000`

### 3. Build for Production
```bash
npm run build
```

---

## 🗄️ Supabase Setup (One-time)

### Create Database Schema

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: `tzbrrbryfu`
3. Go to **SQL Editor**
4. Create a new query
5. Copy all content from `SUPABASE_SCHEMA.sql` and run it
6. Then run the content from `SEED_DATA.sql` to add test parts & suppliers

### Verify Connection

Test the connection by checking if the Supabase client loads:
```javascript
import { supabase } from './src/lib/supabase'
console.log('Supabase connected:', supabase.auth)
```

---

## 📁 Project Structure

```
ag parts/
├── .env                          # Supabase credentials (gitignored)
├── package.json                  # Dependencies
├── vite.config.js               # Vite config
├── netlify.toml                 # Netlify deploy config
├── index.html                   # Entry point
├── SUPABASE_SCHEMA.sql          # Database schema
├── SEED_DATA.sql                # Test data
├── CLAUDE (5).md               # Project guide
├── README.md                    # This file
├── public/
│   └── manifest.json            # PWA manifest
└── src/
    ├── main.jsx                 # React entry
    ├── App.jsx                  # Main app & routing
    ├── styles.css               # Design tokens
    ├── lib/
    │   └── supabase.js          # Supabase client
    ├── data/
    │   └── demo.js              # Demo data (fallback)
    ├── components/              # Reusable UI
    │   ├── TopBar.jsx
    │   ├── BottomNav.jsx
    │   ├── SupplierCard.jsx
    │   ├── Badge.jsx
    │   └── PartRow.jsx
    └── screens/                 # 9 app screens
        ├── Home.jsx
        ├── SearchResults.jsx
        ├── PartDetails.jsx
        ├── Categories.jsx
        ├── MachineDetails.jsx
        ├── Checkout.jsx
        ├── OrderTracking.jsx
        ├── Scan.jsx
        └── HowItWorks.jsx
```

---

## 🔌 Connecting App to Supabase (When Ready)

Currently the app uses **demo data**. To switch to Supabase:

### Step 1: Create a data service (`src/lib/api.js`)
```javascript
import { supabase } from './supabase'

export async function searchParts(query) {
  const { data, error } = await supabase
    .from('parts')
    .select('*, category:categories(name), suppliers:parts_suppliers(*)')
    .or(`part_number.ilike.%${query}%,name.ilike.%${query}%`)
  
  return data || []
}

export async function getPartByNumber(partNum) {
  const { data } = await supabase
    .from('parts')
    .select('*, suppliers:parts_suppliers(*, supplier:suppliers(*))')
    .eq('part_number', partNum)
    .single()
  
  return data
}
```

### Step 2: Update screens to use `api.js` instead of demo data

Example for `SearchResults.jsx`:
```javascript
import { searchParts } from '../lib/api'

export function SearchResults({ query, ... }) {
  const [results, setResults] = useState([])
  
  useEffect(() => {
    searchParts(query).then(setResults)
  }, [query])
  
  // ... rest of component
}
```

---

## 🚀 Deploy to Netlify

### Prerequisites
- [Netlify CLI](https://docs.netlify.com/cli/get-started/) installed: `npm install -g netlify-cli`
- GitHub account with repo

### Deploy Steps

1. **Login to Netlify**
   ```bash
   netlify login
   ```

2. **Build the app**
   ```bash
   npm run build
   ```

3. **Deploy**
   ```bash
   netlify deploy --site shiny-otter-df5b7d --prod
   ```

   Live at: `https://shiny-otter-df5b7d.netlify.app`

### Environment Variables on Netlify

1. Go to **Site settings** → **Build & Deploy** → **Environment**
2. Add these variables:
   ```
   VITE_SUPABASE_URL = https://tzbrrbryfu.supabase.co
   VITE_SUPABASE_ANON_KEY = [your key from .env]
   ```

---

## 🎯 What's Complete

✅ **Full UI** - All 9 screens built
✅ **Routing** - Screen navigation working
✅ **Design System** - CSS tokens, responsive layout
✅ **Demo Data** - Can show parts without Supabase
✅ **Components** - Reusable, modular design
✅ **PWA Ready** - Manifest, can add to home screen
✅ **Netlify Deploy** - Ready to ship

---

## 📝 Next Steps

1. **Run locally** to test UI: `npm run dev`
2. **Set up Supabase schema** using `SUPABASE_SCHEMA.sql`
3. **Seed demo parts** using `SEED_DATA.sql`
4. **Connect app to Supabase** (see "Connecting App to Supabase" above)
5. **Deploy** to Netlify: `netlify deploy --prod`

---

## 🐛 Troubleshooting

**Port 3000 already in use?**
```bash
npm run dev -- --port 3001
```

**Vite not found?**
```bash
npm install
npm run dev
```

**Supabase connection error?**
- Check `.env` file has correct URL and key
- Verify Supabase database exists
- Check browser console for errors

**Netlify deploy failed?**
```bash
# Clear dist folder and rebuild
rm -rf dist
npm run build
netlify deploy --prod
```

---

## 📞 Support

For issues:
1. Check browser console (F12) for errors
2. Verify `.env` file exists with Supabase credentials
3. Test with `npm run dev` locally first
4. Check Supabase dashboard for database status

---

## 🎨 Customization

### Change Colors
Edit `src/styles.css` `:root` variables:
```css
:root {
  --ag-green: #24b33f;      /* Primary brand color */
  --bg: #050d0d;            /* Dark background */
  --text: #f3f5f3;          /* Light text */
}
```

### Add New Parts
Use `SEED_DATA.sql` as template, then run in Supabase SQL Editor.

### Add New Suppliers
Insert into `suppliers` table, then link via `parts_suppliers`.

---

**Happy farming! 🚜**
# ag-parts-
