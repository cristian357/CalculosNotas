/**
 * db.js — Módulo de base de datos (IndexedDB)
 *
 * Base: CalculosNotasDB (versión 1)
 *  - usuarios: keyPath "documento"           -> { documento, fechaRegistro }
 *  - calculos: keyPath "id" (autoincremento) -> { id, documento, fecha, notaDefinitiva, estado, notas[] }
 *               índice "documento" (no único) para consultar el historial de cada estudiante.
 */
const NOMBRE_BD = "CalculosNotasDB";
const VERSION_BD = 1;

let conexion = null; // La conexión se abre una sola vez y se reutiliza

export function soportaIndexedDB() {
    return typeof indexedDB !== "undefined" && indexedDB !== null;
}

/** Abre (o reutiliza) la conexión con IndexedDB. */
export function abrirBD() {
    if (conexion) return conexion;

    conexion = new Promise((resolve, reject) => {
        if (!soportaIndexedDB()) {
            reject(new Error("Este navegador no soporta IndexedDB"));
            return;
        }

        const solicitud = indexedDB.open(NOMBRE_BD, VERSION_BD);

        solicitud.onupgradeneeded = function (evento) {
            const db = evento.target.result;

            if (!db.objectStoreNames.contains("usuarios")) {
                db.createObjectStore("usuarios", { keyPath: "documento" });
            }

            if (!db.objectStoreNames.contains("calculos")) {
                const calculos = db.createObjectStore("calculos", {
                    keyPath: "id",
                    autoIncrement: true
                });
                calculos.createIndex("documento", "documento", { unique: false });
            }
        };

        solicitud.onsuccess = function () {
            const db = solicitud.result;
            // Si otra pestaña actualiza la BD, se cierra para no bloquearla
            db.onversionchange = function () {
                db.close();
                conexion = null;
            };
            resolve(db);
        };

        solicitud.onerror = function () {
            reject(solicitud.error);
        };

        solicitud.onblocked = function () {
            reject(new Error("La base de datos está bloqueada por otra pestaña abierta"));
        };
    });

    // Si falla, la próxima llamada vuelve a intentar abrir la BD
    conexion.catch(() => { conexion = null; });
    return conexion;
}

/**
 * Ejecuta una operación sobre un almacén y devuelve su resultado cuando
 * la transacción termina con éxito. Rechaza si la transacción se aborta.
 */
async function ejecutar(almacen, modo, operacion) {
    const db = await abrirBD();

    return new Promise((resolve, reject) => {
        const transaccion = db.transaction(almacen, modo);
        const solicitud = operacion(transaccion.objectStore(almacen));
        let resultado;

        solicitud.onsuccess = () => { resultado = solicitud.result; };
        transaccion.oncomplete = () => resolve(resultado);
        transaccion.onabort = () => reject(transaccion.error || solicitud.error);
    });
}

/** Busca un estudiante por documento. Devuelve el usuario o undefined. */
export function buscarUsuario(documento) {
    return ejecutar("usuarios", "readonly", (almacen) => almacen.get(documento));
}

/** Registra un estudiante nuevo. Rechaza si el documento ya existe. */
export async function registrarUsuario(documento) {
    const usuario = { documento, fechaRegistro: new Date().toISOString() };
    await ejecutar("usuarios", "readwrite", (almacen) => almacen.add(usuario));
    return usuario;
}

/** Guarda un cálculo. Devuelve el registro guardado (con su id). */
export async function guardarCalculo({ documento, notaDefinitiva, estado, notas }) {
    const registro = {
        documento,
        fecha: new Date().toISOString(),
        notaDefinitiva,
        estado,
        notas
    };
    const id = await ejecutar("calculos", "readwrite", (almacen) => almacen.add(registro));
    return { ...registro, id };
}

/** Devuelve los cálculos de un estudiante, del más reciente al más antiguo. */
export async function obtenerHistorial(documento) {
    const calculos = await ejecutar("calculos", "readonly", (almacen) =>
        almacen.index("documento").getAll(documento)
    );
    return calculos.sort((a, b) => b.id - a.id);
}
