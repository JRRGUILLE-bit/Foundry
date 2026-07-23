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
  "a small feather or piece of down.": "Una pluma pequeña o un trozo de plumón.",
  "a small feather or piece of down": "Una pluma pequeña o un trozo de plumón.",
  "bat fur and a drop of pitch or piece of coal": "Pelo de murciélago y una gota de brea o un trozo de carbón.",
  "a small, straight piece of iron": "Una pequeña pieza recta de hierro.",
  "a small straight piece of iron": "Una pequeña pieza recta de hierro.",
  "a bit of fur and a rod of amber, crystal, or glass": "Un trozo de piel y una varilla de ámbar, cristal o vidrio.",
  "a bit of fur; a piece of amber, glass, or a crystal rod; and three silver pins": "Un trozo de piel; una pieza de ámbar, vidrio o una varilla de cristal; y tres alfileres de plata.",
  "an eggshell and a snakeskin glove": "Una cáscara de huevo y un guante de piel de serpiente.",
  "ashes from a burned leaf of mistletoe and a sprig of spruce.": "Cenizas de una hoja de muérdago quemada y una ramita de abeto.",
  "ashes from a burned leaf of mistletoe and a sprig of spruce": "Cenizas de una hoja de muérdago quemada y una ramita de abeto.",
  "either a pinch of dried carrot or an agate.": "Una pizca de zanahoria seca o un ágata.",
  "either a pinch of dried carrot or an agate": "Una pizca de zanahoria seca o un ágata.",
  "a shaving of licorice root.": "Una viruta de raíz de regaliz.",
  "a shaving of licorice root": "Una viruta de raíz de regaliz.",
  "a small amount of alcohol or distilled spirits": "Una pequeña cantidad de alcohol o licor destilado.",
  "a pinch of soot and salt": "Una pizca de hollín y sal.",
  "a small piece of phosphorus": "Un pequeño trozo de fósforo.",
  "a tiny ball of bat guano and sulfur": "Una bolita de guano de murciélago y azufre.",
  "a drop of mercury": "Una gota de mercurio.",
  "a small square of silk": "Un pequeño cuadrado de seda.",
  "a piece of cured leather": "Un trozo de cuero curtido.",
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

