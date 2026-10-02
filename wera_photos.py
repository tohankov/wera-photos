"""Collect and prepare WERA product photos for Horoshop import.

Usage:
    python wera_photos.py 05005936001 05020350001   # only given articles
    python wera_photos.py                           # all articles from the xlsx
    python wera_photos.py --xlsx                    # all + build import_photos.xlsx
    python wera_photos.py --input batch2.xlsx --suffix _2 --xlsx
                                                    # other input; writes report_2.csv,
                                                    # data_2.csv, import_photos_2.xlsx

Photo source: datasheet PDF photo (exact article) if present, else site photo.
"""
import argparse
import csv
import io
import re
import time
import random
from pathlib import Path

import openpyxl
import pandas as pd
import pymupdf
import requests
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parent
INPUT_XLSX = ROOT / "wera_novinki_import_130 (1).xlsx"
CACHE = ROOT / "cache"
IMAGES = ROOT / "images"
RAW_BASE = "https://raw.githubusercontent.com/tohankov/wera-photos/main/images/"

SITE = "https://www.wera.de"
PDF_URL = "https://hybris-media.wera.de/download/pdfgenerator-datasheets/en/{art}.pdf"
PREFERRED_SIZES = ["2000x2000", "1500x1500", "1200x1200", "1000x1000",
                   "800x800", "600x600", "416x416", "218x218"]
TARGET = 1200
MIN_SIDE = 800
MARGIN = 0.05
MAX_UPSCALE = 2.0
JPEG_QUALITY = 90

session = requests.Session()
session.headers["User-Agent"] = "Mozilla/5.0 (wera-photos importer)"
_last_wera = 0.0


def log(msg):
    print(msg, flush=True)


def http_get(url):
    """GET with 1-2 s pause between requests to wera.de; retries on network errors."""
    global _last_wera
    for attempt in range(5):
        wait = random.uniform(1.0, 2.0) - (time.time() - _last_wera)
        if wait > 0:
            time.sleep(wait)
        try:
            return session.get(url, timeout=60)
        except requests.exceptions.RequestException as e:
            if attempt == 4:
                raise
            log(f"  network error ({type(e).__name__}), retry {attempt + 1}/4 in {5 * 2 ** attempt}s")
            time.sleep(5 * 2 ** attempt)
        finally:
            _last_wera = time.time()


def cached(path, url, validate=None):
    """Return bytes of url, cached at path. Negative results cached as <path>.missing."""
    missing = path.with_name(path.name + ".missing")
    if path.exists():
        return path.read_bytes()
    if missing.exists():
        return None
    path.parent.mkdir(parents=True, exist_ok=True)
    r = http_get(url)
    ok = r.status_code == 200 and (validate is None or validate(r))
    if not ok:
        missing.write_text(f"{r.status_code} {r.headers.get('Content-Type', '')}\n")
        return None
    path.write_bytes(r.content)
    return r.content


def is_image(r):
    if not r.headers.get("Content-Type", "").startswith("image/"):
        return False
    try:
        Image.open(io.BytesIO(r.content)).verify()
        return True
    except Exception:
        return False


def is_pdf(r):
    return r.content[:4] == b"%PDF"


# ---------- step 1: collect ----------

def fetch_page(art):
    path = CACHE / "pages" / f"{art}.html"
    missing = path.with_name(path.name + ".missing")
    if path.exists():
        return path.read_text(encoding="utf-8")
    if missing.exists():
        return None
    path.parent.mkdir(parents=True, exist_ok=True)
    r = http_get(f"{SITE}/en/{art}")
    if r.status_code != 200 or "productfinder-detail" not in r.text:
        missing.write_text(f"{r.status_code} {r.url}\n")
        return None
    path.write_text(r.text, encoding="utf-8")
    return r.text


def main_image_name(html):
    """Name of the first image inside the main product image slider."""
    i = html.find("productfinder-image-main")
    if i < 0:
        i = html.find("<h1")
    m = re.search(r"/prodimg/\d+x\d+/([^\"'\s/]+)\.webp", html[max(i, 0):])
    return m.group(1) if m else None


