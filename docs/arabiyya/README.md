# Arabiyya Recipe Exports — Big Spoon Society

A lightweight pipeline to turn a non-DRM EPUB into **phone-friendly recipe pages** (HTML/PNG), publish them on **GitHub Pages**, and (optionally) attach them to **Airtable** for confirmations.

Warm, minimal, and repeatable. No over-engineering.

---

## What’s here

* `arabiyya/exports/html/` – self-contained HTML pages (CSS + images inlined)
* `arabiyya/exports/images/` – optional PNG renders of each recipe
* `arabiyya/index.html` – simple list of recipes
* `out/recipes_index.json` & `out/recipes_public.json` – searchable index (title → file path)
* `.github/workflows/deploy.yml` – Pages deploy (publishes `docs/`)

> **Public URLs** (once deployed):
>
> * Index: `https://cookclub.github.io/arabiyya/`
> * Pages: `https://cookclub.github.io/arabiyya/exports/html/<file>.html`

---

## Quick start (to re-run end-to-end later)

1. **Normalize the EPUB** (fixes nested-folder zips some EPUB exports have)

```python
import zipfile, pathlib
src = pathlib.Path("Arabiyya.epub.zip")
dst = pathlib.Path("Arabiyya_fixed.epub")

with zipfile.ZipFile(src) as zin, zipfile.ZipFile(dst, "w", compression=zipfile.ZIP_DEFLATED) as zout:
    names = zin.namelist()
    prefixes = sorted({n.split('/')[0] + '/' for n in names if '/' in n})
    chosen_prefix = next((p for p in prefixes if f"{p}META-INF/container.xml" in names), None)
    assert chosen_prefix, "No META-INF/container.xml — invalid EPUB?"
    for n in names:
        if n.endswith("/") or not n.startswith(chosen_prefix): continue
        zout.writestr(n[len(chosen_prefix):], zin.read(n))
```

2. **Discover the structure** (this book uses styled paragraphs, not `h1/h2`)

* Start of recipe: `p.rst` (romanized) → `span.arab-rt` (Arabic) → `p.rt` (English title)
* Ingredients: `p.rilf` + many `p.ril` (plus variants `r1il*`, `rilh*`, `rils`)
* Method: `p.rpf` + many `p.rp`
* Next recipe: next `p.rst`

3. **Build the recipe index**

```python
from ebooklib import epub; import ebooklib, re, json, pathlib
from bs4 import BeautifulSoup

book = epub.read_epub("Arabiyya_fixed.epub")
docs = [i for i in book.get_items() if i.get_type()==ebooklib.ITEM_DOCUMENT]
chapters = [d for d in docs if d.get_name().startswith("xhtml/c")]
ARABIC = re.compile(r"[\u0600-\u06FF]")

index=[]
for d in chapters:
    soup = BeautifulSoup(d.get_content(), "html.parser")
    for rst in soup.select("p.rst"):
        rt = rst.find_next("p", class_="rt")
        eng = rt.get_text(" ", strip=True) if rt else ""
        arab = (rst.find("span", class_="arab-rt") or {}).get_text(" ", strip=True) if rst.find("span", class_="arab-rt") else ""
        rom  = ARABIC.sub("", rst.get_text(" ", strip=True)).replace("•","").strip()
        index.append({"doc": d.get_name(), "anchor": rst.get("id"), "title_en": eng, "title_rom": rom, "title_ar": arab})

pathlib.Path("out").mkdir(exist_ok=True)
pathlib.Path("out/recipes_index.json").write_text(json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8")
```

4. **Export exact-look HTML (keep publisher CSS & images)**

* We **do not** inject our own `<h1>`. We keep `p.rst`, `span.arab-rt`, `p.rt` untouched so headers look exactly like the book.

```python
import base64, pathlib
from bs4 import BeautifulSoup
from urllib.parse import urljoin

OUT = pathlib.Path("arabiyya/exports/html"); OUT.mkdir(parents=True, exist_ok=True)

def collect_css(book):
    css=[]
    for it in book.get_items_of_type(ebooklib.ITEM_STYLE):
        css.append(it.get_content().decode("utf-8", errors="ignore"))
    css.append("body{margin:1.2rem auto;max-width:720px;line-height:1.5;font-size:14px} img{max-width:100%;height:auto;display:block;margin:.5rem auto}")
    return "\n\n".join(css)

def inline_images(book, item, soup):
    def resolve(href):
        full = urljoin(item.get_name(), href)
        return book.get_item_with_href(full) or book.get_item_with_href(href)
    for img in soup.select("img[src]"):
        it = resolve(img["src"])
        if it and it.get_type()==ebooklib.ITEM_IMAGE:
            img["src"] = f"data:{it.media_type};base64,{base64.b64encode(it.get_content()).decode('ascii')}"

def slice_until_next_rst(start):
    nodes=[]; cur=start
    while cur:
        nxt=cur.next_sibling
        nodes.append(cur)
        if getattr(nxt,"name",None)=="p" and "rst" in (nxt.get("class") or []): break
        cur=nxt
    return nodes

css_text = collect_css(book)
name_to_item = {d.get_name(): d for d in chapters}

export_paths=[]
for r in index:
    item = name_to_item[r["doc"]]
    soup = BeautifulSoup(item.get_content(), "html.parser")
    start = soup.select_one(f'p.rst#{r["anchor"]}')
    if not start: continue
    nodes = slice_until_next_rst(start)

    html = BeautifulSoup("<!doctype html><html><head><meta charset='utf-8'><title></title><style></style></head><body><article></article></body></html>", "html.parser")
    html.title.string = r["title_en"] or r["title_rom"] or "Recipe"
    html.style.string = css_text
    art = html.article
    for n in nodes: art.append(BeautifulSoup(str(n), "html.parser"))
    inline_images(book, item, html)

    fname = (r["title_en"] or r["title_rom"]).replace("/", "-")[:80] + ".html"
    path = OUT / fname
    path.write_text(html.prettify(), encoding="utf-8")
    export_paths.append(str(path))
```

