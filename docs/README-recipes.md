Love it—let’s make this clean and future-proof.

## 1) Update the Trejo page text + remove “Back to site”

Replace your current `docs/trejo/index.html` with this version (same behavior, but title/header say “Trejo’s Tacos Recipes” and there’s no back link). It still reads `recipes_index.json` and falls back to `exports/recipes.json` if needed.

```html
<!doctype html>
<meta charset="utf-8" />
<title>Trejo’s Tacos Recipes</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<style>
  :root{--fg:#1a1a1a; --sub:#585858; --bg:#fff; --muted:#f6f6f6; --line:#e8e8e8; --accent:#7a5cff;
        --radius:12px; --pad:1rem; --shadow:0 1px 2px rgba(0,0,0,.06)}
  *{box-sizing:border-box}
  body{margin:0; font:16px/1.5 system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial}
  a{color:inherit}
  header{position:sticky; top:0; background:var(--bg); border-bottom:1px solid var(--line); z-index:2}
  .wrap{max-width:980px; margin:0 auto; padding:clamp(.75rem,2vw,1.25rem);}
  .title{font-weight:800; font-size:1.6rem; letter-spacing:.2px}
  .controls{display:flex; gap:.5rem; width:100%; margin-top:.75rem; flex-wrap:wrap}
  .search{flex:1; display:flex; align-items:center; gap:.5rem; background:var(--muted); padding:.625rem .75rem; border-radius:999px}
  .search input{border:0; outline:0; background:transparent; width:100%; font-size:1rem}
  .chip{border:1px solid var(--line); padding:.4rem .65rem; border-radius:999px; background:#fff; cursor:pointer; user-select:none}
  .chip[aria-pressed="true"]{border-color:var(--accent); color:var(--accent)}
  main{padding-block:1rem}
  .grid{display:grid; grid-template-columns:repeat(auto-fill, minmax(220px,1fr)); gap:1rem}
  .card{display:flex; flex-direction:column; gap:.4rem; background:#fff; border:1px solid var(--line); border-radius:var(--radius); padding:var(--pad); box-shadow:var(--shadow)}
  .num{font-size:.8rem; color:var(--sub); background:var(--muted); padding:.2rem .5rem; border-radius:999px; width:max-content}
  .name{font-weight:600; margin-top:.1rem}
  .open{margin-top:auto; font-size:.9rem; color:var(--accent); text-decoration:none}
  .count{color:var(--sub); font-size:.9rem; margin:.75rem 0}
</style>

<header>
  <div class="wrap">
    <div class="title">Trejo’s Tacos Recipes</div>
    <div class="controls">
      <label class="search" aria-label="Search recipes">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15.8 14.4l4.6 4.6-1.4 1.4-4.6-4.6a7 7 0 1 1 1.4-1.4zM5 10a5 5 0 1 0 10 0A5 5 0 0 0 5 10z" fill="currentColor"/></svg>
        <input id="q" type="search" placeholder="Search by name or number…" autocomplete="off" />
      </label>
      <div role="group" aria-label="Sort">
        <button class="chip" id="sort-num" aria-pressed="true">Sort: Number</button>
        <button class="chip" id="sort-az" aria-pressed="false">A–Z</button>
      </div>
    </div>
  </div>
</header>

<main class="wrap">
  <div class="count" id="count"></div>
  <div class="grid" id="grid" aria-live="polite"></div>
</main>

<script>
(function(){
  const grid = document.getElementById('grid');
  const count = document.getElementById('count');
  const q = document.getElementById('q');
  const sortNum = document.getElementById('sort-num');
  const sortAZ = document.getElementById('sort-az');

  const numFromFile = (file) => (file.match(/^(\d{3})-/)||[])[1] || "";
  const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');

  let items = [];

  function render(list){
    grid.innerHTML="";
    list.forEach(it=>{
      const card = document.createElement('article'); card.className='card';
      card.innerHTML = `
        <div class="num">${it.num ? `#${it.num}` : '—'}</div>
        <div class="name">${it.title}</div>
        <a class="open" href="${it.href}">Open →</a>`;
      grid.appendChild(card);
    });
    count.textContent = `${list.length} recipe${list.length===1?"":"s"}`;
  }
  function apply(){
    const term = (q.value||"").trim().toLowerCase();
    let list = items.filter(it=> !term || it.num.includes(term) || it.title.toLowerCase().includes(term));
    if (sortAZ.getAttribute('aria-pressed')==='true') list.sort((a,b)=>a.title.localeCompare(b.title));
    else list.sort((a,b)=>(a.num||"").localeCompare(b.num||""));
    render(list);
  }
  function toggle(on, off){ on.setAttribute('aria-pressed','true'); off.setAttribute('aria-pressed','false'); apply(); }
  sortNum.addEventListener('click', ()=>toggle(sortNum, sortAZ));
  sortAZ.addEventListener('click', ()=>toggle(sortAZ, sortNum));
  q.addEventListener('input', apply);

  async function loadData(){
    // Prefer per-page index, then fall back to recipes.json
    try {
      const r = await fetch('recipes_index.json', {cache:'no-store'});
      if (r.ok) {
        const data = await r.json();
        items = data.map(d => ({ title: d.title, num: numFromFile(d.file), href: 'exports/html/'+d.file }));
        apply(); return;
      }
    } catch {}
    try {
      const r2 = await fetch('exports/recipes.json', {cache:'no-store'});
      if (r2.ok) {
        const data = await r2.json();
        items = data.map((rec, i) => {
          const file = `${String(i+1).padStart(3,'0')}-${slugify(rec.title)}.html`;
          return { title: rec.title, num: String(i+1).padStart(3,'0'), href: 'exports/html/'+file };
        });
        apply(); return;
      }
    } catch {}
    render([]); // nothing found
  }

  loadData();
})();
</script>
```

