# Campus Coin: Complete Setup Guide (React + PHP + MySQL)

> Yeh guide aapke apne setup aur samajhne ke liye hai. Techwiz mein AI-written documentation allowed nahi, is liye project ka README aur documentation apne alfaaz mein khud likhein.

---

## 1. Aapko kya mila hai

Do alag folders hain:

```
campus-coin-api/            ← PHP backend (XAMPP ke htdocs mein jayega)
├── index.php               ← API ka single entry point (router)
├── setup.php               ← ek dafa chalana hai: database + tables + data banata hai
├── config.php              ← database password, debug mode, demo accounts
├── .htaccess
├── lib/                    ← core, auth, mailer, domain, insights, seeder
├── routes/                 ← auth.php, student.php, admin.php, content.php
└── database/
    ├── schema.sql          ← 17 tables
    ├── seed.sql            ← default categories, tips, announcements, AI keywords
    └── site_content.php    ← website ka default content (landing page, footer, lists)

campus-coin/                ← React frontend (kahin bhi rakh sakte hain)
├── src/lib/api.ts          ← har API call yahan se jati hai
├── src/lib/store.tsx       ← app ka data, sab server se load hota hai
├── vite.config.ts          ← /api ko XAMPP par forward karta hai
└── .env.example
```

React folder ke andar ab koi PHP file nahi hai. Dono sirf API (HTTP + JSON) ke zariye baat karte hain.

---

## 2. Zaroori cheezein

| Cheez | Version | Check kaise karein |
|---|---|---|
| XAMPP | PHP **8.0 ya naya** (8.1/8.2 best) | XAMPP Control Panel → Apache ke saath version, ya `http://localhost/dashboard/phpinfo.php` |
| Node.js | **18 ya naya** | CMD mein `node -v` |

---

## 3. Backend setup (PHP + MySQL)

**Step 1: Folder copy karein**

`campus-coin-api` folder ko yahan paste karein:
```
C:\xampp\htdocs\campus-coin-api
```
Dhyan rakhein ke folder double na ho (`campus-coin-api\campus-coin-api\index.php` galat hai). Sahi path yeh hai: `C:\xampp\htdocs\campus-coin-api\index.php`

**Step 2: XAMPP start karein**

XAMPP Control Panel mein **Apache** aur **MySQL** dono **Start** karein. Dono green hone chahiye.

**Step 3: Password (sirf agar set kiya hai)**

Fresh XAMPP mein MySQL `root` ka password khaali hota hai, to kuch nahi karna. Agar aapne password rakha hai to `config.php` mein likh dein:
```php
'pass' => 'aapka-password',
```

**Step 4: Database banayein**

Browser mein kholein:
```
http://localhost/campus-coin-api/setup.php
```
"Campus Coin is installed 🎉" aana chahiye. Yeh khud:
- `campus_coin` database banata hai
- 17 tables banata hai
- default categories, tips, announcements, AI keywords aur website content daalta hai
- admin, demo student aur 4 aur students banata hai (sample data ke saath)

> **Zaroori:** tables phpMyAdmin mein `schema.sql` import karke khud na banayein. Us tarah users (demo accounts) aur website content nahi bante, aur home page par sirf navbar dikhta hai. Hamesha `setup.php` chalayein.

- Kuch missing ho (accounts, content, categories), to `http://localhost/campus-coin-api/setup.php?repair=1` kholein. Yeh bagair kuch delete kiye missing cheezein daal deta hai aur demo passwords dobara set kar deta hai.
- Bilkul zero se shuru karna ho to `http://localhost/campus-coin-api/setup.php?reset=1` kholein. Yeh saara data delete karke naya banata hai.
- `setup.php` ko dobara kholne par yeh bhi dikhata hai ke database mein kitne users, categories, tips aur content sections hain.

**Step 5: API check karein**

```
http://localhost/campus-coin-api/index.php/health
```
Jawab kuch aisa hona chahiye: `{"ok":true,"time":"...","database":true}`

phpMyAdmin (`http://localhost/phpmyadmin`) mein `campus_coin` database aur uski tables bhi dekh sakte hain.

---

## 4. Frontend setup (React)

