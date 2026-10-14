# Firma Digital Pro — GitHub Pages

Aplicación estática para colocar imágenes PNG de firma en archivos PDF desde el navegador. No requiere Python, Flask, servidor propio ni base de datos.

## Publicar en GitHub Pages

1. Crea un repositorio en GitHub, por ejemplo `firma-digital-pro`.
2. Sube el contenido de esta carpeta a la **raíz** del repositorio: `index.html`, `assets/` y este README.
3. En GitHub abre **Settings → Pages**.
4. En **Build and deployment**, selecciona **Deploy from a branch**.
5. Elige la rama `main` y la carpeta `/(root)` y guarda.
6. Espera a que termine el despliegue. GitHub mostrará la dirección pública del sitio en esa misma sección.

## Funciones

- Carga varios archivos PDF y hasta cinco imágenes PNG.
- Vista previa de la primera página del PDF seleccionado.
- Colocación de firmas mediante clic o arrastre.
- Aplica las posiciones seleccionadas a la primera página de cada PDF.
- Descarga los resultados agrupados en un ZIP.
- Los documentos se procesan en el navegador; no se cargan a un servidor de esta aplicación.

## Consideraciones

- Se necesita conexión a Internet para cargar las bibliotecas PDF.js, pdf-lib y JSZip desde CDN.
- Esta herramienta inserta una imagen visual; **no crea una firma electrónica certificada**, no valida identidad ni sustituye un certificado digital.
- Antes de usarla con documentos importantes, valida el resultado con copias de prueba. Algunos PDF cifrados, dañados o con características especiales pueden no procesarse.
- Las posiciones se calculan a partir de la vista previa; conviene probar documentos con diferentes tamaños de página.
- El repositorio puede ser público, pero no subas documentos, firmas personales, PDF procesados ni datos reales.

## Estructura

```text
firmadigitalpro/
├── index.html
├── README.md
└── assets/
    ├── app.js
    └── styles.css
```