Commit it:

```bash
git add docs/trejo/index.html
git commit -m "Trejo page: rename header; remove back link; add noindex"
git push
```

---

## 2) “Abolish” the rest of the site (hide the root)

Make the root blank, unindexed, and with a blank 404:

```bash
# Root index: blank + noindex
cat > docs/index.html <<'HTML'
<!doctype html><meta charset="utf-8">
<meta name="robots" content="noindex,nofollow">
<title></title><style>html,body{height:100%;margin:0;background:#fff}</style>
HTML

# Blank 404
cat > docs/404.html <<'HTML'
<!doctype html><meta charset="utf-8">
<meta name="robots" content="noindex,nofollow">
<title>Not found</title><style>html,body{height:100%;margin:0;background:#fff}</style>
HTML

# Disallow crawlers
cat > docs/robots.txt <<'TXT'
User-agent: *
Disallow: /
TXT

git add docs/index.html docs/404.html docs/robots.txt
git commit -m "Blank root + noindex + disallow crawlers"
git push
```

Visitors going to `cookclub.github.io` will see nothing; search engines are told not to index.

---

## 3) Continuity guide (next month checklist)

Here’s a single, repeatable flow. Copy this into `docs/README-recipes.md` in your repo if helpful.

### Prereqs (one-time)

* Python venv with the extractor installed.
* Your extractor command produces a folder like `trejo/exports` containing:

  * `exports/html/*.html` (per-recipe pages, no “All\_Recipes.html” in git)
  * `exports/recipes.json`
  * (optional) `recipes_index.json` (title + filename pairs)

### Each month: publish a new book

1. **Run the extractor**

* Example (adjust for your script and book):

  ```bash
  cd ../recipe-extraction
  python trejo_recipe_extractor_v4_printready_patched.py \
    Trejos_Tacos_fixed.epub \
    --out trejo \
    --single           # okay to generate locally; DO NOT commit the giant All_Recipes.html
  ```

  Output dir example: `../recipe-extraction/trejo/exports/...`

2. **Copy into the website repo under a slug**