const SPELL_OVERRIDES = Object.freeze({
  UQyNolXpS2tTno4W: { name: "Prestidigitación" },
  AKzVK0M2rvGswx4L: { name: "Rayo de escarcha" },
  FwIOYu6VGcu5Xw7X: { name: "Toque helado" },
  QflsM41BgH91BaC5: { name: "Caída de pluma", materials: "Una pluma pequeña o un trozo de plumón." },
  rVkx50mFl1HtThRl: { name: "Curar heridas" },
  LYbgbgZ6LINZplsT: { name: "Escudo" },
  AjoRBbyrShYt3KPq: { name: "Proyectil mágico" },
  jJ2K8U3uGGNGbezi: { name: "Detectar pensamientos" },
  h3zmXPhHRtO3wWIf: { name: "Rayo abrasador" },
  "56n4A0O9QuFUH2xC": { name: "Inmovilizar persona", materials: "Una pequeña pieza recta de hierro." },
  "7G73KSissqcUwnuL": { name: "Bola de fuego" },
  jG9xL7OOWJJxlPbO: { name: "Luz del día" },
  fxoCqiiSaea9DwTM: { name: "Relámpago", materials: "Un trozo de piel y una varilla de ámbar, cristal o vidrio." },
  qCJlbEGeJm04khaT: { name: "Puerta dimensional" },
  Kpscg5jIjl4lC0P8: { name: "Círculo de teletransportación" },
  "8RVPPGS8tu9C7p1h": { name: "Mano arcana", materials: "Una cáscara de huevo y un guante de piel de serpiente." },
  p3SUcC91hi9q1uDO: {
    name: "Cadena de relámpagos",
    materials: "Un trozo de piel; una pieza de ámbar, vidrio o una varilla de cristal; y tres alfileres de plata.",
    description: "Creas un relámpago que forma un arco hacia un objetivo que elijas y puedas ver dentro del alcance. Desde ese objetivo saltan tres descargas hacia un máximo de otros tres objetivos, cada uno de los cuales debe estar a 30 pies o menos del primero. Un objetivo puede ser una criatura o un objeto y solo puede recibir una de las descargas.\nCada objetivo debe realizar una tirada de salvación de Destreza. Si falla, recibe 10d8 de daño de relámpago; si tiene éxito, recibe la mitad.\nA niveles superiores: cuando lanzas este hechizo usando un espacio de nivel 7 o superior, salta una descarga adicional desde el primer objetivo hacia otro objetivo por cada nivel del espacio por encima de 6."
  },
  PrbKLNvodK3mUXjg: {
    name: "Telequinesis",
    description: "Obtienes la capacidad de mover o manipular criaturas y objetos con el pensamiento. Cuando lanzas el hechizo, y como acción en cada asalto durante su duración, puedes imponer tu voluntad sobre una criatura u objeto que veas dentro del alcance y producir uno de los efectos siguientes. Puedes afectar al mismo objetivo asalto tras asalto o elegir uno nuevo en cualquier momento. Si cambias de objetivo, el anterior deja de estar afectado.\nCriatura: puedes intentar mover una criatura Enorme o más pequeña. Realiza una prueba con tu característica de lanzamiento enfrentada a una prueba de Fuerza de la criatura. Si ganas, la mueves hasta 30 pies en cualquier dirección, incluso hacia arriba, sin superar el alcance del hechizo. Hasta el final de tu siguiente turno, queda apresada por tu agarre telequinético. Una criatura elevada queda suspendida en el aire. En asaltos posteriores puedes usar tu acción para intentar mantener el agarre repitiendo la prueba enfrentada.\nObjeto: puedes intentar mover un objeto de hasta 1.000 libras. Si nadie lo lleva ni lo viste, lo mueves automáticamente hasta 30 pies en cualquier dirección, sin superar el alcance. Si una criatura lo lleva o lo viste, debes realizar una prueba con tu característica de lanzamiento enfrentada a una prueba de Fuerza de esa criatura. Si tienes éxito, le arrancas el objeto y puedes moverlo hasta 30 pies.\nTambién puedes ejercer control fino sobre los objetos: manipular una herramienta sencilla, abrir una puerta o recipiente, guardar o recuperar un objeto de un contenedor abierto o verter el contenido de un vial."
  },
  c6FAcc3MRmWCUitV: {
    name: "Rociada prismática",
    description: "Ocho rayos de luz multicolor salen de tu mano. Cada rayo tiene un color, poder y propósito diferentes. Cada criatura en un cono de 60 pies debe realizar una tirada de salvación de Destreza. Para cada objetivo, tira 1d8 para determinar qué color lo afecta.\nRojo: 10d6 de daño de fuego si falla la salvación, o la mitad si tiene éxito.\nNaranja: 10d6 de daño de ácido si falla, o la mitad si tiene éxito.\nAmarillo: 10d6 de daño de relámpago si falla, o la mitad si tiene éxito.\nVerde: 10d6 de daño de veneno si falla, o la mitad si tiene éxito.\nAzul: 10d6 de daño de frío si falla, o la mitad si tiene éxito.\nÍndigo: si falla, queda apresado. Al final de cada uno de sus turnos debe realizar una tirada de salvación de Constitución. Con tres éxitos, el hechizo termina; con tres fallos, se convierte permanentemente en piedra y queda petrificado. Los éxitos y fallos no tienen que ser consecutivos.\nVioleta: si falla, queda cegado. Al comienzo de tu siguiente turno debe realizar una tirada de salvación de Sabiduría. Si tiene éxito, deja de estar cegado. Si falla, es transportado a otro plano de existencia elegido por el DM y deja de estar cegado.\nEspecial: el objetivo recibe dos rayos. Vuelve a tirar dos veces, repitiendo cualquier resultado de 8."
  },
  "4zkfk97kctVDE3hB": { name: "Dominar monstruo" },
  dWzFWbADUsv0DIon: {
    name: "Ilusión menor",
    materials: "Un trozo de vellón.",
    description: "Creas un sonido o la imagen de un objeto dentro del alcance que dura hasta que termina el hechizo. La ilusión también termina si la descartas como acción o si vuelves a lanzar este hechizo.\nSi creas un sonido, su volumen puede ir desde un susurro hasta un grito. Puede ser tu voz, la voz de otra persona, el rugido de un león, el redoble de tambores o cualquier otro sonido que elijas. El sonido continúa sin interrupción durante la duración, aunque también puedes producir sonidos separados en distintos momentos.\nSi creas la imagen de un objeto, como una silla, huellas embarradas o un cofre pequeño, no puede superar un cubo de 5 pies. La imagen no puede producir sonido, luz, olor ni ningún otro efecto sensorial. La interacción física revela que es una ilusión, porque las cosas pueden atravesarla.\nUna criatura que use su acción para examinar el sonido o la imagen puede determinar que es una ilusión si supera una prueba de Inteligencia (Investigación) contra tu CD de salvación de hechizos. Para una criatura que descubre la ilusión, esta se vuelve tenue."
  },
  SCuq0QpsICcM8TlR: { name: "Imagen especular" },
  PdRNQV4cu8DyTMb0: {
    name: "Oscuridad",
    materials: "Pelo de murciélago y una gota de brea o un trozo de carbón.",
    description: "Una oscuridad mágica se extiende desde un punto que elijas dentro del alcance y llena una esfera de 15 pies de radio durante la duración. La oscuridad se propaga alrededor de las esquinas. Una criatura con visión en la oscuridad no puede ver a través de ella y la luz no mágica no puede iluminarla.\nSi el punto elegido está sobre un objeto que sostienes o que nadie lleva ni viste, la oscuridad se mueve con él. Cubrir por completo la fuente con un objeto opaco, como un cuenco o un yelmo, bloquea la oscuridad.\nSi cualquier parte del área se superpone con luz creada por un hechizo de nivel 2 o inferior, el hechizo que creó esa luz se disipa."
  },
  di7iUi7U7ISL7hwf: { name: "Pasar sin dejar rastro", materials: "Cenizas de una hoja de muérdago quemada y una ramita de abeto." },
  fcpdwqcZV9Sbkd3H: { name: "Silencio" },
  "5LY2PfFqPIuYMpQ7": {
    name: "Visión en la oscuridad",
    materials: "Una pizca de zanahoria seca o un ágata.",
    description: "Tocas a una criatura voluntaria para otorgarle la capacidad de ver en la oscuridad. Durante la duración, esa criatura obtiene visión en la oscuridad hasta una distancia de 60 pies."
  },
  Dzan2aPdK45Hh9Gi: { name: "Acelerar", materials: "Una viruta de raíz de regaliz." }
});

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

function localizeActivity(activity, spellId, index, localizedName, originalName) {
  const activityName = clean(activity.name);
  return {
    id: activity.id || activity._id || `${spellId}:activity:${index + 1}`,
    name: !activityName || activityName === clean(originalName) ? localizedName : activityName,
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
  const id = spell.id || spell.rawItemId;
  const override = SPELL_OVERRIDES[id] || {};
  const localizedName = override.name || clean(spell.name);
  return {
    id,
    name: localizedName,
    schoolLabel: SCHOOL_LABELS[spell.school] || clean(spell.schoolLabel) || spell.school || "—",
    activation: spell.activation ? { ...clone(spell.activation), label: activationLabel(spell.activation) } : null,
    range: spell.range ? { ...clone(spell.range), label: distanceLabel(spell.range) } : null,
    target: spell.target ? { ...clone(spell.target), label: targetLabel(spell.target) } : null,
    duration: spell.duration ? { ...clone(spell.duration), label: durationLabel(spell.duration) } : null,
    components: components(spell.components, spell),
    materials: override.materials ?? translateMaterial(spell.materials),
    description: override.description || clean(spell.description),
    activities: (spell.activities || []).map((activity, index) => localizeActivity(activity, id, index, localizedName, spell.name))
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