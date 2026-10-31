# Rep Log

A gym logbook you install on your phone. Works offline, keeps your history on the device, and optionally syncs to the cloud so nothing is lost if you change phones.

- **Today**: the next workout in your rotation (Chest & Triceps → Back & Biceps → Shoulders & Triceps → Legs & Biceps), one tap to start.
- **Workout mode**: one exercise at a time, big ± buttons for weight and reps, one big Log button, auto rest timer, screen stays awake.
- **Plan**: edit your workouts, exercises, sets and rep ranges.
- **Progress / History**: estimated 1-rep max chart, best sets, volume, every past session.
- **Settings (⚙)**: sign in for sync, rest timer length, weight step (1.25 / 2.5 / 5 kg), export/import backup.

Plain HTML/CSS/JS. No build step.

```
index.html             app shell
styles.css             styles (light + dark)
app.js                 the app (IndexedDB storage + Supabase sync)
config.js              your Supabase URL + anon key (optional)
sw.js                  service worker (offline)
manifest.webmanifest   install metadata
icons/                 app icons
```

---

## 1. Try it locally (2 minutes)

```bash
cd replog-pwa
python3 -m http.server 8080
# open http://localhost:8080
```

With `config.js` empty, everything saves on the device only.

## 2. Set up cloud sync with Supabase (10 minutes, free)

1. Create a project at <https://supabase.com> (free tier is plenty).
2. Open **SQL Editor → New query**, paste this and run it:

```sql
create table public.docs (
  user_id    uuid    not null default auth.uid() references auth.users on delete cascade,
  id         text    not null,          -- '2026-10-31' for a day, 'plan', 'settings'
  data       jsonb,
  updated_at bigint  not null,          -- client time, used for last-write-wins
  deleted    boolean not null default false,
  synced_at  timestamptz not null default now(),  -- server time, used to pull changes
  primary key (user_id, id)
);

create index docs_user_synced on public.docs (user_id, synced_at);

alter table public.docs enable row level security;

create policy "own rows only" on public.docs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.touch_synced_at() returns trigger
language plpgsql as $$ begin new.synced_at = now(); return new; end $$;

create trigger docs_touch before insert or update on public.docs
  for each row execute function public.touch_synced_at();
```

3. **Authentication → Sign In / Providers → Email**: keep Email enabled. Easiest: turn **Confirm email** off (it's your personal app). If you leave it on, confirm the email once, then sign in inside the app.
4. **Project Settings → API**: copy the **Project URL** and the **anon public** key into `config.js`.

The anon key is safe to ship in the client; the row-level security policy means each account can only read and write its own rows.

## 3. Deploy (free, HTTPS, required for install)

Any static host works. Pick one:

**Vercel**
```bash
npm i -g vercel
cd replog-pwa && vercel --prod
```

**Netlify**: drag the `replog-pwa` folder onto <https://app.netlify.com/drop>.

**GitHub Pages**: push the folder to a repo → Settings → Pages → deploy from `main` / root.

## 4. Install on your phone

- **iPhone**: open the URL in **Safari** → Share → **Add to Home Screen**.
- **Android**: open in **Chrome** → ⋮ → **Install app**.

Open it from the home screen icon, tap ⚙, create your account / sign in. Done.

## How data is stored

- Every workout day, your plan and your settings are documents in IndexedDB on the phone. The app always reads and writes locally first, so it's instant and works with no signal in the gym.
- When signed in and online, it syncs: pulls rows changed on the server since the last sync (by `synced_at`), then pushes local changes. On a conflict the newest edit wins.
- Sync runs on open, on reconnect, when you return to the app, and ~1.5 s after each change.
- The app asks the browser for persistent storage so iOS/Android don't evict your data. Cloud sync or a periodic **Export backup** is still the safe way to keep history long-term (iOS can clear data of web apps that aren't opened for weeks).

## Updating the app

Edit the files, bump `VERSION` in `sw.js` (e.g. `replog-v2`), redeploy. The phone picks up the new version the next time the app is opened (sometimes the open after that).

## Going native later

Wrap this folder with Capacitor to ship to the App Store / Google Play:

```bash
npm i @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npx cap init "Rep Log" com.yourname.replog --web-dir .
npx cap add ios && npx cap add android
```
