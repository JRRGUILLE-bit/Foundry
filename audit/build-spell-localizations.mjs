#!/usr/bin/env node
"use strict";

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const outputPath = resolve(process.argv[2] || resolve(root, "spell-localizations.es.generated.js"));
const characterIds = ["magna", "melkor"];

const SCHOOL_LABELS = Object.freeze({
  abj: "Abjuración",
  con: "Conjuración",
  div: "Adivinación",
  enc: "Encantamiento",
  evo: "Evocación",
  ill: "Ilusión",
  nec: "Nigromancia",
  trs: "Transmutación"
});

const MATERIAL_TRANSLATIONS = new Map(Object.entries({
  "a bit of fleece.": "Un trozo de vellón.",
  "a bit of fleece": "Un trozo de vellón.",
  "bat fur and a drop of pitch or piece of coal": "Pelo de murciélago y una gota de brea o un trozo de carbón.",
  "a small amount of alcohol or distilled spirits": "Una pequeña cantidad de alcohol o licor destilado.",
  "a pinch of soot and salt": "Una pizca de hollín y sal.",
  "a small piece of phosphorus": "Un pequeño trozo de fósforo.",
  "a tiny ball of bat guano and sulfur": "Una bolita de guano de murciélago y azufre.",
  "a drop of mercury": "Una gota de mercurio.",
  "a small square of silk": "Un pequeño cuadrado de seda.",
  "a piece of cured leather": "Un trozo de cuero curtido.",
  "a small straight piece of iron": "Un pequeño trozo recto de hierro.",
  "a small silver mirror": "Un pequeño espejo de plata.",
  "a small amount of makeup applied to the face as this spell is cast": "Una pequeña cantidad de maquillaje aplicada al rostro al lanzar el hechizo.",
  "a sprinkling of holy water, rare incense, and powdered ruby worth at least 1,000 gp": "Una aspersión de agua bendita, incienso raro y rubí pulverizado por valor de al menos 1.000 po.",
  "a diamond worth at least 50 gp, which the spell consumes": "Un diamante por valor de al menos 50 po, que el hechizo consume.",
  "a diamond worth at least 300 gp, which the spell consumes": "Un diamante por valor de al menos 300 po, que el hechizo consume.",
  "diamonds worth at least 300 gp, which the spell consumes": "Diamantes por valor de al menos 300 po, que el hechizo consume.",
  "a diamond worth at least 1,000 gp, which the spell consumes": "Un diamante por valor de al menos 1.000 po, que el hechizo consume.",
  "a diamond worth at least 5,000 gp": "Un diamante por valor de al menos 5.000 po.",
  "a prayer wheel and holy water": "Una rueda de oración y agua bendita.",
  "a holy symbol": "Un símbolo sagrado.",
  "holy water or powdered silver and iron worth at least 100 gp, which the spell consumes": "Agua bendita o plata y hierro pulverizados por valor de al menos 100 po, que el hechizo consume.",
  "a pair of platinum rings worth at least 50 gp each, which you and the target must wear for the duration": "Un par de anillos de platino por valor de al menos 50 po cada uno, que vos y el objetivo deben llevar durante la duración.",
  "a tiny strip of white cloth": "Una pequeña tira de tela blanca.",
  "a piece of tentacle from a giant octopus or a giant squid": "Un trozo de tentáculo de pulpo gigante o calamar gigante.",
  "a focus worth at least 1,000 gp, such as a crystal ball, a silver mirror, or a font filled with holy water": "Un foco por valor de al menos 1.000 po, como una bola de cristal, un espejo de plata o una pila llena de agua bendita.",
  "a miniature cloak": "Una capa en miniatura.",
  "a small crystal or glass cone": "Un pequeño cono de cristal o vidrio.",
  "a handful of sand, a dab of ink, and a writing quill plucked from a sleeping bird": "Un puñado de arena, una gota de tinta y una pluma de escritura arrancada de un ave dormida.",
  "a copper piece": "Una pieza de cobre.",
  "a pinch of dirt": "Una pizca de tierra.",
  "a bit of pork rind or butter": "Un trozo de corteza de cerdo o manteca.",
  "a drop of blood, a piece of flesh, and a pinch of bone dust": "Una gota de sangre, un trozo de carne y una pizca de polvo de hueso.",
  "an ointment for the eyes that costs 25 gp; is made from mushroom powder, saffron, and fat; and is consumed by the spell": "Un ungüento para los ojos que cuesta 25 po, elaborado con polvo de hongos, azafrán y grasa, que el hechizo consume.",
  "a diamond worth at least 25,000 gp, which the spell consumes": "Un diamante por valor de al menos 25.000 po, que el hechizo consume."
}));

