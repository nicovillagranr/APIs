# Cómo crear una API nueva en este monorepo

Guía paso a paso para crear una API mock con `json-server` desplegable en Vercel, siguiendo el mismo patrón que `01-products-api`. Ejemplo usado a lo largo de esta guía: **`02-api-ciudades`**.

> Todos los comandos asumen **Windows + Git Bash** (o terminal compatible bash). Si usas PowerShell puro, los comandos de creación de archivos vacíos cambian (ver notas).

---

## 0. Prerrequisitos — instalar Node, npm, Git, Vercel CLI

### 0.1 Instalar Node.js (incluye `npm`)

Descarga el instalador LTS desde https://nodejs.org y ejecútalo (siguiente → siguiente).

Verifica en una terminal **nueva**:

```bash
node -v
npm -v
```

Deberías ver algo como `v20.x.x` y `10.x.x`.

### 0.2 Instalar Git

Descarga desde https://git-scm.com/download/win e instala. Verifica:

```bash
git --version
```

### 0.3 (Opcional) Instalar Vercel CLI globalmente

Solo si vas a desplegar desde la terminal en vez del dashboard:

```bash
npm install -g vercel
vercel --version
```

---

## 1. Crear la carpeta de la API

Desde `C:\apis\`:

```bash
cd /c/apis
mkdir 02-api-ciudades
cd 02-api-ciudades
```

> En PowerShell sería `cd C:\apis` y el resto igual.

Convención del monorepo: prefijo numérico (`02-`, `03-`, ...) + nombre descriptivo en minúsculas separado por guiones.

---

## 2. Inicializar el proyecto Node (`package.json`)

### 2.1 Generar el `package.json` inicial

```bash
npm init -y
```

Esto crea un `package.json` con valores por defecto. El flag `-y` acepta todo sin preguntar.

### 2.2 Instalar `json-server` como dependencia

```bash
npm install json-server@^0.17.4
```

Esto:
- Crea `node_modules/` con las dependencias.
- Genera `package-lock.json`.
- Añade `json-server` a `dependencies` en `package.json`.

> **Importante:** fija la versión `^0.17.4`. La `1.x` tiene API distinta y rompe este setup.

### 2.3 Editar `package.json` para dejarlo así

Abre `package.json` y reemplaza su contenido por:

```json
{
  "name": "api-ciudades",
  "version": "1.0.0",
  "private": true,
  "description": "API mock de ciudades",
  "scripts": {
    "start": "json-server --watch db.json --port 3000 --static public"
  },
  "dependencies": {
    "json-server": "^0.17.4"
  }
}
```

Qué significan las flags del `start`:
- `--watch db.json` → recarga al cambiar los datos.
- `--port 3000` → puerto local.
- `--static public` → sirve archivos estáticos desde `public/`.

---

## 3. Crear `db.json` con los datos

### 3.1 Crear el archivo

Bash:
```bash
touch db.json
```

PowerShell:
```powershell
New-Item db.json
```

### 3.2 Pegar contenido

`db.json` es la "base de datos" que json-server expone como endpoints REST. Cada clave de primer nivel se convierte en un recurso (`/ciudades`, `/paises`, etc.).

Ejemplo mínimo:

```json
{
  "ciudades": [
    {
      "id": 1,
      "nombre": "Santiago",
      "pais": "Chile",
      "poblacion": 6800000,
      "imagen": "/images/1.jpg"
    },
    {
      "id": 2,
      "nombre": "Buenos Aires",
      "pais": "Argentina",
      "poblacion": 15600000,
      "imagen": "/images/2.jpg"
    }
  ]
}
```

Reglas:
- Cada objeto **debe tener `id` único** dentro de su recurso.
- El campo `imagen` apunta a una ruta estática (ver paso 5).

---

## 4. Crear el handler serverless para Vercel

Vercel no corre servidores permanentes: ejecuta **funciones** por petición. Necesitas un archivo en `api/` que exporte el server.

### 4.1 Crear la carpeta y el archivo

Bash:
```bash
mkdir api
touch api/index.js
```

PowerShell:
```powershell
New-Item -ItemType Directory api
New-Item api/index.js
```

### 4.2 Contenido de `api/index.js`

```js
const jsonServer = require('json-server');
const path = require('path');

const server = jsonServer.create();

// Ruta ABSOLUTA a db.json: en Vercel el CWD no es la raíz del proyecto.
const router = jsonServer.router(path.join(__dirname, '..', 'db.json'));
const middlewares = jsonServer.defaults();

server.use(middlewares);
server.use(router);