* Choose a slug (e.g., `trejo`, `arabiyya`, etc.).
* From `cookbook-club-rsvp/` repo root:

  ```bash
  SLUG="trejo"                           # change each month
  SRC="../recipe-extraction/$SLUG"       # extractor output folder
  mkdir -p "docs/$SLUG/exports"
  rsync -av --delete "$SRC/exports/" "docs/$SLUG/exports/"
  ```

  (If your extractor wrote `recipes_index.json`, also do:)

  ```bash
  cp "$SRC/recipes_index.json" "docs/$SLUG/recipes_index.json" 2>/dev/null || true
  ```

3. **Create/update the slug’s index page**

* Start from the HTML above (this message). Save it to:

  ```
  docs/<slug>/index.html
  ```
* If you want a different header (e.g., “Arabiyya Recipes”), edit the `<title>` and the `.title` text only.

4. **Sanity checks**

* Ensure no giant file got added:

  ```bash
  git status | grep All_Recipes.html && echo "⚠️ remove All_Recipes.html from commit"
  ```
* Confirm pages exist:

  ```bash
  ls docs/$SLUG/exports/html | head
  ```

5. **Commit & push**

```bash
git add "docs/$SLUG"
git commit -m "Add $SLUG recipes"
git push
```

Wait for GH Pages to deploy, then visit:

```
https://cookclub.github.io/<slug>/
```

6. **Link your Airtable**

* Use the per-recipe URLs (`/trejo/exports/html/NNN-slug.html`) in your Airtable confirmation emails.

### Common pitfalls & fixes

* **Index page shows “0 recipes”**
  The page needs either `/recipes_index.json` or `/exports/recipes.json`.
  Fix A (add index JSON):

  ```bash
  python - <<'PY'
  ```

import json, re, pathlib
root = pathlib.Path("docs/SLUG\_REPLACE")  # replace before running
data = json.load(open(root/"exports"/"recipes.json","r",encoding="utf-8"))
out=\[]; slug = lambda s: re.sub(r"\[^a-z0-9]+","-", s.lower()).strip("-")
for i,r in enumerate(data,1): out.append({"title": r\["title"], "file": f"{i:03d}-{slug(r\['title'])}.html"})
open(root/"recipes\_index.json","w",encoding="utf-8").write(json.dumps(out, ensure\_ascii=False, indent=2))
PY

````
Fix B (no index JSON): the page I gave already falls back to `exports/recipes.json`.

- **Push rejected for file >100MB**  
You accidentally committed `All_Recipes.html`. Remove it:
```bash
git rm --cached "docs/$SLUG/exports/html/*All_Recipes*.html" 2>/dev/null || true
git commit -m "Remove oversized all-in-one file"
git push
````

* **Double “exports/exports/…” paths**
  Flatten:

  ```bash
  rsync -av "docs/$SLUG/exports/exports/html/" "docs/$SLUG/_tmp/"
  rm -rf "docs/$SLUG/exports"
  mkdir -p "docs/$SLUG/exports/html"
  rsync -av --delete "docs/$SLUG/_tmp/" "docs/$SLUG/exports/html/"
  rm -rf "docs/$SLUG/_tmp"
  git add -A && git commit -m "Flatten $SLUG paths" && git push
  ```

### Optional quality-of-life

* Make the slug page **noindex** (already in `<meta name="robots" content="noindex">`).
* Keep root **blank + disallowed** (the commands above created `docs/index.html`, `docs/404.html`, `docs/robots.txt`).
* If you want a one-liner publisher, drop a tiny script `scripts/publish.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
SLUG="${1:?usage: scripts/publish.sh <slug> <extract_dir>}"
SRC="${2:?path to extractor output (folder containing exports/)}"
mkdir -p "docs/$SLUG/exports"
rsync -av --delete "$SRC/exports/" "docs/$SLUG/exports/"
[ -f "$SRC/recipes_index.json" ] && cp "$SRC/recipes_index.json" "docs/$SLUG/recipes_index.json"
# stamp title into index if you keep a template
git add "docs/$SLUG" && git commit -m "Add $SLUG recipes" && git push
```

That should give you a quiet, tidy public footprint, correct naming (“Trejo’s Tacos Recipes”), and a repeatable monthly flow without re-thinking the whole thing.
