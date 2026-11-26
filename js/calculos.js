/**
 * calculos.js — Cálculo, resultados e historial (Persona 5)
 *
 * Fórmula: nota definitiva = suma(nota × porcentaje) / 100, redondeada a 2 decimales.
 * Estado:  Aprobado si la nota definitiva (ya redondeada) es >= 3.0; si no, Reprobado.
 */
import { guardarCalculo, obtenerHistorial } from "./db.js";

export const NOTA_APROBACION = 3.0;

/** Redondea a `decimales`, evitando errores de coma flotante (p. ej. 1.005 -> 1.01). */
export function redondear(numero, decimales = 2) {
    return Number(Math.round(Number(numero.toFixed(10) + "e" + decimales)) + "e-" + decimales);
}

/** @param {{nota:number, porcentaje:number}[]} datos */
export function calcularNotaDefinitiva(datos) {
    const suma = datos.reduce((total, { nota, porcentaje }) => total + nota * porcentaje, 0);
    return redondear(suma / 100, 2);
}

export function determinarEstado(notaDefinitiva) {
    return notaDefinitiva >= NOTA_APROBACION ? "Aprobado" : "Reprobado";
}

/* ----------------------------- Parte visual ----------------------------- */

const porId = (id) => document.getElementById(id);

function aplicarEstado(elemento, estado) {
    elemento.textContent = estado;
    elemento.classList.toggle("aprobado", estado === "Aprobado");
    elemento.classList.toggle("reprobado", estado === "Reprobado");
}

export function reiniciarResultado() {
    porId("nota-definitiva").textContent = "--";
    const estado = porId("estado");
    estado.textContent = "Pendiente de cálculo";
    estado.classList.remove("aprobado", "reprobado");
}

export async function cargarHistorial(documento) {
    const cuerpo = porId("tabla-historial");
    let calculos = [];

    try {
        calculos = await obtenerHistorial(documento);
    } catch (error) {
        console.error(error);
        cuerpo.replaceChildren(crearFilaMensaje("No se pudo cargar el historial."));
        return;
    }

    if (calculos.length === 0) {
        cuerpo.replaceChildren(crearFilaMensaje("Aún no hay cálculos guardados."));
        return;
    }

    cuerpo.replaceChildren(...calculos.map((calculo) => {
        const fila = document.createElement("tr");
        const celdas = [
            new Date(calculo.fecha).toLocaleString("es-CO"),
            calculo.notaDefinitiva.toFixed(2),
            calculo.estado
        ].map((texto) => {
            const td = document.createElement("td");
            td.textContent = texto;
            return td;
        });
        celdas[2].classList.add(calculo.estado === "Aprobado" ? "aprobado" : "reprobado");
        fila.append(...celdas);
        return fila;
    }));
}

function crearFilaMensaje(texto) {
    const fila = document.createElement("tr");
    const celda = document.createElement("td");
    celda.colSpan = 3;
    celda.textContent = texto;
    fila.append(celda);
    return fila;
}

/** Calcula, muestra, guarda en IndexedDB y refresca el historial. */
export async function procesarCalculo(documento, datos) {
    if (!documento) return; // sin sesión no se calcula ni se guarda

    const notaDefinitiva = calcularNotaDefinitiva(datos);
    const estado = determinarEstado(notaDefinitiva);

    porId("nota-definitiva").textContent = notaDefinitiva.toFixed(2);
    aplicarEstado(porId("estado"), estado);

    try {
        await guardarCalculo({ documento, notaDefinitiva, estado, notas: datos });
        await cargarHistorial(documento);
    } catch (error) {
        console.error(error);
        porId("mensaje-error").textContent = "Se calculó la nota, pero no se pudo guardar en el historial.";
    }
}

export function iniciarResultados({ alNuevoCalculo = () => {} } = {}) {
    porId("nuevo-calculo").addEventListener("click", () => {
        reiniciarResultado();
        alNuevoCalculo();
    });
}
