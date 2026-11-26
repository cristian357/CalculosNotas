// Flujo completo sobre el index.html real: login -> notas -> resultado -> historial -> recarga
import "fake-indexeddb/auto";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { JSDOM } from "jsdom";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8").replace(/<script[\s\S]*?<\/script>/, "");
const espera = (ms = 60) => new Promise(r => setTimeout(r, ms));
let dom, d, alertas = [];

async function cargarPagina(n) {          // simula abrir/recargar la página
  dom = new JSDOM(html, { url: "http://localhost/" });
  d = dom.window.document;
  Object.assign(globalThis, { document: d, location: { reload() {} }, alert: (m) => alertas.push(m) });
  if (!globalThis.sessionStorage) globalThis.sessionStorage = new Map(); // se conserva entre "recargas"
  await import("../js/main.js?carga=" + n);
  await espera();
}
const $ = (id) => d.getElementById(id);
const visible = (id) => !$(id).hidden;
const escribir = (id, v) => { $(id).value = v; $(id).dispatchEvent(new dom.window.Event("input", { bubbles: true })); };
const enviar = (id) => $(id).dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));

// sessionStorage mínimo compatible con la API usada
globalThis.sessionStorage = (() => { const m = new Map(); return { getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; })();

test("sin sesión solo se ve el login", async () => {
  await cargarPagina(1);
  assert.equal(visible("login"), true);
  for (const id of ["configuracion", "resultados", "historial"]) assert.equal(visible(id), false);
});
test("documento inválido muestra mensaje y no entra", async () => {
  escribir("documento", "12ab"); enviar("form-login"); await espera();
  assert.match($("mensaje-login").textContent, /válido/);
  assert.equal(visible("login"), true);
});
test("estudiante nuevo se registra y entra", async () => {
  escribir("documento", "1088123456"); enviar("form-login"); await espera(150);
  assert.deepEqual(alertas, ["Estudiante registrado correctamente"]);
  assert.equal(visible("login"), false);
  assert.equal(visible("historial"), true);
  assert.match($("tabla-historial").textContent, /Aún no hay cálculos/);
});
test("generar campos, validar y calcular", async () => {
  escribir("cantidad", "3"); $("generar-campos").click();
  assert.equal(d.querySelectorAll(".fila-nota").length, 3);

  // porcentajes que suman 90 -> error y no se calcula
  ["4","3","5"].forEach((v,i)=>escribir(`nota-${i+1}`, v));
  ["30","30","30"].forEach((v,i)=>escribir(`porcentaje-${i+1}`, v));
  assert.equal($("total-porcentaje").textContent, "90");
  enviar("form-notas"); await espera();
  assert.match($("mensaje-error").textContent, /suman 90%/);
  assert.equal($("nota-definitiva").textContent, "--");

  // corregir a 100 -> 4*30+3*30+5*40 = 410/100 = 4.10
  escribir("porcentaje-3", "40");
  enviar("form-notas"); await espera(150);
  assert.equal($("mensaje-error").textContent, "");
  assert.equal($("nota-definitiva").textContent, "4.10");
  assert.equal($("estado").textContent, "Aprobado");
  assert.ok($("estado").classList.contains("aprobado"));
  assert.equal(d.querySelectorAll("#tabla-historial tr").length, 1);
});
test("segundo cálculo reprobado queda de primero en el historial", async () => {
  $("nuevo-calculo").click();
  assert.equal($("nota-definitiva").textContent, "--");
  assert.equal(d.querySelectorAll(".fila-nota").length, 0);
  escribir("cantidad", "2"); $("generar-campos").click();
  escribir("nota-1", "2,5"); escribir("porcentaje-1", "50");
  escribir("nota-2", "2");   escribir("porcentaje-2", "50");
  enviar("form-notas"); await espera(150);
  assert.equal($("nota-definitiva").textContent, "2.25");
  assert.equal($("estado").textContent, "Reprobado");
  const filas = [...d.querySelectorAll("#tabla-historial tr")].map(tr => tr.textContent);
  assert.equal(filas.length, 2);
  assert.match(filas[0], /2\.25.*Reprobado/);
  assert.match(filas[1], /4\.10.*Aprobado/);
});
test("al recargar se mantiene la sesión y el historial", async () => {
  await cargarPagina(2);
  assert.equal(visible("login"), false);
  assert.equal(visible("historial"), true);
  assert.equal(d.querySelectorAll("#tabla-historial tr").length, 2);
});
test("documento existente: 'Bienvenido nuevamente'; cerrar sesión limpia la sesión", async () => {
  $("cerrar-sesion").click();
  assert.equal(sessionStorage.getItem("documentoActivo"), null);
  await cargarPagina(3);
  assert.equal(visible("login"), true);
  alertas = [];
  escribir("documento", "1088123456"); enviar("form-login"); await espera(150);
  assert.deepEqual(alertas, ["Bienvenido nuevamente"]);
  assert.equal(d.querySelectorAll("#tabla-historial tr").length, 2);
});
test("sesión con documento inexistente en la BD se descarta", async () => {
  sessionStorage.setItem("documentoActivo", "999999");
  await cargarPagina(4);
  assert.equal(visible("login"), true);
  assert.equal(sessionStorage.getItem("documentoActivo"), null);
});
