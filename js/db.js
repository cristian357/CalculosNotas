// Nombre y versión de la base de datos
const nombreBD = "CalculosNotasDB";
const versionBD = 1;

// Función para conectar con IndexedDB
export function abrirBD() {
    return new Promise((resolve, reject) => {

        const solicitud = indexedDB.open(nombreBD, versionBD);

        solicitud.onupgradeneeded = function (evento) {

            const db = evento.target.result;

            // Crear almacén de usuarios
            if (!db.objectStoreNames.contains("usuarios")) {
                db.createObjectStore("usuarios", {
                    keyPath: "documento"
                });
            }

            // Crear almacén de cálculos
            if (!db.objectStoreNames.contains("calculos")) {

                const calculos = db.createObjectStore("calculos", {
                    keyPath: "id",
                    autoIncrement: true
                });

                calculos.createIndex("documento", "documento", {
                    unique: false
                });
            }
        };

        // Conexión exitosa
        solicitud.onsuccess = function (evento) {
            console.log("Base de datos conectada correctamente");
            resolve(evento.target.result);
        };

        // Error de conexión
        solicitud.onerror = function () {
            console.error("Error al conectar la base de datos");
            reject(solicitud.error);
        };
    });
}// Buscar un estudiante por su documento
export async function buscarUsuario(documento) {

    const db = await abrirBD();

    return new Promise((resolve, reject) => {

        const transaccion = db.transaction("usuarios", "readonly");
        const almacen = transaccion.objectStore("usuarios");
        const solicitud = almacen.get(documento);

        solicitud.onsuccess = function () {
            resolve(solicitud.result);
        };

        solicitud.onerror = function () {
            reject(solicitud.error);
        };
    });
}

// Registrar un estudiante nuevo
export async function registrarUsuario(documento) {

    const db = await abrirBD();

    return new Promise((resolve, reject) => {

        const transaccion = db.transaction("usuarios", "readwrite");
        const almacen = transaccion.objectStore("usuarios");

        const usuario = {
            documento: documento,
            fechaRegistro: new Date().toISOString()
        };

        almacen.add(usuario);

        transaccion.oncomplete = function () {
            resolve(usuario);
        };

        transaccion.onabort = function () {
            reject(transaccion.error);
        };
    });
}
