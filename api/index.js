// ─────────────────────────────────────────────────────────────
//  api/index.js  —  Handler serverless para Vercel
// ─────────────────────────────────────────────────────────────
//
//  CONTEXTO:
//  En LOCAL, el comando `npm start` (definido en package.json) ejecuta:
//      json-server --watch db.json --port 3000
//  Eso levanta un servidor de Node que escucha en el puerto 3000.
//
//  En VERCEL no funciona así. Vercel no ejecuta servidores permanentes:
//  ejecuta FUNCIONES (serverless). Cuando llega una petición HTTP,
//  arranca este archivo, atiende la petición, y se apaga.
//
//  Por eso aquí NO llamamos a `.listen(3000)`. En su lugar, exportamos
//  el objeto `server` y Vercel se encarga de invocarlo por nosotros.
//
//  Cualquier archivo dentro de la carpeta `api/` de un proyecto Vercel
//  se convierte automáticamente en un endpoint. Con el `vercel.json`
//  que crearemos, redirigimos TODAS las rutas a este único archivo
//  para que json-server maneje el ruteo internamente.
// ─────────────────────────────────────────────────────────────

// 1) Importamos json-server. Es la misma librería que usas en local.
const jsonServer = require('json-server');

// 2) Creamos una instancia del servidor (un Express por debajo, realmente).
const server = jsonServer.create();

// 3) Le indicamos de dónde leer los datos. La ruta es relativa a la raíz
//    del proyecto desplegado en Vercel, donde vive db.json.
const router = jsonServer.router('db.json');

// 4) Middlewares por defecto de json-server: logger, CORS básico,
//    parseo de JSON en el body, servir la home page, etc.
const middlewares = jsonServer.defaults();

// 5) Enchufamos los middlewares al servidor.
server.use(middlewares);

// 6) Enchufamos el router (lo que convierte /products, /products/5, etc.
//    en respuestas a partir del db.json).
server.use(router);

// 7) Exportamos. Vercel espera un "handler" exportado por defecto:
//    una función (o un objeto Express, que ES una función) que recibe
//    (req, res). Al exportar `server`, Vercel lo invoca en cada petición.
module.exports = server;