`campus-coin` folder kahin bhi rakh sakte hain (Desktop, Documents, ya htdocs). CMD ya VS Code terminal mein us folder ke andar jayein:

```bash
cd path\to\campus-coin
npm install
npm run dev
```

Browser mein `http://localhost:5173` kholein.

**Yeh kaise connect hota hai:** React har request `/api/...` par bhejta hai, aur Vite use `http://localhost/campus-coin-api/index.php/...` par forward kar deta hai. Is liye CORS ka masla nahi hota.

**Agar API folder ka naam ya Apache port alag hai:** `.env.example` ko copy karke `.env` naam dein aur target badal dein:
```
API_TARGET=http://127.0.0.1:8080/campus-coin-api/index.php
```
`.env` badalne ke baad `npm run dev` band karke dobara chalayein.

---

## 5. Login aur test

| Role | Page | Email | Password |
|---|---|---|---|
| Student | `http://localhost:5173/#/login` | alex.khan@campus.edu.pk | student123 |
| Admin | `http://localhost:5173/#/admin/login` | admin@campuscoin.pk | admin123 |

Debug mode mein login page par "Fill it in for me" ka button bhi aata hai. Yeh accounts `config.php` ke `demo_accounts` mein hain.

**Check karein ke data sach mein database mein ja raha hai:**
1. Student login karke ek expense add karein, jaise "Foodpanda Pizza" Rs. 500.
2. phpMyAdmin → `campus_coin` → `transactions` table kholein. Nayi row wahan hogi.
3. Page refresh karein. Data wahi rahega, kyunke ab woh server se aa raha hai.
4. Admin login → **Site content** → "Home: hero section" mein `title` badal kar Save karein. Home page par naya title foran nazar aayega, aur `site_content` table mein bhi save hoga.

---

## 6. Database tables (17)

| Table | Kya store hota hai | Kis page se |
|---|---|---|
| `users` | students aur admins: naam, email, password hash, role, status, academic year, allowance, savings goal | Register, Profile, Admin → Users |
| `user_settings` | dark mode, text size, notification on/off | Settings → Preferences |
| `auth_tokens` | login sessions (token ka sirf SHA-256 hash), device, IP | Login, Settings → Security |
| `password_resets` | forgot password ke one-time links (30 minute) | Forgot / Reset password |
| `categories` | default categories (`user_id` NULL) + student ki apni categories | Categories, Admin → Categories |
| `category_keywords` | AI category suggestion ke words (jaise "foodpanda" → Food) | Admin → Categories → AI keywords |
| `transactions` | har income/expense (manual, csv, sample) | Add expense/income, Transactions, CSV import |
| `budgets` | har category ka monthly limit | Budgets |
| `insights` | monthly AI summary, pattern aur action | AI Insights |
| `tips` | system saving tips | Saving Tips, home page |
| `announcements` | admin ke announcements aur tip templates | Admin → Tips & Announcements |
| `user_tip_state` | kis student ne kaunsi tip pin/dismiss ki | Saving Tips |
| `bookmarks` | saved tips aur insights | Bookmarks |
| `notifications` | budget alerts, tips, insights, import, announcements | Notifications (bell) |
| `category_corrections` | jab student AI ki suggestion badle, woh yaad rakhta hai | Add expense |
| `email_log` | har email jo app bhejti hai (reset links, reports) | Forgot password, Reports → Email |
| `site_content` | website ka saara content, JSON mein | Home page, login pages, footer, dropdowns, Admin → Site content |

---

## 7. Pehle hardcoded content ab kahan se aata hai

| Content | Pehle | Ab |
|---|---|---|
| Home page ka saara text, examples, numbers | `Landing.tsx` mein likha tha | `site_content` (landing_* rows) |
| Home page ke category icons, colours, naam | code mein | `categories` table |
| Home page ki tips | code mein | `tips` table (`landing_tips.tipIds` se chuni hui) |
| Footer aur sitemap | code mein | `site_content` → `site_footer` |
| Login/Register ka dark side panel | code mein | `site_content` → `auth_panel` |
| Academic year dropdown | `YEARS` array | `site_content` → `academic_years` (server bhi isi list se validate karta hai) |
| Category colour choices | `swatches` array | `site_content` → `category_colors` |
| CSV "Try a sample file" | code mein | `site_content` → `csv_sample` |
| AI category keywords | `ai.ts` mein `KEYWORDS` | `category_keywords` table |
| Announcement audiences | `AdminTips.tsx` mein | API (`GET /admin/announcements`) |
| Demo login details | `Auth.tsx` mein | `config.php` (API sirf debug mode mein bhejti hai) |