const clean = (value) => String(value ?? "").replace(/\r/g, "").trim();
const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const compact = (values) => values.filter((value) => value !== null && value !== undefined && value !== "");

function plural(value, singular, pluralForm) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return singular;
  return `${amount} ${amount === 1 ? singular : pluralForm}`;
}

function activationLabel(activation) {
  if (!activation) return "—";
  const value = Number(activation.value ?? 1);
  const type = activation.type || "";
  if (type === "action") return plural(value, "acción", "acciones");
  if (type === "bonus") return plural(value, "acción adicional", "acciones adicionales");
  if (type === "reaction") return plural(value, "reacción", "reacciones");
  if (type === "minute") return plural(value, "minuto", "minutos");
  if (type === "hour") return plural(value, "hora", "horas");
  if (type === "day") return plural(value, "día", "días");
  if (type === "special") return "Especial";
  return clean(activation.label) || "—";
}

function distanceLabel(value) {
  if (!value) return "—";
  const units = value.units || "";
  const amount = value.value ?? value.distance ?? null;
  if (units === "self") return "Personal";
  if (units === "touch") return "Toque";
  if (units === "sight") return "Vista";
  if (units === "unlimited") return "Ilimitado";
  if (units === "spec" || units === "special") return clean(value.special) || "Especial";
  if (units === "ft") return amount === null || amount === "" ? "—" : `${amount} pies`;
  if (units === "mi") return amount === null || amount === "" ? "—" : plural(amount, "milla", "millas");
  if (units === "m") return amount === null || amount === "" ? "—" : `${amount} metros`;
  return clean(value.label) || compact([amount, units]).join(" ") || "—";
}

function durationLabel(duration) {
  if (!duration) return "—";
  const units = duration.units || "";
  const value = duration.value ?? 1;
  if (units === "inst" || units === "instantaneous") return "Instantánea";
  if (units === "turn") return plural(value, "turno", "turnos");
  if (units === "round") return plural(value, "asalto", "asaltos");
  if (units === "minute") return plural(value, "minuto", "minutos");
  if (units === "hour") return plural(value, "hora", "horas");
  if (units === "day") return plural(value, "día", "días");
  if (units === "week") return plural(value, "semana", "semanas");
  if (units === "month") return plural(value, "mes", "meses");
  if (units === "year") return plural(value, "año", "años");
  if (units === "perm") return "Hasta ser disipado";
  if (units === "spec" || units === "special") return "Especial";
  return clean(duration.label) || "—";
}

function targetLabel(target) {
  if (!target) return "—";
  if (clean(target.label) && clean(target.label) !== "—") {
    return clean(target.label)
      .replace(/Self/gi, "Personal")
      .replace(/Creature/gi, "criatura")
      .replace(/Object/gi, "objeto")
      .replace(/Sphere/gi, "esfera")
      .replace(/Cone/gi, "cono")
      .replace(/Cube/gi, "cubo")
      .replace(/Line/gi, "línea")
      .replace(/Radius/gi, "radio")
      .replace(/feet|foot|ft/gi, "pies");
  }
  const affects = target.affects || {};
  const template = target.template || {};
  const count = affects.count || template.count || "";
  const type = affects.type || template.type || "";
  const labels = {
    self: "Personal",
    creature: "criatura",
    object: "objeto",
    ally: "aliado",
    enemy: "enemigo",
    sphere: "esfera",
    cone: "cono",
    cube: "cubo",
    line: "línea",
    cylinder: "cilindro",
    radius: "radio"
  };
  return compact([count, labels[type] || type]).join(" ") || "—";
}

function components(componentsInput, spell) {
  const values = Array.isArray(componentsInput) ? componentsInput : [];
  const mapped = values.map((entry) => {
    const key = String(entry).toLowerCase();
    if (["v", "vocal", "verbal"].includes(key)) return "V";
    if (["s", "somatic", "somático", "somaticos"].includes(key)) return "S";
    if (["m", "material"].includes(key)) return "M";
    if (key === "concentration") return "Concentración";
    if (key === "ritual") return "Ritual";
    return clean(entry);
  }).filter(Boolean);
  if (spell?.materials && !mapped.includes("M")) mapped.push("M");
  return [...new Set(mapped)];
}

