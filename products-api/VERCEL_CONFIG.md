# Explicación de `vercel.json`

JSON no permite comentarios (`//` o `/* */` romperían el archivo), así que la explicación va aquí.

---

## El archivo completo

```json
{
    "rewrites": [
        { "source": "/(.*)", "destination": "/api/index.js" }
    ],
    "headers": [
        {
            "source": "/(.*)",
            "headers": [
                { "key": "Access-Control-Allow-Origin", "value": "*" },
                { "key": "Access-Control-Allow-Methods", "value": "GET, POST, PUT, PATCH, DELETE, OPTIONS" },
                { "key": "Access-Control-Allow-Headers", "value": "Content-Type, Authorization" }
            ]
        }
    ]
}
```

---

## Parte 1 — `rewrites` (ruteo)

```json
"rewrites": [
    { "source": "/(.*)", "destination": "/api/index.js" }
]
```

**Problema que resuelve:**
Vercel trata cada archivo de `api/` como un endpoint separado. Por defecto, si visitas `tu-api.vercel.app/products`, Vercel busca un archivo `api/products.js` — y no existe. Devolvería 404.

**Qué hace esta regla:**
- `source: "/(.*)"` → "cualquier URL" (es una regex: `(.*)` captura cualquier cadena, incluida la vacía).
- `destination: "/api/index.js"` → "redirige internamente a ese archivo".

**Traducción:** _"Independientemente de la ruta que pida el usuario (`/products`, `/products/5`, `/users?id=1`, lo que sea), ejecuta siempre `api/index.js`"._

Luego dentro de `api/index.js` es json-server quien interpreta la ruta y devuelve los datos correctos. Vercel solo se encarga de llevar la petición hasta ahí.

---

## Parte 2 — `headers` (CORS)

```json
"headers": [
    {
        "source": "/(.*)",
        "headers": [ ... ]
    }
]
```

`source: "/(.*)"` otra vez: aplica estas cabeceras a **cualquier** respuesta.

### ¿Qué es CORS?

**Cross-Origin Resource Sharing.** Es una protección del navegador:

> "Si una página web cargada desde el dominio A hace `fetch` a un dominio B distinto, el navegador BLOQUEA la respuesta por defecto — salvo que B envíe cabeceras diciendo explícitamente que lo permite."

Tu front vive en GitHub Pages (`nicovillagran.github.io`) y tu API en Vercel (`products-api-xxx.vercel.app`). Son dominios distintos → sin estas cabeceras, el navegador bloquea el fetch y verías en consola:

```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

### Las tres cabeceras

**1. `Access-Control-Allow-Origin: *`**
"Acepta peticiones desde cualquier origen". El `*` es permisivo — si quisieras cerrar, pondrías tu dominio exacto: `https://nicovillagran.github.io`.

**2. `Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS`**
Qué métodos HTTP aceptas. Sin esto, el navegador solo permite GET/HEAD/POST "simples".
`OPTIONS` es obligatorio incluirlo: antes de ciertos fetch el navegador envía una petición "preflight" con OPTIONS para preguntar permisos.

**3. `Access-Control-Allow-Headers: Content-Type, Authorization`**
Qué cabeceras puede enviar el cliente en sus peticiones.
- `Content-Type`: necesario al enviar JSON en POST/PUT.
- `Authorization`: si algún día añades tokens/auth.

---

## Resumen visual

```
Navegador                     Vercel                     api/index.js
    │                           │                             │
    │  GET /products            │                             │
    │──────────────────────────>│                             │
    │                           │  rewrite → /api/index.js    │
    │                           │────────────────────────────>│
    │                           │                             │  json-server
    │                           │                             │  lee db.json
    │                           │<────────────────────────────│  devuelve JSON
    │  respuesta + CORS headers │                             │
    │<──────────────────────────│                             │
    │                           │                             │
    ✅ Navegador acepta la respuesta porque trae Access-Control-Allow-Origin
```

---

## Referencia

Docs oficiales de Vercel sobre configuración:
- Rewrites: https://vercel.com/docs/projects/project-configuration#rewrites
- Headers: https://vercel.com/docs/projects/project-configuration#headers
