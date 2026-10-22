import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const compile = file => ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const adapter = { exports: {} };
vm.runInNewContext(compile('lib/user/nutrition-adapter.ts'), adapter);
const macros = { caloriesKcal: 300, proteinG: 30, carbohydratesG: 45, fatG: 15 };
const rawEntry = { id: 'entry-1', mealType: 'BREAKFAST', snapshotName: 'Oats', snapshotBrand: null, consumedAmount: 150, consumedUnit: 'G', computed: macros };
const food = { id: 'food-1', name: 'Milk', brand: null, basisAmount: 100, basisUnit: 'ML', ...macros };
function client() {
  const calls = []; let response;
  const context = { exports: {}, require: () => adapter.exports, fetch: async (path, init = {}) => {
    calls.push({ path, ...init }); return response;
  } };
  vm.runInNewContext(compile('lib/user/api-client.ts'), context);
  return { api: context.exports.nutritionApi, calls, reply: (data, status = 200) => { response = new Response(status === 204 ? null : JSON.stringify({ data }), { status }); } };
}
test('API macro names display actual diary values and quantities, including genuine zeroes', async () => {
  const { api, reply } = client();
  reply({ date: '2026-10-22', goal: { id: 'goal', effectiveFrom: '2026-01-01', ...macros }, totals: macros, remaining: { ...macros, caloriesKcal: -10 }, entries: [rawEntry] });
  const diary = await api.diary('2026-10-22');
  assert.equal(diary.entries[0].calories, 300); assert.equal(diary.entries[0].protein, 30); assert.equal(diary.entries[0].carbs, 45); assert.equal(diary.entries[0].fat, 15); assert.equal(diary.entries[0].quantity, 150); assert.equal(diary.entries[0].unit, 'g');
  assert.equal(diary.totals.calories, 300); assert.equal(diary.remaining.calories, -10); assert.equal(diary.goal.calories, 300);
  reply({ date: '2026-10-22', goal: null, totals: { caloriesKcal: 0, proteinG: 0, carbohydratesG: 0, fatG: 0 }, remaining: null, entries: [] });
  assert.equal((await api.diary('2026-10-22')).totals.protein, 0);
  reply({ date: '2026-10-22', goal: null, totals: {}, remaining: null, entries: [] });
  await assert.rejects(api.diary('2026-10-22'), /Invalid nutrition response/);
});
test('custom foods map serving units and macro names in both directions, and edits send consumedAmount', async () => {
  const { api, calls, reply } = client(); reply([food]);
  const personal = (await api.personalFoods())[0];
  assert.equal(personal.servingSize, 100); assert.equal(personal.servingUnit, 'ml'); assert.equal(personal.calories, 300);
  reply(food);
  await api.createPersonalFood({ name: 'Milk', brand: '', servingSize: 100, servingUnit: 'ml', calories: 300, protein: 30, carbs: 45, fat: 15 });
  const payload = JSON.parse(calls.at(-1).body);
  assert.equal(payload.basisUnit, 'ML'); assert.equal(payload.basisAmount, 100); assert.equal(payload.caloriesKcal, 300); assert.equal(payload.brand, null); assert.equal('calories' in payload, false);
  reply(rawEntry); await api.updateEntry('entry-1', { mealType: 'BREAKFAST', quantity: 50 });
  assert.equal(JSON.parse(calls.at(-1).body).consumedAmount, 50); assert.equal('quantity' in JSON.parse(calls.at(-1).body), false);
  reply(null, 204); assert.equal(await api.deleteEntry('entry-1'), undefined);
});
