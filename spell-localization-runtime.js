(function attachSpellLocalizationRuntime(global) {
  "use strict";

  const DEFAULT_LOCALE = "en";
  const CHARACTER_LOCALES = Object.freeze({
    artionketh: "en",
    balder: "en",
    ingwe: "en",
    magna: "es",
    melkor: "es",
    sathar: "en"
  });
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
  const SPELL_OVERRIDES = Object.freeze({
    UQyNolXpS2tTno4W: { name: "Prestidigitación" },
    AKzVK0M2rvGswx4L: { name: "Rayo de escarcha" },
    FwIOYu6VGcu5Xw7X: { name: "Toque helado" },
    QflsM41BgH91BaC5: { name: "Caída de pluma", materials: "Una pluma pequeña o un trozo de plumón." },
    rVkx50mFl1HtThRl: { name: "Curar heridas" },
    LYbgbgZ6LINZplsT: { name: "Escudo" },
    AjoRBbyrShYt3KPq: { name: "Proyectil mágico" },
    jJ2K8U3uGGNGbezi: { name: "Detectar pensamientos", materials: "Una pieza de cobre." },
    h3zmXPhHRtO3wWIf: { name: "Rayo abrasador" },
    "56n4A0O9QuFUH2xC": { name: "Inmovilizar persona", materials: "Una pequeña pieza recta de hierro." },
    "7G73KSissqcUwnuL": { name: "Bola de fuego", materials: "Una bolita de guano de murciélago y azufre." },
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

  const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
  const array = (value) => Array.isArray(value) ? value : [];
  const text = (value) => typeof value === "string" ? value.trim() : "";
  const compact = (values) => values.filter((value) => value !== null && value !== undefined && value !== "");
  const normalizeKey = (value) => text(value)
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  function localeForCharacter(characterId) {
    return CHARACTER_LOCALES[characterId] || DEFAULT_LOCALE;
  }

  function spellId(spell) {
    return spell?.id || spell?._id || spell?.rawItemId || spell?.source?.rawItemId || null;
  }

  function plural(value, singular, pluralForm) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return singular;
    return `${amount} ${amount === 1 ? singular : pluralForm}`;
  }

  function activationLabel(activation) {
    if (!activation) return "—";
    const value = Number(activation.value ?? 1);
    if (activation.type === "action") return plural(value, "acción", "acciones");
    if (activation.type === "bonus") return plural(value, "acción adicional", "acciones adicionales");
    if (activation.type === "reaction") return plural(value, "reacción", "reacciones");
    if (activation.type === "minute") return plural(value, "minuto", "minutos");
    if (activation.type === "hour") return plural(value, "hora", "horas");
    if (activation.type === "day") return plural(value, "día", "días");
    if (activation.type === "special") return "Especial";
    return text(activation.label) || "—";
  }

  function distanceLabel(value) {
    if (!value) return "—";
    const amount = value.value ?? value.distance ?? null;
    if (value.units === "self") return "Personal";
    if (value.units === "touch") return "Toque";
    if (value.units === "sight") return "Vista";
    if (value.units === "unlimited") return "Ilimitado";
    if (["spec", "special"].includes(value.units)) return text(value.special) || "Especial";
    if (value.units === "ft") return amount === null || amount === "" ? "—" : `${amount} pies`;
    if (value.units === "mi") return amount === null || amount === "" ? "—" : plural(amount, "milla", "millas");
    if (value.units === "m") return amount === null || amount === "" ? "—" : `${amount} metros`;
    return text(value.label) || compact([amount, value.units]).join(" ") || "—";
  }

  function durationLabel(duration) {
    if (!duration) return "—";
    const value = duration.value ?? 1;
    if (["inst", "instantaneous"].includes(duration.units)) return "Instantánea";
    if (duration.units === "turn") return plural(value, "turno", "turnos");
    if (duration.units === "round") return plural(value, "asalto", "asaltos");
    if (duration.units === "minute") return plural(value, "minuto", "minutos");
    if (duration.units === "hour") return plural(value, "hora", "horas");
    if (duration.units === "day") return plural(value, "día", "días");
    if (duration.units === "week") return plural(value, "semana", "semanas");
    if (duration.units === "month") return plural(value, "mes", "meses");
    if (duration.units === "year") return plural(value, "año", "años");
    if (duration.units === "perm") return "Hasta ser disipado";
    if (["spec", "special"].includes(duration.units)) return "Especial";
    return text(duration.label) || "—";
  }

  function targetLabel(target) {
    if (!target) return "—";
    const current = text(target.label);
    if (current && current !== "—") {
      return current
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

  function localizedComponents(values, materials) {
    const mapped = array(values).map((entry) => {
      const key = String(entry).toLowerCase();
      if (key === "mgc") return "";
      if (["v", "vocal", "verbal"].includes(key)) return "V";
      if (["s", "somatic", "somático", "somaticos"].includes(key)) return "S";
      if (["m", "material"].includes(key)) return "M";
      if (key === "concentration") return "Concentración";
      if (key === "ritual") return "Ritual";
      return text(entry);
    }).filter(Boolean);
    if (materials && !mapped.includes("M")) mapped.push("M");
    return [...new Set(mapped)];
  }

  function localizeActivity(activity, localizedName, originalName, parentId, index) {
    const result = clone(activity) || {};
    const currentName = text(result.name);
    result.id = result.id || result._id || `${parentId}:activity:${index + 1}`;
    result.name = !currentName || normalizeKey(currentName) === normalizeKey(originalName) ? localizedName : currentName;
    if (result.activation) result.activation = { ...result.activation, label: activationLabel(result.activation) };
    if (result.range) result.range = { ...result.range, label: distanceLabel(result.range) };
    if (result.target) result.target = { ...result.target, label: targetLabel(result.target) };
    if (result.duration) result.duration = { ...result.duration, label: durationLabel(result.duration) };
    return result;
  }

  function localizeSpell(characterId, spell) {
    const original = clone(spell);
    if (localeForCharacter(characterId) !== "es") return original;
    const id = spellId(original);
    const override = SPELL_OVERRIDES[id] || {};
    const localizedName = override.name || original.name;
    const materials = override.materials ?? original.materials ?? null;
    const result = {
      ...original,
      name: localizedName,
      schoolLabel: SCHOOL_LABELS[original.school] || original.schoolLabel || original.school || "—",
      activation: original.activation ? { ...original.activation, label: activationLabel(original.activation) } : null,
      range: original.range ? { ...original.range, label: distanceLabel(original.range) } : null,
      target: original.target ? { ...original.target, label: targetLabel(original.target) } : null,
      duration: original.duration ? { ...original.duration, label: durationLabel(original.duration) } : null,
      components: localizedComponents(original.components, materials),
      materials,
      description: override.description || original.description,
      activities: array(original.activities).map((activity, index) => localizeActivity(activity, localizedName, original.name, id || "spell", index)),
      localization: {
        locale: "es",
        source: "STATIC_OVERRIDE",
        characterId,
        spellId: id
      }
    };
    result.searchText = normalizeKey([result.name, result.schoolLabel, result.description, result.materials].join(" "));
    return result;
  }

  function localizeSpells(characterId, spells) {
    return array(spells).map((spell) => localizeSpell(characterId, spell));
  }

  function localizeCharacter(character) {
    if (!character?.id || localeForCharacter(character.id) !== "es") return character;
    return { ...character, spells: localizeSpells(character.id, character.spells) };
  }

  function memoryResponse(dataValue, originalResponse) {
    const headers = new Headers(originalResponse?.headers || {});
    headers.set("Content-Type", "application/json; charset=utf-8");
    headers.set("X-Spell-Localization", "es-static-override");
    const status = originalResponse?.status || 200;
    return {
      ok: status >= 200 && status < 300,
      status,
      headers,
      async json() { return clone(dataValue); },
      async text() { return JSON.stringify(dataValue); },
      clone() { return memoryResponse(dataValue, originalResponse); }
    };
  }

  function wrapCharacterFetch() {
    if (typeof global.fetch !== "function") return;
    const previousFetch = global.fetch.bind(global);
    global.fetch = async (input, init) => {
      const url = typeof input === "string" ? input : input?.url || "";
      const response = await previousFetch(input, init);
      if (!url.startsWith("character-data:")) return response;
      const characterId = url.slice("character-data:".length).trim().toLowerCase();
      if (localeForCharacter(characterId) !== "es" || !response.ok) return response;
      const character = await response.clone().json();
      return memoryResponse(localizeCharacter(character), response);
    };
  }

  function wrapMobileViewModel() {
    const original = global.BANDA_MOBILE_VIEW_MODEL;
    if (!original?.build || !original?.buildAll) return;
    global.BANDA_MOBILE_VIEW_MODEL = Object.freeze({
      ...original,
      build(input, options) {
        const model = original.build(input, options);
        return localeForCharacter(model?.id) === "es" ? { ...model, spells: localizeSpells(model.id, model.spells) } : model;
      },
      buildAll(options) {
        return original.buildAll(options).map((model) => localeForCharacter(model?.id) === "es" ? { ...model, spells: localizeSpells(model.id, model.spells) } : model);
      }
    });
  }

  global.BANDA_SPELL_LOCALIZATION = Object.freeze({
    version: 1,
    defaultLocale: DEFAULT_LOCALE,
    localeForCharacter,
    localizeSpell,
    localizeSpells,
    localizeCharacter
  });
  wrapMobileViewModel();
  wrapCharacterFetch();
})(typeof window !== "undefined" ? window : globalThis);