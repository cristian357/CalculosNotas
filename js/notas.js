/**
 * notas.js — Ingreso de notas y validaciones (Persona 4)
 *
 * - Genera dinámicamente los campos "nota" y "porcentaje".
 * - Valida: campos vacíos, valores no numéricos, notas entre 0.0 y 5.0,
 *   porcentajes entre 0 y 100 y suma de porcentajes exactamente igual a 100.
 * - Si todo es válido llama a `alCalcular([{ nota, porcentaje }, ...])`.
 */
export const NOTA_MIN = 0;
export const NOTA_MAX = 5;
export const TOTAL_PORCENTAJE = 100;
export const MAX_NOTAS = 20; // límite de seguridad para no generar formularios gigantes

const PATRON_NUMERO = /^-?\d+(\.\d+)?$/;

/** Convierte texto a número. Acepta coma o punto decimal. */
function leerNumero(texto) {
    const limpio = String(texto ?? "").trim().replace(",", ".");
    if (limpio === "") return { error: "vacio" };
    if (!PATRON_NUMERO.test(limpio)) return { error: "invalido" };
    return { valor: Number(limpio) };
}

/** Valida la cantidad de notas (entero entre 1 y MAX_NOTAS). */
export function validarCantidad(texto) {
    const limpio = String(texto ?? "").trim();
    if (!/^\d+$/.test(limpio)) {
        return { ok: false, mensaje: "Ingresa la cantidad de notas como un número entero." };
    }
    const valor = Number(limpio);
    if (valor < 1 || valor > MAX_NOTAS) {
        return { ok: false, mensaje: `La cantidad de notas debe estar entre 1 y ${MAX_NOTAS}.` };
    }
    return { ok: true, valor };
}

function revisarCampo(etiqueta, texto, min, max, rango) {
    const numero = leerNumero(texto);
    if (numero.error === "vacio") return { error: `${etiqueta}: el campo está vacío.` };
    if (numero.error) return { error: `${etiqueta}: debe ser un número.` };
    if (numero.valor < min || numero.valor > max) {
        return { error: `${etiqueta}: debe estar entre ${rango}.` };
    }
    return { valor: numero.valor };
}

/** Suma los porcentajes válidos (en centésimas para evitar errores de coma flotante). */
export function sumarPorcentajes(filas) {
    const centesimas = filas.reduce((suma, fila) => {
        const p = leerNumero(fila.porcentaje);
        return p.error ? suma : suma + Math.round(p.valor * 100);
    }, 0);
    return centesimas / 100;
}

/**
 * Valida todas las filas. Devuelve { ok, errores[], datos[] }.
 * `datos` solo se llena cuando ok es true.
 */
export function validarNotas(filas) {
    const errores = [];
    const datos = [];
    let porcentajesValidos = true;

    if (filas.length === 0) {
        return { ok: false, errores: ["Primero genera los campos de notas."], datos };
    }

    filas.forEach((fila, indice) => {
        const n = indice + 1;
        const nota = revisarCampo(`Nota ${n}`, fila.nota, NOTA_MIN, NOTA_MAX, "0.0 y 5.0");
        const pct = revisarCampo(`Porcentaje ${n}`, fila.porcentaje, 0, TOTAL_PORCENTAJE, "0 y 100");

        if (nota.error) errores.push(nota.error);
        if (pct.error) { errores.push(pct.error); porcentajesValidos = false; }
        if (!nota.error && !pct.error) datos.push({ nota: nota.valor, porcentaje: pct.valor });
    });

    if (porcentajesValidos) {
        const total = sumarPorcentajes(filas);
        if (Math.round(total * 100) !== TOTAL_PORCENTAJE * 100) {
            errores.push(`Los porcentajes suman ${total}% y deben sumar exactamente ${TOTAL_PORCENTAJE}%.`);
        }
    }

    return { ok: errores.length === 0, errores, datos: errores.length === 0 ? datos : [] };
}

/* ----------------------------- Parte visual ----------------------------- */

function crearCampo(id, etiqueta, campo, placeholder) {
    const div = document.createElement("div");
    const label = document.createElement("label");
    const input = document.createElement("input");

    label.htmlFor = id;
    label.textContent = etiqueta;
    input.type = "text";
    input.inputMode = "decimal";
    input.id = id;
    input.placeholder = placeholder;
    input.dataset.campo = campo;
    input.autocomplete = "off";

    div.append(label, input);
    return div;
}

function leerFilas(contenedor) {
    return [...contenedor.querySelectorAll(".fila-nota")].map((fila) => ({
        nota: fila.querySelector('[data-campo="nota"]').value,
        porcentaje: fila.querySelector('[data-campo="porcentaje"]').value
    }));
}

export function iniciarNotas({ alCalcular }) {
    const contenedor = document.getElementById("contenedor-notas");
    const cantidadInput = document.getElementById("cantidad");
    const total = document.getElementById("total-porcentaje");
    const error = document.getElementById("mensaje-error");

    const actualizarTotal = () => { total.textContent = sumarPorcentajes(leerFilas(contenedor)); };

    document.getElementById("generar-campos").addEventListener("click", () => {
        const cantidad = validarCantidad(cantidadInput.value);
        if (!cantidad.ok) {
            error.textContent = cantidad.mensaje;
            return;
        }

        error.textContent = "";
        contenedor.replaceChildren();
        for (let i = 1; i <= cantidad.valor; i++) {
            const fila = document.createElement("div");
            fila.className = "fila-nota";
            fila.append(
                crearCampo(`nota-${i}`, `Nota ${i}`, "nota", "0.0 a 5.0"),
                crearCampo(`porcentaje-${i}`, `Porcentaje ${i} (%)`, "porcentaje", "Ej: 30")
            );
            contenedor.append(fila);
        }
        actualizarTotal();
    });

    contenedor.addEventListener("input", actualizarTotal);

    document.getElementById("form-notas").addEventListener("submit", (evento) => {
        evento.preventDefault();
        const resultado = validarNotas(leerFilas(contenedor));

        if (!resultado.ok) {
            error.textContent = resultado.errores.join("\n");
            return;
        }
        error.textContent = "";
        alCalcular(resultado.datos);
    });
}

/** Deja el módulo listo para un nuevo cálculo. */
export function reiniciarNotas() {
    document.getElementById("contenedor-notas").replaceChildren();
    document.getElementById("cantidad").value = "";
    document.getElementById("total-porcentaje").textContent = "0";
    document.getElementById("mensaje-error").textContent = "";
}
