/**
 * auth.js — Inicio de sesión y registro por número de documento (Persona 3)
 *
 * - Documento existente en IndexedDB -> ingresa.
 * - Documento nuevo                  -> se registra y luego ingresa.
 * - La sesión se guarda en sessionStorage ("documentoActivo") y se revalida
 *   contra IndexedDB al recargar la página.
 * - Las pantallas de configuración, resultados e historial permanecen ocultas
 *   mientras no haya sesión válida.
 */
import { buscarUsuario, registrarUsuario } from "./db.js";

const CLAVE_SESION = "documentoActivo";

export function documentoValido(documento) {
    return /^[0-9]+$/.test(documento);
}

export function obtenerDocumentoActivo() {
    try {
        return sessionStorage.getItem(CLAVE_SESION);
    } catch {
        return null;
    }
}

/**
 * Conecta el formulario de login. `alIniciarSesion(documento)` se ejecuta cada
 * vez que hay una sesión válida (login nuevo o sesión recuperada al recargar).
 */
export function iniciarAutenticacion({ alIniciarSesion = () => {} } = {}) {
    const porId = (id) => document.getElementById(id);
    const login = porId("login");
    const privadas = ["configuracion", "resultados", "historial"].map(porId);
    const documentoInput = porId("documento");
    const mensaje = porId("mensaje-login");

    function mostrarPantallas(sesionActiva) {
        login.hidden = sesionActiva;
        privadas.forEach((pantalla) => { pantalla.hidden = !sesionActiva; });
    }

    function activarSesion(documento) {
        sessionStorage.setItem(CLAVE_SESION, documento);
        mostrarPantallas(true);
        alIniciarSesion(documento);
    }

    porId("form-login").addEventListener("submit", async function (evento) {
        evento.preventDefault();
        mensaje.textContent = "";

        const documento = documentoInput.value.trim();

        if (!documentoValido(documento)) {
            mensaje.textContent = "Ingresa un documento válido (solo números).";
            return;
        }

        try {
            let usuario = await buscarUsuario(documento);

            if (!usuario) {
                usuario = await registrarUsuario(documento);
                alert("Estudiante registrado correctamente");
            } else {
                alert("Bienvenido nuevamente");
            }

            activarSesion(documento);
        } catch (error) {
            console.error(error);
            mensaje.textContent = "Error al iniciar sesión: " + (error.message || "intenta de nuevo.");
        }
    });

    porId("cerrar-sesion").addEventListener("click", function () {
        sessionStorage.removeItem(CLAVE_SESION);
        location.reload();
    });

    // Al cargar: recuperar la sesión si el documento sigue registrado
    (async function verificarSesion() {
        const documento = obtenerDocumentoActivo();

        if (documento) {
            try {
                if (await buscarUsuario(documento)) {
                    activarSesion(documento);
                    return;
                }
            } catch (error) {
                console.error(error);
            }
            sessionStorage.removeItem(CLAVE_SESION);
        }
        mostrarPantallas(false);
    })();
}
