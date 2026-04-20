# Guía de consultas — json-server

Base local: `http://localhost:3000`
Recurso: `/products`

---

## Básico

| URL | Qué devuelve |
|---|---|
| `/products` | Todos los productos |
| `/products/5` | Solo el producto con `id: 5` |

---

## Filtros por campo (`?campo=valor`)

Cualquier campo del objeto se puede usar como filtro.

| URL | Qué devuelve |
|---|---|
| `/products?categoria=Mujeres` | Todos los de categoría "Mujeres" |
| `/products?tipo=Calzado` | Todos los de tipo "Calzado" |
| `/products?categoria=Niños&tipo=Calzado` | Combina filtros (AND) |
| `/products?precio=150` | Productos que cuestan exactamente 150 |

**Ojo:** los valores son **case-sensitive**. `mujeres` ≠ `Mujeres`.

---

## Múltiples valores del mismo campo (OR)

Repite el parámetro:

```
/products?categoria=Hombres&categoria=Mujeres
```
→ Hombres **o** Mujeres (excluye Niños).

---

## Rangos numéricos

Sufijos `_gte`, `_lte`, `_gt`, `_lt`, `_ne`:

| URL | Significado |
|---|---|
| `/products?precio_gte=100` | precio ≥ 100 |
| `/products?precio_lte=50` | precio ≤ 50 |
| `/products?precio_gte=50&precio_lte=150` | entre 50 y 150 |
| `/products?precio_ne=150` | precio distinto de 150 |

---

## Búsqueda de texto (full-text)

`q` busca en **todos los campos de texto**:

```
/products?q=lana
```
→ Devuelve cualquier producto donde aparezca "lana" (nombre, descripción, categoría…).

---

## Ordenar

`_sort` elige el campo, `_order` la dirección (`asc` por defecto).

| URL | Qué hace |
|---|---|
| `/products?_sort=precio` | Orden ascendente por precio |
| `/products?_sort=precio&_order=desc` | Descendente |
| `/products?_sort=categoria,precio` | Por varios campos |

---

## Paginación

`_page` y `_limit`:

```
/products?_page=1&_limit=5
```
→ Primeros 5. Para la página 2: `_page=2&_limit=5`.

Sin `_limit`, cada página son 10 por defecto.

La respuesta incluye cabeceras HTTP útiles:
- `X-Total-Count`: total de items (para calcular páginas)
- `Link`: enlaces a first/prev/next/last

---

## Limitar resultados (slicing)

`_start` y `_end` (o `_limit`):

```
/products?_start=0&_end=3      → índices 0, 1, 2
/products?_start=5&_limit=2    → desde el 5, trae 2
```

---

## Operadores combinados — ejemplo real

> "Calzado de mujer por menos de 100, ordenado por precio ascendente, primeros 3"

```
/products?categoria=Mujeres&tipo=Calzado&precio_lte=100&_sort=precio&_order=asc&_limit=3
```

Todo se encadena con `&`.

---

## Desde el frontend (fetch)

```js
const params = new URLSearchParams({
  categoria: 'Mujeres',
  tipo: 'Calzado',
  precio_lte: 100,
  _sort: 'precio',
  _order: 'asc'
});

const res = await fetch(`http://localhost:3000/products?${params}`);
const data = await res.json();
```

`URLSearchParams` se encarga de codificar tildes y espacios por ti (importante: `Niños` se convierte en `Ni%C3%B1os`).

---

## Operaciones de escritura (local solo)

json-server acepta los métodos estándar. Úsalos desde Thunder Client / Postman / `fetch`:

| Método | URL | Cuerpo | Qué hace |
|---|---|---|---|
| `POST` | `/products` | JSON del nuevo producto (sin `id`) | Crea uno nuevo |
| `PUT` | `/products/5` | JSON completo | Reemplaza el producto 5 |
| `PATCH` | `/products/5` | JSON parcial | Actualiza solo los campos enviados |
| `DELETE` | `/products/5` | — | Borra el producto 5 |

Los cambios se escriben en `db.json`. **En producción sobre Vercel esto NO persiste** (el sistema de archivos es efímero), así que la API pública será de solo lectura efectiva.

---

## Referencia

Documentación oficial: <https://github.com/typicode/json-server/tree/v0> (rama v0, la que usamos).