5. **(Optional) PNG renders for Discord**

```python
from weasyprint import HTML
from pdf2image import convert_from_path
IMG_DIR = pathlib.Path("arabiyya/exports/images"); IMG_DIR.mkdir(parents=True, exist_ok=True)

def html_to_png(html_text, out_png):
    try:
        HTML(string=html_text).write_png(str(out_png))
    except Exception:
        tmp = out_png.with_suffix(".pdf")
        HTML(string=html_text).write_pdf(str(tmp))
        convert_from_path(str(tmp), dpi=180)[0].save(str(out_png))

for p in export_paths:
    txt = pathlib.Path(p).read_text(encoding="utf-8")
    html_to_png(txt, IMG_DIR / (pathlib.Path(p).stem + ".png"))
```

6. **Generate a tiny index page**

```bash
printf '<!doctype html><meta charset=utf-8><h1>Arabiyya</h1><ul>\n' > arabiyya/index.html
for f in arabiyya/exports/html/*.html; do n=$(basename "$f"); printf '<li><a href="exports/html/%s">%s</a></li>\n' "$n" "${n%.html}" >> arabiyya/index.html; done
printf '</ul>\n' >> arabiyya/index.html
```

7. **Publish on GitHub Pages**

This repo deploys `docs/` only. Copy into `docs/arabiyya/` **or** let the workflow do it for you.

**Simplest:** keep files under `docs/` in the repo:

```
docs/
  arabiyya/
    index.html
    exports/
      html/*.html
      images/*.png
```

**Or** copy them during CI (add before “Upload artifact”):

```yaml
- name: Include recipe pages
  run: |
    mkdir -p docs/arabiyya/exports/html docs/arabiyya/exports/images
    cp -R arabiyya/exports/html/*   docs/arabiyya/exports/html/   2>/dev/null || true
    cp -R arabiyya/exports/images/* docs/arabiyya/exports/images/ 2>/dev/null || true
```

8. **(Optional) Attach to Airtable for confirmations**

* Use the GitHub Pages URLs as attachment sources; Airtable will ingest and host its own copy.
* Script shape (Python): find record by `{Recipe Title}` → PATCH `Recipe HTML` / `Recipe PNG` with URLs:

```python
import os, json, requests
from pathlib import Path
BASE = os.environ["AIRTABLE_BASE_ID"]; TOKEN = os.environ["AIRTABLE_TOKEN"]
TABLE = "Recipes"; TITLE_FIELD = "Recipe Title"
HTML_PREFIX = "https://cookclub.github.io/arabiyya/exports/html/"
PNG_PREFIX  = "https://cookclub.github.io/arabiyya/exports/images/"

index = json.loads(Path("out/recipes_public.json").read_text(encoding="utf-8"))

def rec_id(title):
    url=f"https://api.airtable.com/v0/{BASE}/{TABLE}"
    r=requests.get(url, headers={"Authorization":f"Bearer {TOKEN}"},
                   params={"filterByFormula":f"LOWER({{{TITLE_FIELD}}})='{title.lower()}'","maxRecords":1})
    r.raise_for_status(); recs=r.json().get("records",[])
    return recs[0]["id"] if recs else None

def patch(id_, fields):
    url=f"https://api.airtable.com/v0/{BASE}/{TABLE}/{id_}"
    r=requests.patch(url, headers={"Authorization":f"Bearer {TOKEN}","Content-Type":"application/json"},
                     json={"fields":fields}); r.raise_for_status()

for row in index:
    title = row.get("title_en") or row.get("title_rom");  rid = rec_id(title)
    if not rid: continue
    h = Path(row["html_path"]).name; p = Path(row.get("png_path", Path(row["html_path"]).with_suffix(".png"))).name
    patch(rid, {"Recipe HTML":[{"url":HTML_PREFIX+h}], "Recipe PNG":[{"url":PNG_PREFIX+p}]})
```

9. **(Optional) Claim button (prefilled Airtable form)**

Add a button near the top of each HTML page that opens your Airtable form with fields prefilled:

```
https://airtable.com/<FORM_SHARE_ID>?prefill_Recipe%20Title=<title>&prefill_Recipe%20URL=<page_url>&hide_Recipe%20Title=true&hide_Recipe%20URL=true
```

(Keep it quiet and useful; one clear button is enough.)

---

## Maintenance checklist

* New export? Regenerate HTML/PNG → ensure they land under `docs/arabiyya/…` → push.
* If headers ever duplicate: remove any injected `<h1>`; keep `p.rst` + `span.arab-rt` + `p.rt` intact.
* If a URL 404s: confirm the Pages artifact contains `docs/arabiyya/...` (Actions → download artifact).
* SPA interference: ensure links to `/arabiyya/` are plain `<a href="/arabiyya/">` (not hijacked by your router).

---

## Why this fits Big Spoon Society

* **Normie-friendly:** clean, image-rich pages that read well on phones and in Discord.
* **Low lift:** a single repo + Pages deploy; Airtable stays the source of truth.
* **Warm minimalism:** just enough structure to be reliable, nothing that feels like a job.

If future-you wants the “Claim this recipe” button or a `/recipe` Discord command, this README is your map.