def site_image(art, html):
    """Download largest available main image. Returns (Image, source name, size str) or None."""
    name = main_image_name(html)
    if not name:
        return None
    found = set(re.findall(r"/prodimg/(\d+x\d+)/" + re.escape(name) + r"\.webp", html))
    sizes = sorted(set(PREFERRED_SIZES) | found,
                   key=lambda s: -int(s.split("x")[0]) * int(s.split("x")[1]))
    for size in sizes:
        data = cached(CACHE / "prodimg" / size / f"{name}.webp",
                      f"{SITE}/prodimg/{size}/{name}.webp", is_image)
        if data:
            im = Image.open(io.BytesIO(data))
            im.load()
            return im, f"{name}.webp", size
    return None


def fetch_pdf(art):
    return cached(CACHE / "pdf" / f"{art}.pdf", PDF_URL.format(art=art), is_pdf)


def pdf_text_fields(doc):
    text = doc[0].get_text()
    # a long value can share a line with the next label ("... RA 1 Country of origin:")
    text = re.sub(r"\s*(Country of origin:)", r"\n\1", text)
    lines = [l.strip() for l in text.splitlines()]

    def after(label):
        for idx, l in enumerate(lines):
            if l.rstrip(":").lower() == label.lower():
                for nxt in lines[idx + 1:]:
                    if nxt:
                        return nxt
        return ""

    def model_name():
        # long names wrap over several lines up to the next label
        try:
            start = lines.index("Article number:") + 1
        except ValueError:
            return ""
        parts = []
        for l in lines[start:]:
            if l.endswith(":") or l.startswith("Customs"):
                break
            if l:
                parts.append(l)
        name = ""
        for p in parts:
            name += p if name.endswith("-") or not name else " " + p
        return name

    weight = after("Weight")
    m = re.search(r"([\d.,]+)\s*g\b", weight)
    return {
        "title": next((l for l in lines if l), ""),
        "ean": after("EAN"),
        "weight_g": m.group(1) if m else weight,
        "package_size": after("Size"),
        "country_of_origin": after("Country of origin"),
        "model": model_name(),
    }


def pdf_product_image(doc):
    """Product photo on page 1: the image drawn largest, excluding the header logo."""
    page = doc[0]
    best = None
    for img in page.get_images(full=True):
        xref = img[0]
        for r in page.get_image_rects(xref):
            if r.y1 < 70:  # header logo
                continue
            if best is None or r.width * r.height > best[1]:
                best = (xref, r.width * r.height)
    if not best:
        return None
    xref = best[0]
    info = doc.extract_image(xref)
    w, h = info["width"], info["height"]
    if max(w, h) < 300:
        return None
    im = Image.open(io.BytesIO(info["image"]))
    im.load()
    return im, f"pdf-xref{xref}.{info['ext']}", f"{w}x{h}"


# ---------- step 2: process ----------

def to_rgb_white(im):
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        bg = Image.new("RGB", im.size, "white")
        bg.paste(im, mask=im.getchannel("A"))
        return bg
    if im.mode == "CMYK":
        # datasheet JPEGs from Adobe are often stored inverted
        im = ImageChops.invert(im) if im.info.get("adobe") else im
    return im.convert("RGB")


def content_bbox(rgb):
    diff = ImageChops.difference(rgb, Image.new("RGB", rgb.size, "white")).convert("L")
    diff = diff.point(lambda v: 255 if v > 12 else 0)
    return diff.getbbox() or (0, 0, rgb.width, rgb.height)