module.exports = server;
```

**No llames a `.listen()`**: Vercel invoca el handler exportado por cada petición.

---

## 5. Carpeta `public/` para archivos estáticos (opcional)

Si tu API sirve imágenes u otros archivos:

Bash:
```bash
mkdir -p public/images
```

PowerShell:
```powershell
New-Item -ItemType Directory -Force public/images
```

Copia ahí `1.jpg`, `2.jpg`, etc. En local se sirven gracias a `--static public` (paso 2). En Vercel, los archivos dentro de `public/` se sirven automáticamente como estáticos y tienen prioridad sobre los rewrites.

---

## 6. Configurar Vercel: `vercel.json`

### 6.1 Crear el archivo

Bash:
```bash
touch vercel.json
```

### 6.2 Contenido

```json
{
  "functions": {
    "api/index.js": {
      "includeFiles": "db.json"
    }
  },
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

Qué hace cada bloque:
- `functions.api/index.js.includeFiles: "db.json"` → fuerza a Vercel a empaquetar `db.json` junto a la función. Sin esto, `router(db.json)` no lo encuentra en runtime.
- `rewrites` → redirige **todas** las rutas a `api/index.js`. Los archivos de `public/` se sirven antes del rewrite.
- `headers` → CORS abierto para consumir la API desde cualquier frontend.

---

## 7. Crear `.gitignore`

Bash:
```bash
cat > .gitignore << 'EOF'
node_modules/
.vercel/
.env
.env.local
*.log
.DS_Store
EOF
```

PowerShell:
```powershell
@'
node_modules/
.vercel/
.env
.env.local
*.log
.DS_Store
'@ | Out-File -Encoding utf8 .gitignore
```

O simplemente créalo a mano con ese contenido.

---

## 8. Probar en local

```bash
npm start
```

Deberías ver algo como:

```
Resources
  http://localhost:3000/ciudades
```

Verifica en el navegador o con `curl`:

```bash
curl http://localhost:3000/ciudades
curl http://localhost:3000/ciudades/1
curl "http://localhost:3000/ciudades?pais=Chile"
curl http://localhost:3000/images/1.jpg --output test.jpg
```

Para detener el servidor: `Ctrl + C`.

---

## 9. Estructura final esperada

```
02-api-ciudades/
├── .gitignore
├── api/
│   └── index.js
├── db.json
├── package.json
├── package-lock.json
├── public/
│   └── images/
│       ├── 1.jpg
│       └── 2.jpg
├── vercel.json
└── node_modules/        (gitignored)
```

---

## 10. Subir a Git

Desde la raíz del monorepo (`C:\apis\`):

```bash
cd /c/apis
git add 02-api-ciudades
git commit -m "feat: agregar 02-api-ciudades con json-server y deploy en Vercel"
git push
```

---

## 11. Desplegar en Vercel

### Opción A — desde el dashboard (recomendada la primera vez)

1. Sube el repo a GitHub (`git push`).
2. En https://vercel.com → **Add New → Project** → importa el repo.
3. En **Root Directory** selecciona `02-api-ciudades` (es un monorepo).
4. Framework preset: **Other**. Build command: vacío. Output directory: vacío.
5. Click **Deploy**.

### Opción B — desde la CLI

```bash
cd /c/apis/02-api-ciudades
vercel login          # la primera vez
vercel                # primer deploy (preview)
vercel --prod         # deploy a producción
```

Tras el deploy prueba:

```bash
curl https://<tu-deploy>.vercel.app/ciudades
```

---

## Consultas útiles de json-server

Con un recurso `/ciudades`:

- `GET /ciudades` — todos.
- `GET /ciudades/1` — por id.
- `GET /ciudades?pais=Chile` — filtrar.
- `GET /ciudades?_sort=poblacion&_order=desc` — ordenar.
- `GET /ciudades?_page=1&_limit=10` — paginar.
- `GET /ciudades?q=santi` — búsqueda full-text.
- `POST /ciudades` con body JSON — crear.
- `PATCH /ciudades/1` con body JSON — actualizar parcial.
- `DELETE /ciudades/1` — eliminar.

Los cambios vía POST/PATCH/DELETE persisten en `db.json` **solo en local**. En Vercel el filesystem es efímero: la API se comporta como sólo lectura.

---

## Checklist rápido de comandos

```bash
# 1. Carpeta
cd /c/apis && mkdir 02-api-ciudades && cd 02-api-ciudades

# 2. Node project
npm init -y
npm install json-server@^0.17.4

# 3. Archivos base
mkdir api && touch api/index.js
touch db.json vercel.json .gitignore
mkdir -p public/images

# 4. Probar
npm start

# 5. Git
cd /c/apis
git add 02-api-ciudades
git commit -m "feat: agregar 02-api-ciudades"
git push

# 6. Deploy
cd 02-api-ciudades && vercel --prod
```
