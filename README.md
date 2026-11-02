# APIs

APIs REST propias que alimentan mis proyectos frontend. Cada carpeta es una API independiente hecha con
`json-server` y desplegada en Vercel como función serverless.

| API | Qué sirve | Endpoints | La usa |
|---|---|---|---|
| [`00-portfolio-projects`](00-portfolio-projects) | Los proyectos y el perfil de mi portfolio | [`/projects`](https://00-portfolio-projects-api.vercel.app/projects) · [`/profile`](https://00-portfolio-projects-api.vercel.app/profile) | [nico-villagran.com](https://nico-villagran.com) |
| [`01-products-api`](01-products-api) | Un catálogo de 50 productos de ropa | [`/products`](https://01-products-api.vercel.app/products) | Dos tiendas de práctica en React |

Están pensadas para leer: `json-server` acepta escrituras, pero en Vercel no se guardan entre peticiones.

¿Cómo se monta una nueva? Lo dejé escrito paso a paso en [COMO-CREAR-UNA-API.md](COMO-CREAR-UNA-API.md).
