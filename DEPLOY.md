# KaizenOS — Phone + Laptop Setup & Deployment

KaizenOS is hosted as a permanent HTTPS Progressive Web App on GitHub Pages at:

**`https://yeon8.github.io/kaizenos/`**

Every push to `main` automatically rebuilds and redeploys via [`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml).

## 1. Pair Your Phone in 1 Scan

1. Open **`https://yeon8.github.io/kaizenos/`** on your laptop.
2. In **04 System** (or **Pair Phone** in the sidebar), paste your Supabase **Project URL** and **anon public key**, then sign in.
3. Click **Show Phone Pairing QR** and scan the QR code with your phone's camera (with *"Include Cloud Sync keys in QR / Link"* checked).
4. Your phone opens KaizenOS with your Supabase connection pre-filled — just sign in once and install it to your Home Screen:
   - **iPhone / iPad (Safari):** Share → **Add to Home Screen**
   - **Android (Chrome):** Menu → **Install app**

## 2. Set Supabase Redirect URL (for Email Verification & Magic Links)

In your Supabase Dashboard → **Authentication → URL Configuration**:
- Set **Site URL** to: `https://yeon8.github.io/kaizenos/`
- Add `https://yeon8.github.io/kaizenos/**` under **Redirect URLs**

Also make sure you have executed [`supabase/schema.sql`](./supabase/schema.sql) once in the Supabase **SQL Editor**.
