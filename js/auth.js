import { buscarUsuario, registrarUsuario } from "./db.js";

// Elementos del HTML
const formularioLogin = document.getElementById("form-login");
const documentoInput = document.getElementById("documento");

const login = document.getElementById("login");
const configuracion = document.getElementById("configuracion");
const resultado = document.getElementById("resultados");
const historial = document.getElementById("historial");

const cerrarSesion = document.getElementById("cerrar-sesion");

// Mostrar u ocultar las pantallas
function mostrarPantallas(sesionActiva) {

    login.style.display = sesionActiva ? "none" : "";
    configuracion.style.display = sesionActiva ? "" : "none";
    resultado.style.display = sesionActiva ? "" : "none";
    historial.style.display = sesionActiva ? "" : "none";
}

// Inicio de sesión
formularioLogin.addEventListener("submit", async function (evento) {

    evento.preventDefault();

    const documento = documentoInput.value.trim();

    if (!/^[0-9]+$/.test(documento)) {
        alert("Ingresa un documento válido");
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

        // Guardar la sesión activa
        sessionStorage.setItem("documentoActivo", documento);

        mostrarPantallas(true);

    } catch (error) {

        console.error(error);
        alert("Error al iniciar sesión");
    }
});

// Verificar la sesión al recargar
async function verificarSesion() {

    mostrarPantallas(false);

    const documento = sessionStorage.getItem("documentoActivo");

    if (documento) {

        try {

            const usuario = await buscarUsuario(documento);

            if (usuario) {
                mostrarPantallas(true);
            } else {
                sessionStorage.removeItem("documentoActivo");
            }

        } catch (error) {

            console.error(error);
            sessionStorage.removeItem("documentoActivo");
        }
    }
}

// Cerrar sesión
cerrarSesion.addEventListener("click", function () {

    sessionStorage.removeItem("documentoActivo");

    location.reload();
});

// Ejecutar al cargar la página
verificarSesion();