# Software de Cálculo de Notas Definitivas

Aplicación web que permite a un estudiante ingresar con su número de documento, registrar sus notas con su porcentaje, obtener la nota definitiva (promedio ponderado), ver si aprobó o reprobó y consultar su historial de cálculos.

**Objetivo general:** calcular la nota definitiva de un estudiante de forma correcta y guardar el historial de sus cálculos en el navegador.

## Tecnologías
HTML5 · CSS3 · JavaScript Vanilla (módulos ES) · IndexedDB · Vercel (despliegue). Sin librerías ni frameworks.

## Requisitos
- Un navegador moderno con soporte de IndexedDB y módulos ES (Chrome, Edge, Firefox, Safari actuales).
- Un servidor web local para abrir el proyecto (los módulos ES **no funcionan** abriendo `index.html` con doble clic / `file://`).
- Solo para las pruebas automáticas: Node.js 20 o superior.

## Estructura
```
index.html          Pantallas: login, configuración de notas, resultados, historial
css/estilo.css      Estilos y diseño responsive (breakpoint 768 px)
js/main.js          Punto de entrada: conecta los módulos
js/db.js            IndexedDB: conexión y funciones de datos
js/auth.js          Inicio de sesión, registro y sesión
js/notas.js         Generación de campos y validaciones
js/calculos.js      Fórmula, estado, resultado e historial
tests/              Pruebas automáticas (no se necesitan para ejecutar la app)
docs/ARQUITECTURA.md  Documentación técnica
```

## Ejecutar localmente
No hay que instalar nada. Desde la carpeta del proyecto:
```bash
python3 -m http.server 8000      # o: npx serve .
```
Abre `http://localhost:8000`.

## Funcionamiento
- **Inicio de sesión (`auth.js`):** el estudiante escribe su documento (solo dígitos). Si no existe en `usuarios` se registra automáticamente; si existe, ingresa. La sesión se guarda en `sessionStorage` y al recargar se revalida contra IndexedDB. Sin sesión válida solo se ve el login. **Cerrar sesión** la elimina.
- **Ingreso de notas (`notas.js`):** se indica la cantidad (1 a 20) y se generan los campos nota/porcentaje. Se acepta punto o coma decimal. Al calcular se valida: sin campos vacíos, solo números, notas entre 0.0 y 5.0, porcentajes entre 0 y 100 y suma de porcentajes **exactamente 100 %**. Los errores se muestran con el campo afectado. El total se actualiza mientras se escribe.
- **Cálculo (`calculos.js`):**
  `Nota definitiva = suma(nota × porcentaje) / 100`, redondeada a 2 decimales.
  **Aprobado** si la nota definitiva (ya redondeada) es ≥ 3.0; **Reprobado** si es menor.
- **Historial:** cada cálculo se guarda en IndexedDB y la tabla muestra fecha, nota y estado de los cálculos del estudiante activo, del más reciente al más antiguo.

## Base de datos IndexedDB
Base `CalculosNotasDB`, versión 1.

| Almacén | Clave | Datos |
|---|---|---|
| `usuarios` | `documento` | `documento`, `fechaRegistro` (ISO) |
| `calculos` | `id` (autoincremental) | `documento`, `fecha` (ISO), `notaDefinitiva`, `estado`, `notas` (`[{nota, porcentaje}]`). Índice `documento` (no único) |

Funciones de `db.js`: `abrirBD`, `buscarUsuario`, `registrarUsuario`, `guardarCalculo`, `obtenerHistorial`, `soportaIndexedDB`. Los errores se rechazan como promesas y los módulos los muestran en pantalla.

## Pruebas
```bash
cd tests && npm install && npm test
```
Cubre lógica (fórmula, redondeo, estado, validaciones), IndexedDB y el flujo completo sobre `index.html`.

## Despliegue en Vercel
El proyecto es un sitio estático: no necesita `vercel.json` ni paso de build.
1. Sube la carpeta a un repositorio de GitHub (`index.html` en la raíz).
2. En vercel.com: **Add New → Project** → importa el repositorio.
3. Framework Preset: **Other**. Build Command: vacío. Output Directory: vacío (raíz).
4. **Deploy**. Alternativa con CLI: `npm i -g vercel && vercel --prod` dentro de la carpeta.

Los datos viven en el IndexedDB de cada navegador: no se comparten entre dispositivos ni usuarios.
