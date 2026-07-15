(() => {
  "use strict";

  const translations = {
    en: {
      documentTitle: "The Banda Foundry",

      terminal: {
        command: "C:\\BANDA\\FOUNDRY> SUMMON ADVENTURE.EXE --NO_REFUNDS"
      },

      feed: {
        title: "SCRYING_ORB_FEED_01",
        mode: "DO_NOT_SHAKE",
        videoAria: "Live feed from an orb with no warranty",
        dungeon: "DUNGEON: MOSTLY LEGAL",
        heroes: "HEROES: UNSUPERVISED",
        traps: "TRAPS: UNIONIZED"
      },

      identity: {
        label: "DEPARTMENT OF BAD DECISIONS"
      },

      readout: {
        rulesLabel: "RULE LAWYER",
        rulesValue: "D&D 5E // OBJECTING",
        booksLabel: "DM MANUALS",
        booksValue: "DUST // +2",
        monstersLabel: "MONSTERS",
        monstersValue: "WAITING FOR A SPLIT PARTY"
      },

      log: {
        aria: "Campaign incident report",
        title: "BAD_DECISIONS.LOG",
        world: "LOAD WORLD ........ PROBABLY",
        mimics: "COUNT MIMICS ....... STILL COUNTING",
        dragon: "WAKE DRAGON ........ GREAT IDEA",
        dm: "DM IMPROVISATION BUFFERING"
      },

      status: {
        header: "MYSTICAL_BROADBAND.SYS",
        checking: "ASKING WIZARD TO REBOOT...",
        offline: "OFFLINE // PORTAL ON BREAK",
        online: "ONLINE // BAD IDEAS WELCOME"
      },

      button: {
        enter: "ENTER FOUNDRY"
      },

      footer: {
        ready: "DM READY // PLAN NOT FOUND"
      },

      backgroundSnippets: [
        "npc.create(\"innkeeper\", { secrets: 7, accent: \"temporary\" });",
        "shop.price *= hero.looksRich ? 3 : 1;",
        "mimic.disguise(\"treasure_chest\").overact();",
        "dragon.sleepUntil(party.says(\"we got this\"));",
        "bard.volume = \"legally_actionable\";",
        "goblin.unionize({ demands: [\"snacks\", \"dental\"] });",
        "quest.reward = dm.forgotMath ? \"double\" : \"exposure\";",
        "trap.place(\"obvious_hallway\");",
        "cleric.prepare(\"revivify\").sigh();",
        "dice.roll(\"1d20 + misplaced_confidence\");",
        "merchant.detectWealth().raisePrices();",
        "wizard.cast(\"fireball\", { location: \"indoors\" });",
        "tavern.brawl.startBefore(\"first_round\");",
        "skeleton.queue.add(12).forgetWhy();",
        "gelatinousCube.clean(\"entire_dungeon\");",
        "portal.open(\"somewhere_with_paperwork\");",
        "paladin.beginMoralCrisis(\"again\");",
        "rogue.steal(\"plot_relevant_object\");",
        "warlock.patron.fileComplaint(\"insufficient_brooding\");",
        "questgiver.hide(\"one_crucial_detail\");",
        "torch.extinguishAt(\"worst_possible_moment\");",
        "necromancer.schedule(\"light_maintenance\");",
        "kobold.confidence = Infinity;",
        "barbarian.solve(\"puzzle\", \"structural_damage\");",
        "chest.mimicProbability = 0.87;",
        "healer.sigh({ volume: \"audible\" });",
        "map.mark(\"DEFINITELY_NOT_A_TRAP\");",
        "villager.panic({ certification: \"professional\" });",
        "king.delayReward(\"budget_review\");",
        "ranger.track(\"something_regrettable\");",
        "cultist.explainPlan({ timing: \"too_early\" });",
        "potion.identifyAs(\"probably_fine\");",
        "beholder.paranoia.expandToFit();",
        "bard.flirt({ outcome: \"catastrophic\" });",
        "dragon.taxAudit.begin();",
        "prophecy.wording = \"needlessly_confusing\";",
        "dungeon.exit.moveTo(\"other_side_of_map\");",
        "wizard.readManualAfter(\"explosion\");",
        "hero.plan.confidence = 100;",
        "hero.plan.quality = 3;",
        "dm.notes.search(\"name_of_that_npc\");",
        "rogue.checkTrapAfter(\"opening_chest\");",
        "paladin.detectEvil(\"everywhere\");",
        "shopkeeper.returnPolicy = \"quest_required\";",
        "ratSwarm.clockIn(\"early\");",
        "altar.glow({ reason: null });",
        "monster.waitUntil(\"dramatic_pause_complete\");",
        "door.lock.dc = party.hasKey ? 25 : 5;",
        "familiar.judgeOwner(\"silently\");",
        "treasureMap.accuracy = \"decorative\";"
      ]
    },

    es: {
      documentTitle: "El Foundry de la Banda",

      terminal: {
        command: "C:\\BANDA\\FOUNDRY> INVOCAR AVENTURA.EXE --NO_HAY_REEMBOLSO"
      },

      feed: {
        title: "ORBE_DE_CHUSMERIO_01",
        mode: "NO_SACUDIR",
        videoAria: "Transmisión en vivo desde un orbe sin garantía",
        dungeon: "MAZMORRA: HABILITACIÓN EN TRÁMITE",
        heroes: "HÉROES: SIN ADULTO RESPONSABLE",
        traps: "TRAMPAS: CONVENIO COLECTIVO"
      },

      identity: {
        label: "OFICINA DE MALAS DECISIONES"
      },

      readout: {
        rulesLabel: "ABOGADO DE REGLAS",
        rulesValue: "D&D 5E // PRESENTÓ RECURSO",
        booksLabel: "MANUALES DEL DM",
        booksValue: "POLVO // +2",
        monstersLabel: "MONSTRUOS",
        monstersValue: "ESPERANDO QUE SE SEPAREN"
      },

      log: {
        aria: "Registro de incidentes de la campaña",
        title: "MALAS_DECISIONES.LOG",
        world: "CARGAR MUNDO ...... MÁS O MENOS",
        mimics: "CONTAR MÍMICOS ..... SIGUEN APARECIENDO",
        dragon: "DESPERTAR DRAGÓN ... IDEA BRILLANTE",
        dm: "EL DM ESTÁ INVENTANDO SOBRE LA MARCHA"
      },

      status: {
        header: "BANDA_ANCHA_MÍSTICA.SYS",
        checking: "PREGUNTÁNDOLE AL MAGO SI PROBÓ REINICIAR...",
        offline: "DESCONECTADO // EL PORTAL SE TOMÓ EL DÍA",
        online: "CONECTADO // YA PUEDEN ARRUINAR EL PLAN"
      },

      button: {
        enter: "ENTRAR A FOUNDRY"
      },

      footer: {
        ready: "DM LISTO // PLAN NO ENCONTRADO"
      },

      backgroundSnippets: [
        "npc.crear(\"tabernero\", { secretos: 7, acento: \"improvisado\" });",
        "tienda.precio *= heroe.pareceRico ? 3 : 1;",
        "mimico.disfrazarse(\"cofre\").sobreactuar();",
        "dragon.dormirHasta(grupo.diga(\"la tenemos clara\"));",
        "bardo.volumen = \"denunciable\";",
        "goblin.sindicalizar({ pedidos: [\"viaticos\", \"odontologia\"] });",
        "mision.recompensa = dm.olvidoLaCuenta ? \"doble\" : \"prestigio\";",
        "trampa.instalar(\"pasillo_demasiado_obvio\");",
        "clerigo.preparar(\"revivir\").suspirar();",
        "dado.tirar(\"1d20 + confianza_injustificada\");",
        "mercader.detectarPlata().subirPrecios();",
        "mago.lanzar(\"bola_de_fuego\", { lugar: \"interior\" });",
        "taberna.pelea.empezarAntes(\"primera_ronda\");",
        "esqueletos.encolar(12).olvidarMotivo();",
        "cuboGelatinoso.limpiar(\"toda_la_mazmorra\");",
        "portal.abrir(\"lugar_con_formularios\");",
        "paladin.crisisMoral.iniciar(\"otra_vez\");",
        "picaro.robar(\"objeto_importante_para_la_trama\");",
        "patrono.quejarse(\"falta_de_dramatismo\");",
        "dadorDeMision.ocultar(\"detalle_imprescindible\");",
        "antorcha.apagarseEn(\"peor_momento\");",
        "nigromante.agendar(\"mantenimiento_ligero\");",
        "kobold.confianza = Infinity;",
        "barbaro.resolver(\"acertijo\", \"daño_estructural\");",
        "cofre.probabilidadDeMimico = 0.87;",
        "sanador.suspirar({ volumen: \"audible\" });",
        "mapa.marcar(\"SEGURO_NO_ES_UNA_TRAMPA\");",
        "aldeano.entrarEnPanico({ nivel: \"profesional\" });",
        "rey.demorarRecompensa(\"revision_presupuestal\");",
        "explorador.rastrear(\"algo_lamentable\");",
        "sectario.explicarPlan({ momento: \"demasiado_pronto\" });",
        "pocion.identificarComo(\"debe_estar_bien\");",
        "contemplador.paranoia.expandir();",
        "bardo.coquetear({ resultado: \"desastre_social\" });",
        "dragon.inspeccionFiscal.iniciar();",
        "profecia.redaccion = \"innecesariamente_confusa\";",
        "mazmorra.salida.mover(\"otra_punta_del_mapa\");",
        "mago.leerManualDespues(\"explosion\");",
        "heroes.plan.confianza = 100;",
        "heroes.plan.calidad = 3;",
        "dm.notas.buscar(\"nombre_de_ese_npc\");",
        "picaro.revisarTrampaDespues(\"abrir_cofre\");",
        "paladin.detectarMaldad(\"en_todos_lados\");",
        "tienda.devoluciones = \"requiere_mision_secundaria\";",
        "enjambreDeRatas.marcarEntrada(\"temprano\");",
        "altar.brillar({ motivo: null });",
        "monstruo.esperar(\"pausa_dramatica_completa\");",
        "puerta.dc = grupo.tieneLlave ? 25 : 5;",
        "familiar.juzgarDueño(\"en_silencio\");",
        "mapaDelTesoro.precision = \"decorativa\";"
      ]
    }
  };

  const preferredLanguages =
    Array.isArray(navigator.languages) && navigator.languages.length
      ? navigator.languages
      : [navigator.language || "en"];

  const locale =
    preferredLanguages
      .map((language) => String(language).toLowerCase().split("-")[0])
      .find((language) => language === "es" || language === "en") || "en";

  const strings = translations[locale];

  function getTranslation(path) {
    return path.split(".").reduce((value, key) => {
      if (value && Object.prototype.hasOwnProperty.call(value, key)) {
        return value[key];
      }

      return undefined;
    }, strings);
  }

  function translateDocument() {
    document.documentElement.lang = locale;
    document.title = strings.documentTitle;

    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const value = getTranslation(element.dataset.i18n);

      if (typeof value === "string") {
        element.textContent = value;
      }
    });

    document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
      const value = getTranslation(element.dataset.i18nAriaLabel);

      if (typeof value === "string") {
        element.setAttribute("aria-label", value);
      }
    });
  }

  window.FoundryI18n = Object.freeze({
    locale,
    strings,
    t: getTranslation
  });

  translateDocument();
})();
