// Descarga una imagen específica de Unsplash por producto y la guarda en
// public/images/<id>.jpg. Luego reescribe db.json para que cada producto
// apunte a "/images/<id>.jpg".
//
// Uso:
//   node scripts/download-images.js          # salta las que ya existen
//   node scripts/download-images.js --force  # re-descarga todas
//   node scripts/download-images.js 4 21     # solo esos IDs (implica --force)
//
// Cada entrada del mapa UNSPLASH es el ID corto que aparece al final de
// las URLs de unsplash.com/photos/<slug>-<id>. La URL de descarga
// unsplash.com/photos/<id>/download?w=600&h=600 redirige al JPG real.

const fs = require('fs/promises');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DB_PATH = path.join(ROOT, 'db.json');
const IMG_DIR = path.join(ROOT, 'public', 'images');

// id de producto → short id de Unsplash, curado manualmente desde la
// búsqueda de Unsplash para maximizar relevancia visual.
const UNSPLASH = {
    1:  'Y0RB2z12F1A', // brown-and-white nike sneakers
    2:  'iZL0Cis7Ye4', // mannequin wearing black jacket
    3:  'SGZmzGx0dG0', // close-up pair of underwear on white surface
    4:  'bD-Ytpmtk2U', // brown suede lace-up ankle boots with jeans
    5:  '5vrque5NVHI', // woman in trench coat posing
    6:  'AdjyrNhFVPI', // assorted bra, panties and sport bra
    7:  '4xb2LK36Mps', // young boy in black and white shoes
    8:  'ixLo8pqKC-o', // young child in winter coat
    9:  'PKdcZz-o6bw', // white crew neck t-shirt
    10: 'P8Gva6BhAXI', // man in black leather jacket
    11: '-JM9hYDw8iY', // black and brown leather sandals
    12: 'dK5uNxmpoBM', // child in gray/white pajamas on bed
    13: 'iIjResyhhW0', // man in brown coat and black pants
    14: '0Wg1r_zD4jA', // man with beard in puffer jacket
    15: 'dzgQVct0Jrs', // man in green jacket near snow trees
    16: 'GciaC2ZIAso', // man in brown jacket with sunglasses
    17: 'J08IBx_jFtc', // black and white shorts on clothes line
    18: 'VoXqvbLAPjM', // white crew neck t-shirt
    19: 'APkKDd_9jic', // person wearing white nike sock
    20: 'i1Cd9T6woIw', // man with tattoo wearing briefs
    21: 'wh2udxkVPWA', // brown leather shoes on brown floor tiles
    22: 'R0mbwH2wxj0', // black and brown leather lace-up boots
    23: 'nj0a29qb_jo', // person in gray nike running shoes
    24: 'LkuH3Txi_gs', // brown leather loafers on blue textile
    25: 'BSL837tTPAw', // pair of brown leather hiking boots
    26: 'zkHv9pvrE9U', // woman in brown single-breasted coat
    27: '9KAnqm0mTxc', // woman in black jacket on snow covered ground
    28: 'Ks-Mur7drn8', // woman in red and black jacket on metal railings
    29: '8hAsLeE6Fbo', // woman holding scarf by gray concrete wall
    30: 'aPIN2_ITQ2M', // woman in brown coat and brown hat in snow
    31: 'cfOqoOsVHLQ', // woman wearing black bra and panties on bed
    32: 'wr7zjPfMxxg', // woman wearing calvin klein panties
    33: 'P9zPITLlSBk', // woman wearing blue lingerie
    34: 'NV4yuniRcyw', // woman wearing mesh stockings
    35: 'Az3yuE3out0', // woman wearing stiletto shoes
    36: 'Zx76sbAndc0', // pair of women's brown pointed toe pumps
    37: 'nk8nBcFZEeE', // woman in black boots
    38: 'dwKiHoqqxk8', // pair of white and orange athletic shoes
    39: '3hrb71FIEnY', // girl in blue denim jacket
    40: 'QPBQPKL8rso', // girl's green jacket
    41: 'C5P4p-6Or94', // little girl in a yellow rain coat holding a stick
    42: 'QqLuSb0sypY', // child in red and black plaid shirt walking
    43: 'fdPlZXc-ZwU', // baby's white and blue onesie
    44: 'Cbe9I1QDxJo', // three babies assorted color onesies
    45: 'jH6nZse9o6E', // white dress hanging on radiator next to shoes
    46: 'XMg8GBzNmgA', // blue white and yellow socks
    47: '6bnH1v-IQK0', // toddler wearing rainboots
    48: 'GpQzF1AjVN0', // pair of blue shoes on top of a bed
    49: 'D73BPVGZfQo', // colorful sandal amidst greenery
    50: 'EJ0GkfiMugk', // close up of a person wearing pink shoes
};

function urlFor(id) {
    const shortId = UNSPLASH[id];
    if (!shortId) throw new Error(`Sin mapeo Unsplash para id=${id}`);
    return `https://unsplash.com/photos/${shortId}/download?w=600&h=600`;
}

async function fileExists(p) {
    try { await fs.access(p); return true; } catch { return false; }
}

async function downloadOne(id) {
    const url = urlFor(id);
    const dest = path.join(IMG_DIR, `${id}.jpg`);
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status} para id=${id} (${url})`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 2048) throw new Error(`Imagen demasiado pequeña (${buf.length}B) para id=${id}`);
    await fs.writeFile(dest, buf);
    return { id, bytes: buf.length };
}

async function runBatched(ids, concurrency = 4) {
    const results = [];
    const queue = [...ids];
    const workers = Array.from({ length: concurrency }, async () => {
        while (queue.length) {
            const id = queue.shift();
            try {
                const r = await downloadOne(id);
                console.log(`  ✓ id=${r.id}  (${(r.bytes / 1024).toFixed(0)} KB)`);
                results.push(r);
            } catch (err) {
                console.error(`  ✗ id=${id}  ${err.message}`);
                results.push({ id, error: err.message });
            }
        }
    });
    await Promise.all(workers);
    return results;
}

async function main() {
    const argv = process.argv.slice(2);
    const force = argv.includes('--force');
    const explicitIds = argv.filter(a => /^\d+$/.test(a)).map(Number);

    await fs.mkdir(IMG_DIR, { recursive: true });
    const db = JSON.parse(await fs.readFile(DB_PATH, 'utf8'));

    let toDownload;
    if (explicitIds.length) {
        toDownload = explicitIds;
    } else {
        toDownload = [];
        for (const p of db.products) {
            const dest = path.join(IMG_DIR, `${p.id}.jpg`);
            if (force || !(await fileExists(dest))) toDownload.push(p.id);
        }
    }

    console.log(`Descargando ${toDownload.length} imágenes a ${IMG_DIR}`);
    if (toDownload.length) await runBatched(toDownload, 4);

    let changed = 0;
    for (const p of db.products) {
        const newPath = `/images/${p.id}.jpg`;
        if (p.image !== newPath) { p.image = newPath; changed++; }
    }
    if (changed) {
        await fs.writeFile(DB_PATH, JSON.stringify(db, null, 4) + '\n', 'utf8');
        console.log(`db.json actualizado (${changed} productos)`);
    } else {
        console.log('db.json ya estaba actualizado');
    }
}

main().catch(err => { console.error(err); process.exit(1); });
