# Campus Coin: frontend (React + TypeScript + Tailwind)

Setup notes only. Rewrite in your own words before submitting (Techwiz rules).
Full steps: see CAMPUS-COIN-GUIDE.md.

The backend is the separate `campus-coin-api` folder (PHP + MySQL on XAMPP).
All data and website content come from its API; nothing is stored in the browser
except the login token and the guest theme choice.

```bash
npm install
npm run dev        # http://localhost:5173  (API: http://localhost/campus-coin-api)
npm run build      # production build in dist/
```

Smooth scrolling uses Lenis (`src/lib/smoothScroll.ts`). Modals call `lockScroll()`, and anything
inside a dialog or a scroll box is left to the browser, so modals never get stuck.

If the API is somewhere else, copy `.env.example` to `.env` and change `API_TARGET`.

## AI tools used
<!-- Techwiz rules require listing every AI tool used. Fill in and keep honest. -->
- Claude (Anthropic): used to scaffold the UI and the PHP API. List here what you
  reviewed, changed and built yourself.
