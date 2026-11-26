import test from "node:test";
import assert from "node:assert/strict";
import { calcularNotaDefinitiva, determinarEstado, redondear } from "../js/calculos.js";
import { validarNotas, validarCantidad } from "../js/notas.js";
import { documentoValido } from "../js/auth.js";

const f = (nota, porcentaje) => ({ nota, porcentaje });

test("promedio ponderado", () => {
  assert.equal(calcularNotaDefinitiva([{nota:4,porcentaje:50},{nota:3,porcentaje:50}]), 3.5);
  assert.equal(calcularNotaDefinitiva([{nota:5,porcentaje:30},{nota:2,porcentaje:30},{nota:3.5,porcentaje:40}]), 3.5);
});
test("redondeo a dos decimales", () => {
  assert.equal(calcularNotaDefinitiva([{nota:3.333,porcentaje:100}]), 3.33);
  assert.equal(calcularNotaDefinitiva([{nota:3.145,porcentaje:100}]), 3.15);
  assert.equal(redondear(1.005), 1.01);
});
test("estado aprobado/reprobado", () => {
  assert.equal(determinarEstado(3.0), "Aprobado");
  assert.equal(determinarEstado(2.99), "Reprobado");
  assert.equal(determinarEstado(5), "Aprobado");
  assert.equal(determinarEstado(0), "Reprobado");
});
test("validación: caso válido (con coma decimal)", () => {
  const r = validarNotas([f("4,5","60"), f("3","40")]);
  assert.equal(r.ok, true);
  assert.deepEqual(r.datos, [{nota:4.5,porcentaje:60},{nota:3,porcentaje:40}]);
});
test("validación: porcentajes menores y mayores a 100", () => {
  assert.equal(validarNotas([f("4","50"), f("3","40")]).ok, false);
  assert.equal(validarNotas([f("4","60"), f("3","50")]).ok, false);
});
test("validación: suma 100 con decimales (33.33+33.33+33.34)", () => {
  assert.equal(validarNotas([f("1","33.33"), f("2","33.33"), f("3","33.34")]).ok, true);
});
test("validación: notas fuera de rango", () => {
  assert.equal(validarNotas([f("-0.1","50"), f("3","50")]).ok, false);
  assert.equal(validarNotas([f("5.1","50"), f("3","50")]).ok, false);
  assert.equal(validarNotas([f("0","50"), f("5","50")]).ok, true);
});
test("validación: vacíos y no numéricos", () => {
  assert.equal(validarNotas([f("","50"), f("3","50")]).ok, false);
  assert.equal(validarNotas([f("abc","50"), f("3","50")]).ok, false);
  assert.equal(validarNotas([f("1e2","50"), f("3","50")]).ok, false);
  assert.equal(validarNotas([f("3","  "), f("3","100")]).ok, false);
  assert.equal(validarNotas([]).ok, false);
});
test("cantidad de notas", () => {
  assert.equal(validarCantidad("3").ok, true);
  for (const v of ["", "0", "-1", "2.5", "abc", "21"]) assert.equal(validarCantidad(v).ok, false, v);
});
test("documento válido", () => {
  assert.equal(documentoValido("1088123456"), true);
  for (const v of ["", "12a", "12 3", "-1"]) assert.equal(documentoValido(v), false, v);
});
