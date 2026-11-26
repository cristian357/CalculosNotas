import "fake-indexeddb/auto";
import test from "node:test";
import assert from "node:assert/strict";
import { buscarUsuario, registrarUsuario, guardarCalculo, obtenerHistorial, abrirBD } from "../js/db.js";

test("crea los almacenes usuarios y calculos con el índice documento", async () => {
  const db = await abrirBD();
  assert.deepEqual([...db.objectStoreNames].sort(), ["calculos", "usuarios"]);
  const tx = db.transaction("calculos");
  assert.ok(tx.objectStore("calculos").indexNames.contains("documento"));
});
test("registrar y buscar usuario", async () => {
  assert.equal(await buscarUsuario("111"), undefined);
  const u = await registrarUsuario("111");
  assert.equal(u.documento, "111");
  assert.equal((await buscarUsuario("111")).documento, "111");
});
test("no permite registrar dos veces el mismo documento", async () => {
  await registrarUsuario("222");
  await assert.rejects(() => registrarUsuario("222"));
});
test("guardar y consultar historial (orden reciente primero, aislado por documento)", async () => {
  await guardarCalculo({ documento: "A", notaDefinitiva: 3.5, estado: "Aprobado", notas: [{nota:3.5,porcentaje:100}] });
  await guardarCalculo({ documento: "B", notaDefinitiva: 1, estado: "Reprobado", notas: [] });
  await guardarCalculo({ documento: "A", notaDefinitiva: 2.5, estado: "Reprobado", notas: [] });
  const h = await obtenerHistorial("A");
  assert.equal(h.length, 2);
  assert.deepEqual(h.map(c => c.notaDefinitiva), [2.5, 3.5]);
  assert.equal((await obtenerHistorial("B")).length, 1);
  assert.deepEqual(await obtenerHistorial("Z"), []);
});