Code mein ab sirf UI ke labels rehte hain, jaise button text ("Save", "Log in") aur form labels. Yeh website ka content nahi, interface ka hissa hain.

**Content edit karne ke 2 tareeqe:**
1. **Admin → Site content** (asaan tareeqa): section chunein, JSON mein sirf text ya number badlein, Save karein.
   - Server check karta hai ke structure wahi rahe. Agar koi field hat gayi ya galat type hai, to error dikhata hai aur save nahi karta.
   - "Reset to default" se original text wapas aa jata hai.
2. **phpMyAdmin**: `site_content` table → `content` column edit karein. Yahan koi check nahi hota, is liye pehla tareeqa behtar hai.

---

## 8. Poora flow kaise kaam karta hai

```
Button click (React)
  → src/lib/store.tsx  (e.g. addTransaction)
  → src/lib/api.ts     fetch('/api/transactions', POST, JSON + X-Auth-Token header)
  → Vite proxy         http://localhost/campus-coin-api/index.php/transactions
  → index.php          route match → transaction_create()   (routes/student.php)
  → require_student()  token check                            (lib/auth.php)
  → tx_input()         validation, galti ho to 422 + field errors
  → PDO prepared statement → MySQL `transactions` table
  → budget_alert()     80% / 100% cross hua to `notifications` mein row
  ← JSON response      React screen update karta hai
```

**Login ka tareeqa:**
- Login par server 64 characters ka random token deta hai.
- Browser use `localStorage` mein rakhta hai.
- Database mein us token ka sirf hash save hota hai.
- Har request ke saath `X-Auth-Token` header jata hai.
- Session 7 din inactive rehne par khatam ho jata hai.

---

## 9. API endpoints

Base URL: `http://localhost/campus-coin-api/index.php`. Errors hamesha is shape mein aate hain: `{"error": "...", "fields": {...}}`

**Public (login ke bagair)**

| Method | Route |
|---|---|
| GET | `/health` |
| GET | `/content` |
| POST | `/auth/login` |
| POST | `/auth/register` |
| POST | `/auth/forgot` |
| POST | `/auth/reset/check` |
| POST | `/auth/reset` |

**Koi bhi logged-in user**

| Method | Route |
|---|---|
| GET | `/auth/me` |
| POST | `/auth/logout` |
| PUT | `/settings` |
| POST | `/account/password` |
| GET | `/account/sessions` |
| POST | `/account/sessions/revoke-others` |
| DELETE | `/account/sessions/{id}` |

**Student**

| Method | Route |
|---|---|
| GET | `/bootstrap` |
| PUT | `/profile` |
| POST | `/transactions` |
| POST | `/transactions/import` |
| PUT, DELETE | `/transactions/{id}` |
| POST | `/categories` |
| PUT, DELETE | `/categories/{id}` |
| POST | `/budgets` |
| PUT, DELETE | `/budgets/{id}` |
| POST | `/tips/{id}/pin` |
| POST | `/tips/{id}/dismiss` |
| POST | `/tips/restore` |
| POST | `/bookmarks/toggle` |
| POST | `/notifications/{id}/read` |
| POST | `/notifications/read-all` |
| DELETE | `/notifications/{id}` |
| POST | `/insights/generate` |
| POST | `/reports/email` |
| POST | `/sample-data/reset` |

**Admin**

| Method | Route |
|---|---|
| GET | `/admin/bootstrap` |
| GET | `/admin/overview` |
| GET | `/admin/stats?range=3m\|6m` |
| GET | `/admin/users` |
| PATCH | `/admin/users/{id}/status` |
| POST | `/admin/users/{id}/reset-link` |
| GET | `/admin/categories` |
| POST | `/admin/categories` |
| PUT, DELETE | `/admin/categories/{id}` |
| GET | `/admin/announcements` |
| POST | `/admin/announcements` |
| PUT, DELETE | `/admin/announcements/{id}` |
| POST | `/admin/announcements/{id}/publish` |
| GET | `/admin/content` |
| PUT | `/admin/content/{key}` |
| POST | `/admin/content/{key}/reset` |