def make_square(im):
    rgb = to_rgb_white(im)
    prod = rgb.crop(content_bbox(rgb))
    pmax = max(prod.size)
    if (TARGET * (1 - 2 * MARGIN)) / pmax <= MAX_UPSCALE:
        side = TARGET
    else:
        side = max(MIN_SIDE, max(im.size))
    scale = min(side * (1 - 2 * MARGIN) / pmax, MAX_UPSCALE)
    new = (max(1, round(prod.width * scale)), max(1, round(prod.height * scale)))
    prod = prod.resize(new, Image.LANCZOS)
    canvas = Image.new("RGB", (side, side), "white")
    canvas.paste(prod, ((side - new[0]) // 2, (side - new[1]) // 2))
    return canvas


def slugify(model):
    s = model.lower()
    for a, b in (("ä", "ae"), ("ö", "oe"), ("ü", "ue"), ("ß", "ss")):
        s = s.replace(a, b)
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "product"


# ---------- main ----------

def read_articles(path):
    df = pd.read_excel(path, dtype=str)
    arts = df["Артикул"].dropna().str.strip()
    return [a.zfill(11) for a in arts if a]


def process(art):
    rep = {"article": art, "source": "none", "source_file": "", "source_resolution": "",
           "result_resolution": "", "file": "", "status": ""}
    data = {"article": art, "ean": "", "weight_g": "", "package_size": "", "country_of_origin": ""}
    try:
        html = fetch_page(art)
        site = site_image(art, html) if html else None
        model = ""
        if html:
            m = re.search(r"<h1[^>]*>([^<]+)", html)
            if m:
                model = m.group(1).split(",")[0]
                model = re.split(r"\s+(?=[A-Z][a-z])", model, maxsplit=1)[0]

        pdf = None
        pdf_bytes = fetch_pdf(art)
        if pdf_bytes:
            doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
            fields = pdf_text_fields(doc)
            for k in ("ean", "weight_g", "package_size", "country_of_origin"):
                data[k] = fields[k]
            model = fields["model"] or model
            pdf = pdf_product_image(doc)

        log(f"  page: {'ok' if html else 'NOT FOUND'} | site img: "
            f"{site[1] + ' ' + site[2] if site else '-'} | pdf: "
            f"{'ok' if pdf_bytes else 'NOT FOUND'} img: {pdf[2] if pdf else '-'} | model: {model!r}")

        # datasheet photo shows the exact article (size marking); site photo is per product line
        chosen, src = None, "none"
        if pdf:
            chosen, src = pdf, "pdf"
        elif site:
            chosen, src = site, "site"
        if not chosen:
            rep["status"] = "not_found"
            return rep, data

        out = make_square(chosen[0])
        fname = f"wera-{art}-{slugify(model)}.jpg"
        IMAGES.mkdir(exist_ok=True)
        out.save(IMAGES / fname, "JPEG", quality=JPEG_QUALITY, optimize=True)
        rep.update(source=src, source_file=chosen[1], source_resolution=chosen[2],
                   result_resolution=f"{out.width}x{out.height}", file=fname, status="ok")
    except Exception as e:  # never stop the whole run
        rep["status"] = f"error: {type(e).__name__}: {e}"
    return rep, data


def write_csv(path, rows):
    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)


def write_import_xlsx(path, reports):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Фото"
    ws.append(["Артикул", "Фото"])
    for r in reports:
        if r["status"] == "ok":
            ws.append([r["article"], RAW_BASE + r["file"]])
    for row in ws.iter_rows(min_row=1, max_col=1):
        row[0].number_format = "@"
        row[0].data_type = "s"
    ws.column_dimensions["A"].width = 16
    ws.column_dimensions["B"].width = 100
    wb.save(path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("articles", nargs="*", help="process only these articles")
    ap.add_argument("--input", default=str(INPUT_XLSX), help="xlsx with column 'Артикул'")
    ap.add_argument("--suffix", default="", help="suffix for output files, e.g. _2")
    ap.add_argument("--xlsx", action="store_true", help="also build import_photos{suffix}.xlsx")
    opts = ap.parse_args()
    report_path = ROOT / f"report{opts.suffix}.csv"
    data_path = ROOT / f"data{opts.suffix}.csv"
    import_path = ROOT / f"import_photos{opts.suffix}.xlsx"

    arts = opts.articles or read_articles(Path(opts.input))
    reports, datas = [], []
    for n, art in enumerate(arts, 1):
        log(f"[{n}/{len(arts)}] {art}")
        rep, data = process(art)
        log(f"  -> {rep['status']} {rep['source']} {rep['source_resolution']} -> "
            f"{rep['result_resolution']} {rep['file']}")
        reports.append(rep)
        datas.append(data)
    write_csv(report_path, reports)
    write_csv(data_path, datas)
    ok = sum(r["status"] == "ok" for r in reports)
    log(f"\nDone: {ok}/{len(reports)} ok. report -> {report_path.name}, data -> {data_path.name}")
    if opts.xlsx:
        write_import_xlsx(import_path, reports)
        log(f"import -> {import_path.name}")


if __name__ == "__main__":
    main()
