/**
 * main.js — Punto de entrada. Conecta los módulos:
 *   auth.js (sesión) -> calculos.js (historial al iniciar sesión)
 *   notas.js (datos validados) -> calculos.js (cálculo y guardado)
 *   calculos.js ("Nuevo cálculo") -> notas.js (limpiar formulario)
 */
import { iniciarAutenticacion, obtenerDocumentoActivo } from "./auth.js";
import { iniciarNotas, reiniciarNotas } from "./notas.js";
import { iniciarResultados, procesarCalculo, cargarHistorial } from "./calculos.js";

iniciarResultados({ alNuevoCalculo: reiniciarNotas });
iniciarNotas({ alCalcular: (datos) => procesarCalculo(obtenerDocumentoActivo(), datos) });
iniciarAutenticacion({ alIniciarSesion: cargarHistorial });