---

## 10. Common errors aur unka hal

| Error / masla | Wajah | Hal |
|---|---|---|
| "Can't reach the Campus Coin server" | Apache band hai | XAMPP mein Apache start karein |
| "The API wasn't found" | Folder ka naam/jagah galat | `C:\xampp\htdocs\campus-coin-api\index.php` path check karein, ya `.env` mein `API_TARGET` theek karein |
| "We couldn't reach the database" | MySQL band hai ya password galat | MySQL start karein, `config.php` mein password check karein |
| Home page par sirf navbar, baaki khaali | `site_content` table khaali hai (tables phpMyAdmin se banayi gayi thein) | `setup.php?repair=1` kholein. Nayi API khaali sections khud bhi bhar deti hai |
| Neeche laal box: "Database setup isn't complete" | Users ya default data missing hai | Box ka button dabayein (`setup.php` ya `?repair=1`), phir "I ran it, reload" dabayein |
| Login par "That email and password don't match" | Demo accounts nahi bane, ya password badal gaya | `setup.php?repair=1`. Iske baad demo passwords wapas `student123` / `admin123` ho jate hain |
| "The database isn't set up yet" | setup.php nahi chala | `http://localhost/campus-coin-api/setup.php` kholein |
| setup.php par "Older database found" | Pehle wale version ka database hai | `setup.php?reset=1` kholein |
| MySQL start nahi hota (port 3306) | Koi aur MySQL chal raha hai | Doosra MySQL service band karein, ya XAMPP mein port badlein aur `config.php` mein `port` bhi badlein |
| Apache start nahi hota (port 80) | Skype/IIS port use kar raha hai | XAMPP mein Apache ka port 8080 karein, phir `.env` mein `API_TARGET=http://127.0.0.1:8080/campus-coin-api/index.php` |
| `'vite' is not recognized` | `npm install` nahi chala | Folder ke andar `npm install` chalayein |
| "unexpected response" ke saath PHP ka text | PHP version purana ya extension off | PHP 8+ use karein. `php.ini` mein `extension=pdo_mysql` aur `extension=mbstring` on hon (XAMPP mein by default on hote hain) |
| Screen par "(SQLSTATE...)" wala error | Database query ka masla | Poora message mujhe bhejein. Debug mode mein file aur line bhi likhi hoti hai |

Browser mein F12 → **Network** tab se har API call ka response dekh sakte hain. Kuch galat ho to wahan ka response copy karke bhejein.

---

## 11. Production build (Apache se hi chalana ho)

1. `campus-coin` folder mein `npm run build` chalayein. `dist/` folder banega.
2. `dist` ko `C:\xampp\htdocs\campus-coin\dist` mein rakhein, aur `campus-coin-api` pehle se htdocs mein hai.
3. `http://localhost/campus-coin/dist/` kholein. Build khud `/campus-coin-api/index.php` ko call karta hai. Agar API kahin aur hai to build se pehle `.env` mein `VITE_API_BASE` set karein.
4. `config.php` mein `app_url` ko `http://localhost/campus-coin/dist` kar dein, taake password reset ke links sahi jagah khulein.

**Live karne se pehle:**
- `setup.php` delete karein.
- `config.php` mein `'debug' => false` karein. Is se demo accounts aur technical errors chhup jate hain.
- MySQL ke liye `root` ki jagah alag user aur strong password banayein.

---

## 12. Aik zaroori baat

Mere sandbox mein PHP aur MySQL nahi hain, is liye PHP code line-by-line review kiya gaya hai, lekin wahan chala kar test nahi hua. Frontend ko mock API ke saath browser mein test kiya gaya hai: 44 checks pass hue, jin mein login, expense, CSV, budgets, admin aur site content editor sab shamil hain.

Pehli dafa XAMPP par chalate hue koi error aaye to screen ka message ya Network tab ka response bhej dein. Debug mode on hai, is liye error ke saath file aur line number bhi hoga.