function translateMaterial(value) {
  const source = clean(value);
  if (!source) return null;
  const exact = MATERIAL_TRANSLATIONS.get(source.toLocaleLowerCase("en"));
  if (exact) return exact;
  return source
    .replace(/^a bit of /i, "Un trozo de ")
    .replace(/^a piece of /i, "Un trozo de ")
    .replace(/^a pinch of /i, "Una pizca de ")
    .replace(/^a drop of /i, "Una gota de ")
    .replace(/^a handful of /i, "Un puñado de ")
    .replace(/^a small amount of /i, "Una pequeña cantidad de ")
    .replace(/ worth at least ([\d,]+) gp/gi, " por valor de al menos $1 po")
    .replace(/which the spell consumes/gi, "que el hechizo consume")
    .replace(/holy water/gi, "agua bendita")
    .replace(/incense/gi, "incienso")
    .replace(/diamond(s)?/gi, (_, pluralValue) => pluralValue ? "diamantes" : "diamante")
    .replace(/silver/gi, "plata")
    .replace(/iron/gi, "hierro")
    .replace(/powdered/gi, "pulverizado")
    .replace(/sulfur/gi, "azufre")
    .replace(/coal/gi, "carbón")
    .replace(/bat fur/gi, "pelo de murciélago")
    .replace(/pitch/gi, "brea")
    .replace(/fleece/gi, "vellón")
    .replace(/\.$/, "") + ".";
}

function localizeActivity(activity, spellId, index) {
  return {
    id: activity.id || activity._id || `${spellId}:activity:${index + 1}`,
    name: clean(activity.name) || "Actividad",
    type: activity.type || null,
    activation: activity.activation ? { ...clone(activity.activation), label: activationLabel(activity.activation) } : null,
    range: activity.range ? { ...clone(activity.range), label: distanceLabel(activity.range) } : null,
    target: activity.target ? { ...clone(activity.target), label: targetLabel(activity.target) } : null,
    duration: activity.duration ? { ...clone(activity.duration), label: durationLabel(activity.duration) } : null,
    chatFlavor: clean(activity.chatFlavor) || null,
    description: clean(activity.description) || null
  };
}

function localizeSpell(spell) {
  return {
    id: spell.id || spell.rawItemId,
    name: clean(spell.name),
    schoolLabel: SCHOOL_LABELS[spell.school] || clean(spell.schoolLabel) || spell.school || "—",
    activation: spell.activation ? { ...clone(spell.activation), label: activationLabel(spell.activation) } : null,
    range: spell.range ? { ...clone(spell.range), label: distanceLabel(spell.range) } : null,
    target: spell.target ? { ...clone(spell.target), label: targetLabel(spell.target) } : null,
    duration: spell.duration ? { ...clone(spell.duration), label: durationLabel(spell.duration) } : null,
    components: components(spell.components, spell),
    materials: translateMaterial(spell.materials),
    description: clean(spell.description),
    activities: (spell.activities || []).map((activity, index) => localizeActivity(activity, spell.id || spell.rawItemId, index))
  };
}

const characters = {};
for (const characterId of characterIds) {
  const audit = JSON.parse(await readFile(resolve(root, `audit/spells/${characterId}.json`), "utf8"));
  characters[characterId] = {
    locale: "es",
    expectedCount: audit.spellCount,
    spells: Object.fromEntries(audit.spells.map((spell) => {
      const localized = localizeSpell(spell);
      return [localized.id, localized];
    }))
  };
}

const payload = {
  version: 1,
  generatedAt: new Date(0).toISOString(),
  defaultLocale: "en",
  characterLocales: {
    artionketh: "en",
    balder: "en",
    ingwe: "en",
    magna: "es",
    melkor: "es",
    sathar: "en"
  },
  characters
};

const source = `/* Generated by audit/build-spell-localizations.mjs. Do not edit manually. */\n(function attachSpellLocalizations(global){\n  \"use strict\";\n  global.BANDA_SPELL_LOCALIZATIONS_ES = Object.freeze(${JSON.stringify(payload, null, 2)});\n})(typeof window !== \"undefined\" ? window : globalThis);\n`;
await writeFile(outputPath, source, "utf8");
console.log(JSON.stringify({
  outputPath,
  characters: Object.fromEntries(Object.entries(characters).map(([id, value]) => [id, Object.keys(value.spells).length]))
}, null, 2));