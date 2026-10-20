import { normalizeName, normalizePhone, normalizeWebsite, qualify } from "../workers/prospecting-scheduler/src/index";

let passed = 0;
let failed = 0;
function assert(condition: boolean, label: string) {
  if (condition) { console.log(`  [PASS] ${label}`); passed++; }
  else { console.error(`  [FAIL] ${label}`); failed++; }
}

assert(normalizeName(" Salão & Estética São João ") === "salao e estetica sao joao", "normaliza nome comercial");
assert(normalizeWebsite("https://WWW.Exemplo.com.br/?utm_source=x#contato") === "exemplo.com.br", "normaliza URL e remove rastreadores");
assert(normalizeWebsite("javascript:alert(1)") === null, "rejeita esquema não HTTP");
assert(normalizeWebsite("https://user:pass@example.com") === null, "rejeita credenciais na URL");
assert(normalizePhone("(51) 99999-1234") === "5551999991234", "normaliza telefone brasileiro");
assert(normalizePhone("123") === null, "rejeita telefone curto");

const result = qualify({
  business_name: "Salão Teste",
  category: "Salão de beleza",
  website_url: "https://exemplo.com",
  phone: "(51) 99999-1234",
  source_url: "https://exemplo.com/sobre",
});
assert(result.score === 75, "pontua somente evidências presentes");
assert(result.missingFields.includes("email") && result.reasons.length === 8, "explica campos ausentes");
console.log(`RESULTADO WORKER: ${passed} passou / ${failed} falhou`);
if (failed) process.exit(1);
