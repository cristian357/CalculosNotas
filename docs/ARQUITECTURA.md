# Documentación técnica

## Relación entre archivos
```
index.html ── css/estilo.css
    └── js/main.js
          ├── auth.js ──► db.js   (buscarUsuario, registrarUsuario)
          ├── notas.js            (validaciones; sin dependencias)
          └── calculos.js ► db.js (guardarCalculo, obtenerHistorial)
```
`main.js` es el único que conoce a todos los módulos:
- `auth` avisa a `calculos.cargarHistorial(documento)` cuando hay sesión válida.
- `notas` entrega los datos ya validados a `calculos.procesarCalculo(documentoActivo, datos)`.
- El botón "Nuevo cálculo" (`calculos`) limpia el formulario con `notas.reiniciarNotas()`.

## Responsabilidades
| Módulo | Responsabilidad | Exporta (principal) |
|---|---|---|
| `db.js` | Única puerta de acceso a IndexedDB. Reutiliza una sola conexión. | `abrirBD`, `buscarUsuario`, `registrarUsuario`, `guardarCalculo`, `obtenerHistorial` |
| `auth.js` | Login, registro automático, sesión, mostrar/ocultar pantallas. | `iniciarAutenticacion`, `obtenerDocumentoActivo`, `documentoValido` |
| `notas.js` | Campos dinámicos y validación. | `iniciarNotas`, `validarNotas`, `validarCantidad`, `sumarPorcentajes`, `reiniciarNotas` |
| `calculos.js` | Fórmula, estado, resultado, guardado e historial. | `calcularNotaDefinitiva`, `determinarEstado`, `procesarCalculo`, `cargarHistorial` |

## Decisiones de diseño
- **Transacciones:** `db.js` resuelve cada operación al terminar la transacción (`oncomplete`) y rechaza en `onabort`, por eso un documento duplicado produce un error capturable.
- **Porcentajes:** la suma se hace en centésimas enteras para que 33.33 + 33.33 + 33.34 dé exactamente 100 sin errores de coma flotante.
- **Redondeo:** `redondear()` corrige casos como 1.005 → 1.01. El estado se decide con la nota ya redondeada, la misma que ve el usuario.
- **Sesión:** `sessionStorage` solo guarda el documento; se revalida en IndexedDB al cargar. Es control de acceso del lado del cliente (no hay servidor).
- **Seguridad de DOM:** todo texto se inserta con `textContent`, nunca `innerHTML`.
- **Límite de 20 notas:** protección técnica añadida; se cambia en `MAX_NOTAS` (`notas.js`).

## Manejo de errores
| Situación | Comportamiento |
|---|---|
| Documento vacío/no numérico | Mensaje bajo el campo, sin consultar la BD |
| IndexedDB no disponible o bloqueada | Mensaje en el login; el acceso no se concede |
| Campos vacíos, no numéricos, fuera de rango, suma ≠ 100 | Lista de errores; no se calcula ni se guarda |
| Falla al guardar el cálculo | Se muestra la nota y un aviso de que no se guardó |
| Falla al leer el historial | Mensaje en la tabla |
