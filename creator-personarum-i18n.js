(() => {
  'use strict';

  const STORAGE_KEY = 'banda.creator-personarum.language.v1';
  const PLAYER_ASSIGNMENT_STORAGE_KEY = 'banda.creator-personarum.assignment-player-id.v1';
  const PLAYER_IDS = new Set(['gonza', 'maite', 'nico', 'rulo', 'santi']);
  let currentPlayerId = '';
  const TEXT = {
    'SALTAR INTRO': 'SKIP INTRO',
    'NOMBRE DEL JUGADOR / PLAYER NAME': 'PLAYER NAME',
    'Crear tu personaje': 'Create your character',
    '← VOLVER A EL FOUNDRY DE LA BANDA': '← BACK TO EL FOUNDRY DE LA BANDA',
    'ANTES DE EMPEZAR // ELEGÍ TU CAMINO': 'BEFORE YOU BEGIN // CHOOSE YOUR PATH',
    '¿YA SABÉS QUÉ PERSONAJE QUERÉS JUGAR?': 'DO YOU ALREADY KNOW WHAT CHARACTER YOU WANT TO PLAY?',
    'No hay una única manera de crear un aventurero. Podés traer una idea que ya te entusiasma o dejar que el mundo te ayude a encontrarla.': 'There is no single way to create an adventurer. Bring an idea you are excited about, or let the world help you discover one.',
    'CAMINO 01': 'PATH 01',
    'YA SÉ LO QUE QUIERO JUGAR': 'I KNOW WHAT I WANT TO PLAY',
    'Tengo un personaje en la cabeza.': 'I already have a character in mind.',
    'Traé esa idea: su personalidad, su pasado, lo que sabe hacer o lo que lo mueve. Vamos a darle forma sin apagar lo que ya imaginaste.': 'Bring that idea: their personality, their past, what they can do, or what drives them. We will shape it without losing what you have imagined.',
    'AL FINAL: elegís su procedencia y consultás el contexto oficial del Atlas.': 'AT THE END: choose their place of origin and consult the official Atlas records.',
    'CREAR MI PERSONAJE': 'CREATE MY CHARACTER',
    'CAMINO 02': 'PATH 02',
    'TODAVÍA NO LO SÉ': 'I AM NOT SURE YET',
    'Quiero explorar el mundo.': 'I want to explore the world.',
    'Descubrí sus distintas regiones, sus culturas, sus tensiones y sus misterios. Quizá el lugar que te atraiga te muestre qué personaje querés interpretar.': 'Discover its regions, cultures, conflicts, and mysteries. Perhaps the place that draws you in will reveal the character you want to play.',
    'AL FINAL: elegís una procedencia y usás el mundo como punto de partida para su historia.': 'AT THE END: choose a place of origin and use the world as the starting point for your character’s story.',
    'EXPLORAR EL MUNDO': 'EXPLORE THE WORLD',
    'Tu elección no te encierra en un camino: podés cambiar de idea mientras creás.': 'Your choice does not lock you into a path: you can change your mind as you create.',
    '← VOLVER A ELEGIR CAMINO': '← BACK TO PATH SELECTION',
    'CAMINO 02 // PRIMERAS PISTAS': 'PATH 02 // FIRST CLUES',
    '¿QUÉ TE GUSTARÍA DESCUBRIR?': 'WHAT WOULD YOU LIKE TO DISCOVER?',
    'No necesitás saber qué clase o linaje querés jugar. Elegí qué tipo de lugares, historias o culturas te llaman la atención y usaremos esa curiosidad como punto de partida.': 'You do not need to know which class or lineage you want to play. Choose the kinds of places, stories, or cultures that interest you, and we will use that curiosity as a starting point.',
    'ME GUSTARÍA EXPLORAR…': 'I WOULD LIKE TO EXPLORE…',
    'Ciudades y culturas': 'Cities and cultures',
    'Costumbres, comunidades, mercados y formas de vivir.': 'Customs, communities, markets, and ways of life.',
    'Bosques y tierras salvajes': 'Forests and wilderness',
    'Naturaleza, fronteras desconocidas y vida lejos de las ciudades.': 'Nature, unknown frontiers, and life far from the cities.',
    'Imperios y conflictos': 'Empires and conflicts',
    'Lealtades, disputas, poder y decisiones que cambian regiones.': 'Loyalties, disputes, power, and decisions that change regions.',
    'Ruinas y secretos': 'Ruins and secrets',
    'Vestigios antiguos, leyendas y preguntas sin respuesta.': 'Ancient remnants, legends, and unanswered questions.',
    'Caminos y costas': 'Roads and coasts',
    'Viajes, encuentros, rutas y horizontes lejanos.': 'Journeys, encounters, routes, and distant horizons.',
    'Magia y lugares extraordinarios': 'Magic and extraordinary places',
    'Lo inexplicable, lo sagrado y lo que desafía lo conocido.': 'The inexplicable, the sacred, and what challenges the known world.',
    'Estas pistas son puntos de partida. Para el Appendix, la procedencia se limita a las diez ciudades del Imperio Gris. La historia de origen desarrollada a partir de la ciudad elegida queda para la siguiente fase.': 'These clues are starting points. For the Appendix, place of origin is limited to the ten cities of the Grey Empire. The origin story based on the chosen city will be developed in a later phase.',
    'Elegí una pista para continuar.': 'Choose a clue to continue.',
    'CONTINUAR CON ESTA PISTA': 'CONTINUE WITH THIS CLUE',
    'CAMINO 01 // DAR FORMA A TU IDEA': 'PATH 01 // SHAPE YOUR IDEA',
    'TU PERSONAJE, COMO LO IMAGINASTE': 'YOUR CHARACTER, AS YOU IMAGINED THEM',
    'Contanos lo esencial de ese aventurero que ya tenés en la cabeza. Podés dejar detalles para después.': 'Tell us the essentials of the adventurer you already have in mind. You can leave the details for later.',
    'Al final del proceso, vas a poder elegir de qué región del mundo viene tu personaje y conocer la historia de su origen.': 'At the end of the process, you will be able to choose where in the world your character comes from and learn about their place of origin.',
    '← CAMBIAR MI CAMINO': '← CHANGE MY PATH',
    '01 / IDENTIDAD': '01 / IDENTITY',
    'BORRADOR LOCAL': 'LOCAL DRAFT',
    'ANTERIOR': 'BACK',
    'PASO 1 DE 5': 'STEP 1 OF 5',
    'Raza y variante': 'Species and lineage',
    'Elegí una raza aprobada y completá sus elecciones antes de seguir.': 'Choose an approved species and complete its required choices before continuing.',
    'CONTINUAR': 'CONTINUE',
    'ASIGNACIÓN DEL DIRECTOR // APPENDIX': 'DIRECTOR ASSIGNMENT // APPENDIX',
    'CARGÁ TU ASIGNACIÓN': 'LOAD YOUR ASSIGNMENT',
    'Elegí tu nombre. El nivel y los seis resultados se cargarán cuando la dirección complete tu asignación. El navegador recordará tu elección; no necesitás ingresar ningún código.': 'Choose your name. Your level and six rolls will load once the Director completes your assignment. Your choice will be remembered in this browser; no access code is needed.',
    'JUGADOR': 'PLAYER',
    'Cargando jugadores asignados…': 'Loading assigned players…',
    'CARGAR NIVEL Y RESULTADOS': 'LOAD LEVEL AND ROLLS',
    'Elegí tu nombre. El navegador recordará tu elección; no necesitás ingresar ningún código.': 'Choose your name. This browser will remember your choice; no access code is needed.',
    'Nivel asignado por el Director:': 'Level assigned by the Director:',
    'Seis resultados asignados por el Director:': 'Six rolls assigned by the Director:',
    'ASIGNÁ TUS SEIS CARACTERÍSTICAS': 'ASSIGN YOUR SIX ABILITY SCORES',
    'Elegí un resultado distinto para cada característica. Son valores base: todavía no incluyen incrementos raciales ni otros modificadores.': 'Choose a different roll for each ability score. These are base values and do not yet include species bonuses or other modifiers.',
    'Fuerza / Strength': 'Strength',
    'Destreza / Dexterity': 'Dexterity',
    'Constitución / Constitution': 'Constitution',
    'Inteligencia / Intelligence': 'Intelligence',
    'Sabiduría / Wisdom': 'Wisdom',
    'Carisma / Charisma': 'Charisma',
    'Cargá la asignación primero…': 'Load your assignment first…',
    'Cargá y verificá tu asignación para distribuir las seis tiradas.': 'Load and verify your assignment before distributing the six rolls.',
    'NOMBRE DEL AVENTURERO': 'ADVENTURER NAME',
    'IDIOMA DE LAS HABILIDADES / SKILL LANGUAGE': 'LANGUAGE',
    'Español': 'Español',
    'English': 'English',
    'RAZA / SPECIES': 'SPECIES',
    'Cargando razas aprobadas por el canon de campaña…': 'Loading species approved by campaign canon…',
    'SUBRAZA / VARIANTE': 'SUBRACE / VARIANT',
    'Elegí una raza primero…': 'Choose a species first…',
    'Cargando opciones aprobadas por el canon de campaña…': 'Loading options approved by campaign canon…',
    'CATÁLOGO PERMITIDO // D&D 5E LEGACY': 'APPROVED CATALOG // D&D 5E LEGACY',
    'HABILIDADES DEL LINAJE': 'LINEAGE SKILLS',
    'Algunos linajes conceden habilidades automáticamente o permiten elegir entre varias. Las opciones que ya te concede la clase o el trasfondo no se vuelven a contar aquí.': 'Some lineages grant skills automatically or allow you to choose from several. Options already granted by your class or background are not counted again here.',
    'Elegí un linaje para consultar sus habilidades.': 'Choose a lineage to review its skills.',
    'La selección se guarda en el borrador.': 'Your selection is saved in the draft.',
    'IDIOMAS DEL LINAJE': 'LINEAGE LANGUAGES',
    'Muestra los idiomas que concede automáticamente la especie o variante. Las elecciones de idiomas opcionales se añadirán por separado.': 'Shows the languages automatically granted by the species or variant. Optional language choices are listed separately.',
    'Elegí un linaje para consultar sus idiomas.': 'Choose a lineage to review its languages.',
    'Los datos proceden del catálogo permitido.': 'Data comes from the approved catalog.',
    'NOMBRE DEL LINAJE PERSONALIZADO': 'CUSTOM LINEAGE NAME',
    'CLASE': 'CLASS',
    'Cargando clases aprobadas por el canon de campaña…': 'Loading classes approved by campaign canon…',
    'CANON DE CAMPAÑA // LEGACY/2014': 'CAMPAIGN CANON // LEGACY/2014',
    'HABILIDADES DISPONIBLES POR CLASE': 'CLASS SKILL OPTIONS',
    'Marcá las habilidades que querés para tu personaje. La lista respeta las opciones y la cantidad permitida por la clase; estas elecciones son independientes de las del trasfondo.': 'Select the skills you want for your character. The list follows the options and number allowed by the class; these choices are independent of background skills.',
    'Elegí una clase para seleccionar sus habilidades.': 'Choose a class to select its skills.',
    'Las elecciones se guardan en el borrador.': 'Your choices are saved in the draft.',
    'SUBCLASE': 'SUBCLASS',
    'Elegí una clase primero…': 'Choose a class first…',
    'FAMILIAR DEL PACTO DE LA CADENA (BRUJO, NIVEL 3+)': 'PACT OF THE CHAIN FAMILIAR (WARLOCK, LEVEL 3+)',
    'Aún sin elegir (opcional)': 'Not chosen yet (optional)',
    'Imp — diablo infernal': 'Imp — devil',
    'Pseudodragón': 'Pseudodragon',
    'Sprite': 'Sprite',
    'El quasit no está disponible: es un demonio del Abismo. Esta selección se conserva en el borrador y en el JSON exportado.': 'The quasit is unavailable: it is a demon from the Abyss. This selection is preserved in the draft and exported JSON.',
    'DOTE (SI CORRESPONDE POR LAS REGLAS DEL PERSONAJE)': 'FEAT (IF ALLOWED BY CHARACTER RULES)',
    'Cargando dotes permitidas…': 'Loading approved feats…',
    'Solo se muestran dotes aprobadas explícitamente en el canon de campaña.': 'Only feats explicitly approved by campaign canon are shown.',
    'CONJUROS': 'SPELLS',
    'Explorá los conjuros disponibles para la clase elegida, filtrá por nivel del conjuro y agregá los que quieras considerar para este borrador.': 'Explore the spells available to the chosen class, filter by spell level, and add any you want to consider for this draft.',
    'NIVEL DEL CONJURO': 'SPELL LEVEL',
    'Todos los niveles': 'All levels',
    'Trucos (nivel 0)': 'Cantrips (level 0)',
    'Nivel 1': 'Level 1',
    'Nivel 2': 'Level 2',
    'Nivel 3': 'Level 3',
    'Nivel 4': 'Level 4',
    'Nivel 5': 'Level 5',
    'Nivel 6': 'Level 6',
    'Nivel 7': 'Level 7',
    'Nivel 8': 'Level 8',
    'Nivel 9': 'Level 9',
    'CONJURO DISPONIBLE PARA ESTA CLASE': 'SPELLS AVAILABLE TO THIS CLASS',
    'Primero elegí una clase…': 'Choose a class first…',
    'FORMA DE SUMMON FIEND (DEMON PROHIBIDO)': 'SUMMON FIEND FORM (DEMON PROHIBITED)',
    'Elegí una forma permitida…': 'Choose an allowed form…',
    'Devil — diablo infernal': 'Devil — infernal devil',
    'Yugoloth': 'Yugoloth',
    'Esta elección se guarda junto al conjuro en el borrador. La forma Demon no se ofrece.': 'This choice is saved with the spell in the draft. The Demon form is not offered.',
    'AGREGAR CONJURO': 'ADD SPELL',
    'Elegí una clase para explorar sus conjuros permitidos.': 'Choose a class to explore its permitted spells.',
    'PANTEÓN DEL CODEX DIVINITATUM': 'PANTHEON OF THE CODEX DIVINITATUM',
    '¿A qué divinidad o potencia seguís?': 'Which deity or power do you follow?',
    'Elegí según la fe, el ideal o la tradición de tu personaje. Estas opciones proceden del Codex Divinitatum; cada una tiene su propio ámbito, dogma y relación con el mundo.': 'Choose according to your character’s faith, ideals, or tradition. These options come from the Codex Divinitatum; each has its own domain, doctrine, and relationship with the world.',
    'DIVINIDAD / POTENCIA VENERADA': 'DEITY / VENERATED POWER',
    'Elegí una opción del panteón…': 'Choose an option from the pantheon…',
    'Al elegir una opción, vas a ver sus ámbitos y una síntesis de su tradición.': 'Choose an option to see its domains and a summary of its tradition.',
    'Para clérigos, elegir una divinidad es parte central del concepto. Para paladines, esta elección es opcional: también pueden definir su camino a partir de un juramento.': 'For clerics, choosing a deity is central to the character concept. For paladins, this choice is optional: they can define their path through an oath instead.',
    'No se pudieron cargar las opciones aprobadas de trasfondo. No se mostrarán opciones genéricas.': 'Approved background options could not be loaded. Generic options will not be shown.',
    'TRASFONDO': 'BACKGROUND',
    'Sin opciones aprobadas en el canon de campaña': 'No backgrounds approved by campaign canon',
    'HABILIDADES DEL TRASFONDO': 'BACKGROUND SKILLS',
    'Al elegir un trasfondo, se muestran las habilidades que concede y las opciones que podés seleccionar. Cuando el trasfondo permite elegir habilidades, marcá la cantidad indicada.': 'When you choose a background, its granted skills and available choices will appear. If the background allows skill choices, select the indicated number.',
    'Elegí un trasfondo para consultar y seleccionar sus habilidades.': 'Choose a background to review and select its skills.',
    'MARCA ZODIACAL // NUEVE HIJOS DE LA LUNA': 'ZODIACAL MARK // NINE CHILDREN OF THE MOON',
    'ELEGÍ TU MARCA ZODIACAL': 'CHOOSE YOUR ZODIACAL MARK',
    'Elegí una de las nueve marcas. El don correspondiente y sus decisiones mecánicas se registran con el personaje. Cada truco concedido tiene su propia característica de lanzamiento fija.': 'Choose one of the nine marks. Its gift and mechanical choices are recorded with the character. Each granted cantrip has its own fixed spellcasting ability.',
    'MARCA ZODIACAL': 'ZODIACAL MARK',
    'Cargando las nueve marcas canónicas…': 'Loading the nine canonical marks…',
    'Cargando las marcas zodiacales canónicas…': 'Loading canonical zodiacal marks…',
    'El Cenit Solar, el Nadir de las Sombras y el Plenilunio son marcas cósmicas excepcionales con condiciones de nacimiento propias; no se incluyen como elecciones libres en esta lista zodiacal.': 'The Solar Zenith, the Shadow Nadir, and the Full Moon are exceptional cosmic marks with their own birth conditions; they are not free choices in this zodiacal list.',
    'MARCAS CÓSMICAS EXCEPCIONALES // PRIMORDIALES': 'EXCEPTIONAL COSMIC MARKS // PRIMORDIALS',
    'CONDICIONES DE NACIMIENTO EXCEPCIONALES': 'EXCEPTIONAL BIRTH CONDITIONS',
    'No son marcas de elección libre. Registrá únicamente las condiciones de nacimiento que correspondan a la historia del personaje. Cada truco concedido tiene su propia característica de lanzamiento fija.': 'These are not free-choice marks. Record only the birth conditions that apply to the character’s story. Each granted cantrip has its own fixed spellcasting ability.',
    'Cargando las condiciones cósmicas canónicas…': 'Loading canonical cosmic conditions…',
    'NIVEL INICIAL': 'STARTING LEVEL',
    'PROGRESIÓN LEGACY/2014': 'LEGACY/2014 PROGRESSION',
    'RASGOS DE CLASE HASTA ESTE NIVEL': 'CLASS FEATURES UP TO THIS LEVEL',
    'La lista se actualiza automáticamente según la clase y el nivel elegidos. Las elecciones opcionales y los rasgos de subclase se muestran en pasos separados.': 'The list updates automatically based on the chosen class and level. Optional choices and subclass features appear in separate steps.',
    'Elegí una clase para consultar sus rasgos.': 'Choose a class to review its features.',
    'Los rasgos se actualizan al cambiar de clase o nivel.': 'Features update when you change class or level.',
    'RASGOS DE SUBCLASE HASTA ESTE NIVEL': 'SUBCLASS FEATURES UP TO THIS LEVEL',
    'Al elegir una subclase, acá aparecen sus rasgos correspondientes al nivel actual. Solo se muestran los registros del catálogo permitido para esa clase y subclase.': 'When you choose a subclass, its features for the current level appear here. Only records from the approved catalog for that class and subclass are shown.',
    'Elegí una clase y una subclase para consultar sus rasgos.': 'Choose a class and subclass to review their features.',
    'La lista se actualiza al cambiar de clase, subclase o nivel.': 'The list updates when you change class, subclass, or level.',
    'CONCEPTO / NOTAS': 'CONCEPT / NOTES',
    'APPENDIX // ORIGEN IMPERIAL': 'APPENDIX // IMPERIAL ORIGIN',
    '¿De qué ciudad del Imperio Gris viene tu personaje?': 'Which city of the Grey Empire does your character come from?',
    'Para esta mini campaña, la procedencia se limita a las diez ciudades del Imperio Gris. La información, los avisos cartográficos y las crónicas proceden del registro canónico de ciudades del Appendix.': 'For this mini-campaign, place of origin is limited to the ten cities of the Grey Empire. Information, cartographic notices, and chronicles come from the Appendix’s canonical city register.',
    'CIUDAD DE ORIGEN': 'CITY OF ORIGIN',
    'Cargando las diez ciudades del Imperio Gris…': 'Loading the ten cities of the Grey Empire…',
    'Cargando las diez ciudades del Appendix…': 'Loading the ten cities of the Appendix…',
    'Para Appendix solo se ofrecen ciudades del Imperio Gris. La ciudad de origen se elige por separado de la raza, la clase y las demás opciones del personaje.': 'For the Appendix, only cities of the Grey Empire are available. The city of origin is chosen separately from species, class, and the character’s other options.',
    'HISTORIA DE ORIGEN (OPCIONAL)': 'ORIGIN STORY (OPTIONAL)',
    'PROPONER HISTORIA DESDE MIS ELECCIONES': 'SUGGEST A STORY FROM MY CHOICES',
    'La propuesta usará los datos que elijas y separará el resumen oficial del Atlas del texto creativo.': 'The suggestion will use your choices and keep the Atlas’s official summary separate from creative text.',
    'Este relato pertenece a tu personaje. No agrega ni modifica hechos canónicos del Atlas.': 'This story belongs to your character. It does not add to or change canonical facts in the Atlas.',
    '«Exportar actor base» crea un Actor de Foundry con estas elecciones en la biografía. Todavía no convierte clases, linajes, dotes ni conjuros en elementos mecánicos del sistema; conservá también el JSON del borrador.': '“Export base actor” creates a Foundry Actor with these choices in its biography. Classes, lineages, feats, and spells are not yet converted into system mechanics; keep the draft JSON as well.',
    'GUARDAR BORRADOR': 'SAVE DRAFT',
    'SÍ, TERMINÉ MI PERSONAJE': 'I HAVE FINISHED MY CHARACTER',
    'EXPORTAR JSON': 'EXPORT JSON',
    'EXPORTAR ACTOR BASE': 'EXPORT BASE ACTOR',
    '«Guardar borrador» conserva una copia en este navegador.': '“Save Draft” keeps a copy in this browser.',
    'VISTA PREVIA': 'PREVIEW',
    'FICHA EN CONSTRUCCIÓN': 'CHARACTER SHEET IN PROGRESS',
    'NOMBRE': 'NAME',
    'Sin definir': 'Not set',
    'LINAJE': 'LINEAGE',
    'ASCENDENCIA DRACÓNICA': 'DRACONIC ANCESTRY',
    'A definir': 'To be determined',
    'INCREMENTOS DE CARACTERÍSTICAS': 'ABILITY SCORE INCREASES',
    'ATRIBUTOS BASE': 'BASE ABILITY SCORES',
    'DOTE': 'FEAT',
    'FAMILIAR': 'FAMILIAR',
    'FE / IDEAL': 'FAITH / IDEAL',
    'MARCA(S) CÓSMICA(S)': 'COSMIC MARK(S)',
    'PROCEDENCIA': 'PLACE OF ORIGIN',
    'HISTORIA DE ORIGEN': 'ORIGIN STORY',
    'HABILIDADES ELEGIDAS': 'SELECTED SKILLS',
    'Esta etapa registra la identidad inicial y las tiradas asignadas a características. La aplicación de incrementos raciales, competencias, equipo, hechizos y la integración mecánica completa con Foundry quedan para fases posteriores.': 'This stage records the initial identity and assigned ability rolls. Applying species increases, proficiencies, equipment, spells, and full mechanical integration with Foundry are reserved for later phases.',
    'EL RESTO DE LA HISTORIA TODAVÍA NO ESTÁ ESCRITO.': 'THE REST OF THE STORY HAS YET TO BE WRITTEN.',
    'SALTAR TRANSICIÓN': 'SKIP TRANSITION',
    'Registro canónico:': 'Canonical record:',
    'INFORMACIÓN CANÓNICA': 'CANONICAL INFORMATION',
    'AVISO CARTOGRÁFICO': 'CARTOGRAPHIC NOTICE',
    'CRÓNICA DE LA CIUDAD': 'CITY CHRONICLE',
    'Elegí una de las diez ciudades del Imperio Gris. No hay ninguna ciudad preseleccionada.': 'Choose one of the ten cities of the Grey Empire. No city is preselected.',
    'Elegí una de las diez ciudades del Imperio Gris antes de finalizar o exportar el personaje.': 'Choose one of the ten cities of the Grey Empire before finalizing or exporting the character.',
    'No se pudo cargar el registro canónico de las ciudades del Imperio Gris.': 'The canonical register of Grey Empire cities could not be loaded.',
    'No se pudieron cargar las marcas zodiacales canónicas. No se mostrarán opciones genéricas.': 'Canonical zodiacal marks could not be loaded. No generic options will be shown.',
    'No se pudieron cargar las marcas cósmicas canónicas.': 'Canonical cosmic marks could not be loaded.',
    'No se registró una marca cósmica excepcional. Solo marcá condiciones de nacimiento establecidas para el personaje.': 'No exceptional cosmic mark is recorded. Select only birth conditions established for the character.',
    'Hay varias condiciones marcadas. El canon no especifica cómo resolver marcas cósmicas superpuestas; consultá a la dirección antes de finalizar o exportar.': 'Multiple conditions are selected. Canon does not specify how overlapping cosmic marks are resolved; consult the Director before finalizing or exporting.',
    'Condición de nacimiento registrada. Completá la característica de lanzamiento de cada truco concedido.': 'Birth condition recorded. Complete the spellcasting ability for each granted cantrip.',
    'Elegí una marca para consultar el don y las elecciones que corresponden.': 'Choose a mark to review its gift and related choices.',
    'Elegí el truco concedido': 'CHOOSE THE GRANTED CANTRIP',
    'ELEGÍ EL TRUCO CONCEDIDO': 'CHOOSE THE GRANTED CANTRIP',
    'Elegí uno de los trucos permitidos…': 'Choose one of the permitted cantrips…',
    'CARACTERÍSTICA DE LANZAMIENTO PARA': 'SPELLCASTING ABILITY FOR',
    'Elegí Inteligencia, Sabiduría o Carisma…': 'Choose Intelligence, Wisdom, or Charisma…',
    'PRIMERA HERRAMIENTA': 'FIRST TOOL',
    'SEGUNDA HERRAMIENTA': 'SECOND TOOL',
    'Elegí una herramienta…': 'Choose a tool…',
    'Elegí otra herramienta distinta…': 'Choose a different tool…',
    'Condición:': 'Condition:',
    'Trucos concedidos:': 'Granted cantrips:',
    'Truco elegido:': 'Chosen cantrip:',
    'Característica de lanzamiento fija:': 'Fixed spellcasting ability:',
    'Herramientas elegidas:': 'Chosen tools:',
    'No se especifica una característica de lanzamiento para este truco.': 'No spellcasting ability is specified for this cantrip.',
    'Aún no elegiste una característica de lanzamiento para este truco.': 'You have not chosen a spellcasting ability for this cantrip yet.',
    'No se puede finalizar ni exportar un personaje de nivel superior a 1 hasta que esté implementada la progresión nivel por nivel.': 'A character above level 1 cannot be finalized or exported until level-by-level progression is implemented.',
    'Elegí una raza aprobada por la campaña antes de continuar.': 'Choose a species approved by the campaign before continuing.',
    'Elegí una clase aprobada por la campaña antes de continuar.': 'Choose a class approved by the campaign before continuing.',
    'Elegí una de las nueve marcas zodiacales ordinarias antes de continuar.': 'Choose one of the nine ordinary zodiacal marks before continuing.',
    'Las marcas canónicas todavía se están cargando. No avances sin sus opciones.': 'Canonical marks are still loading. Do not continue without their options.',
    'Etapa completada en la sesión. Podés volver al paso anterior para revisar tus elecciones.': 'Stage completed for this session. You can return to the previous step to review your choices.',
    'BORRADOR GUARDADO EN ESTE NAVEGADOR. TODAVÍA NO ES UN ACTOR DE FOUNDRY.': 'DRAFT SAVED IN THIS BROWSER. IT IS NOT A FOUNDRY ACTOR YET.',
    'ACTOR BASE EXPORTADO. LAS OPCIONES TODAVÍA NO SON ELEMENTOS MECÁNICOS DE FOUNDRY.': 'BASE ACTOR EXPORTED. THE OPTIONS ARE NOT FOUNDRY MECHANICAL ITEMS YET.',
    'No se pudo guardar en el navegador. Revisá el espacio disponible o los permisos de almacenamiento.': 'Could not save in this browser. Check available storage space or browser permissions.',
    'Se encontró un borrador con formato no reconocido; guardá uno nuevo para reemplazarlo.': 'A draft with an unrecognized format was found; save a new one to replace it.',
    'El navegador no permitió leer el borrador local. Podés continuar y volver a intentar guardar.': 'The browser could not read the local draft. You can continue and try saving again.',
    'Tu última pista está marcada. Podés cambiarla o seguir.': 'Your last clue is selected. You can change it or continue.',
    'Elegí una pista antes de continuar; puede cambiar más adelante.': 'Choose a clue before continuing; you can change it later.',
    'Pista elegida:': 'Clue selected:',
    'Podés cambiarla después.': 'You can change it later.',
    'No hay subclases permitidas para esta clase': 'No permitted subclasses are available for this class',
    'Elegí tu patrón…': 'Choose your patron…',
    'Elegí una subclase…': 'Choose a subclass…',
    'Elegí una dote…': 'Choose a feat…',
    'No hay dotes permitidas en el catálogo': 'No feats are permitted in the catalog',
    'Elegí un conjuro…': 'Choose a spell…',
    'No hay conjuros catalogados para esta clase': 'No spells are cataloged for this class',
    'No hay conjuros para este nivel': 'No spells are available at this level',
    'Todavía no agregaste conjuros a este borrador.': 'You have not added any spells to this draft yet.',
    'Quitar': 'Remove',
    'No se pueden mostrar rasgos para una opción fuera del catálogo.': 'Features cannot be shown for an option outside the catalog.',
    'El catálogo no registra habilidades concretas para este linaje.': 'The catalog does not list specific skills for this lineage.',
    'No hay habilidades registradas para seleccionar.': 'No skills are registered for selection.',
    'Elegí una clase para seleccionar sus habilidades.': 'Choose a class to select its skills.',
    'No hay una lista de habilidades de clase cargada para esta opción.': 'No class skill list is loaded for this option.',
    'Las elecciones se guardan en el borrador.': 'Choices are saved in the draft.',
    'No se inventan opciones cuando falta el registro de reglas.': 'Options are not invented when the rules record is missing.',
    'El catálogo no contiene rasgos de clase para esta combinación.': 'The catalog contains no class features for this combination.',
    'El catálogo no contiene rasgos de esta subclase hasta el nivel elegido.': 'The catalog contains no features for this subclass up to the chosen level.',
    'El nivel elegido todavía no es válido.': 'The selected level is not valid yet.',
    'Ingresá un nivel entre 1 y 20.': 'Enter a level between 1 and 20.',
    'Elegí una clase para consultar sus rasgos.': 'Choose a class to review its features.',
    'Los rasgos se actualizan al cambiar de clase o nivel.': 'Features update when you change class or level.',
    'Elegí una clase para consultar los rasgos de subclase.': 'Choose a class to review subclass features.',
    'Elegí una subclase para consultar sus rasgos.': 'Choose a subclass to review its features.',
    'La lista se actualiza al cambiar de clase, subclase o nivel.': 'The list updates when you change class, subclass, or level.',
    'No se encontró la subclase elegida dentro del catálogo permitido.': 'The selected subclass was not found in the approved catalog.',
    'La lista se actualiza al cambiar de clase, subclase o nivel.': 'The list updates when you change class, subclass, or level.',
    'El catálogo no contiene un requisito explícito para esta entrada.': 'The catalog does not list an explicit prerequisite for this entry.',
    'Fuente sin especificar.': 'Source not specified.',
    'Fuente:': 'Source:',
    'Requisitos registrados:': 'Recorded prerequisites:',
    'Concede automáticamente:': 'Automatically grants:',
    'Elegí una clase para explorar sus conjuros permitidos.': 'Choose a class to explore its permitted spells.',
    'El catálogo filtrado no contiene conjuros asignados a esta clase.': 'The filtered catalog contains no spells assigned to this class.',
    'El catálogo no contiene trasfondos aprobados; no se mostrarán opciones genéricas.': 'The catalog contains no approved backgrounds; generic options will not be shown.',
    'La selección se conserva en el borrador.': 'Your selection is preserved in the draft.',
    'Los idiomas se muestran únicamente cuando constan en el catálogo.': 'Languages are shown only when they are listed in the catalog.',
    'Elegí un linaje para consultar sus idiomas.': 'Choose a lineage to review its languages.',
    'Elegí un linaje para consultar sus habilidades.': 'Choose a lineage to review its skills.',
    'No se encontraron datos de idiomas para este linaje.': 'No language data was found for this lineage.',
    'No se registran idiomas adicionales para este linaje.': 'No additional languages are recorded for this lineage.',
    'No hay idiomas opcionales para elegir.': 'There are no optional languages to choose.',
    'No se registran competencias con herramientas para este linaje.': 'No tool proficiencies are recorded for this lineage.',
    'No se registran competencias con armas para este linaje.': 'No weapon proficiencies are recorded for this lineage.',
    'No se registran competencias con armaduras para este linaje.': 'No armor proficiencies are recorded for this lineage.',
    'No se registran incrementos de características para este linaje.': 'No ability score increases are recorded for this lineage.',
    'HABILIDADES DEL LINAJE': 'LINEAGE SKILLS',
    'RASGOS Y HABILIDADES DEL LINAJE': 'LINEAGE TRAITS AND SKILLS',
    'HABILIDADES DEL TRASFONDO': 'BACKGROUND SKILLS',
    'HABILIDADES DE CLASE': 'CLASS SKILLS',
    'Elegí': 'Choose',
    'Elegiste': 'You selected',
    'Nivel ': 'Level ',
    'PASO ': 'STEP ',
    'DE ': 'OF ',
    'Fuente ': 'Source ',
    'A definir': 'To be determined',
    'CANON DE CAMPAÑA': 'CAMPAIGN CANON',
    'Google Sheets pendiente: falta configurar la URL del Web App de Creator Personarum.': 'Google Sheets is pending: the Creator Personarum Web App URL still needs to be configured.',
    'Clérigo': 'Cleric',
    'Paladín': 'Paladin',
    'Pícaro': 'Rogue',
    'Bárbaro': 'Barbarian',
    'Hechicero': 'Sorcerer',
    'Brujo': 'Warlock',
    'Mago': 'Wizard',
    'Bardo': 'Bard',
    'Druida': 'Druid',
    'Explorador': 'Ranger',
    'Guerrero': 'Fighter',
    'Monje': 'Monk',
    'Artífice': 'Artificer',
    'Constitución': 'Constitution',
    'Sabiduría': 'Wisdom',
    'Intimidación': 'Intimidation',
    'Investigación': 'Investigation',
    'Percepción': 'Perception',
    'Interpretación': 'Performance',
    'Persuasión': 'Persuasion',
    'Religión': 'Religion',
    'PATRÓN': 'PATRON',
    'Elegí una raza aprobada por la campaña antes de continuar.': 'Choose a species approved by the campaign before continuing.',
    'Elegí la subraza, variante o ascendencia dracónica antes de continuar.': 'Choose the subrace, variant, or draconic ancestry before continuing.',
    'La opción racial elegida no tiene una variante seleccionada o un registro canónico listo.': 'The selected species option has no selected variant or ready canonical record.',
    'Completá las elecciones de características obligatorias del linaje antes de continuar.': 'Complete the lineage’s required ability score choices before continuing.',
    'Las marcas canónicas todavía se están cargando. No avances sin sus opciones.': 'Canonical marks are still loading. Do not continue without their options.',
    'No se registró una marca cósmica excepcional. Solo marcá condiciones de nacimiento establecidas para el personaje.': 'No exceptional cosmic mark is recorded. Select only birth conditions established for the character.',
    'Hay varias condiciones marcadas. El canon no especifica cómo resolver marcas cósmicas superpuestas; consultá a la dirección antes de finalizar o exportar.': 'Multiple conditions are selected. Canon does not specify how overlapping cosmic marks are resolved; consult the Director before finalizing or exporting.',
    'Condición de nacimiento registrada. Completá la característica de lanzamiento de cada truco concedido.': 'Birth condition recorded. Complete the spellcasting ability for each granted cantrip.',
    'No se pudieron cargar las marcas zodiacales canónicas. No se mostrarán opciones genéricas.': 'Canonical zodiacal marks could not be loaded. Generic options will not be shown.',
    'No se pudieron cargar las marcas cósmicas canónicas.': 'Canonical cosmic marks could not be loaded.',
    'Al elegir una opción, vas a ver sus ámbitos y una síntesis de su tradición.': 'Choose an option to see its domains and a summary of its tradition.',
    'Para clérigos, elegí una divinidad o potencia que dé forma a su fe y a sus dominios. Los ámbitos son los sugeridos por el Codex; no asignan automáticamente mecánicas.': 'For clerics, choose a deity or power that shapes their faith and domains. The domains are those suggested by the Codex; they do not automatically grant mechanics.',
    'Para paladines, la veneración es opcional: el juramento puede ser el centro del personaje. Si sigue una divinidad o potencia, elegila aquí.': 'For paladins, worship is optional: the oath can be the center of the character. If they follow a deity or power, choose it here.',
    'Elegí una raza aprobada por la campaña…': 'Choose a campaign-approved species…',
    'Elegí una clase aprobada por la campaña…': 'Choose a campaign-approved class…',
    'Elegí una opción racial aprobada por la campaña…': 'Choose an approved species option…',
    'Elegí una raza primero…': 'Choose a species first…',
    'Elegí una raza aprobada…': 'Choose an approved species…',
    'Elegí una ascendencia dracónica…': 'Choose a draconic ancestry…',
    'Elegí una subraza o variante…': 'Choose a subrace or variant…',
    'No se encontró el registro de idioma de este linaje en el catálogo.': 'No language record for this lineage was found in the catalog.',
    'Elegí un linaje para consultar sus idiomas.': 'Choose a lineage to review its languages.',
    'Los idiomas se muestran únicamente cuando constan en el catálogo.': 'Languages are shown only when listed in the catalog.',
    'Concede automáticamente: ': 'Automatically grants: ',
    'No hay datos de habilidades adicionales para este linaje en el catálogo.': 'The catalog contains no additional skill data for this lineage.',
    'No se inventan habilidades cuando falta el registro del catálogo.': 'Skills are not invented when the catalog record is missing.',
    'No hay subclases permitidas para esta clase': 'No subclasses are permitted for this class',
    'Elegí una dote para consultar la fuente y los requisitos registrados en el catálogo.': 'Choose a feat to review its source and the prerequisites recorded in the catalog.',
    'Fuente sin especificar.': 'Source not specified.',
    'El catálogo no registra un requisito explícito para esta entrada.': 'The catalog does not record an explicit prerequisite for this entry.',
    'Todavía no agregaste conjuros a este borrador.': 'You have not added any spells to this draft yet.',
    'Quitar conjuro ': 'Remove spell ',
    'Primero elegí una clase…': 'Choose a class first…',
    'No hay conjuros catalogados para esta clase': 'No spells are cataloged for this class',
    'No hay conjuros para este nivel': 'No spells are available at this level',
    'Elegí un conjuro…': 'Choose a spell…',
    'Elegí una clase para explorar sus conjuros permitidos.': 'Choose a class to explore its permitted spells.',
    'El catálogo filtrado no contiene conjuros asignados a esta clase.': 'The filtered catalog contains no spells assigned to this class.',
    'Elegí una clase para consultar sus rasgos.': 'Choose a class to review its features.',
    'Los rasgos se actualizan al cambiar de clase o nivel.': 'Features update when you change class or level.',
    'Ingresá un nivel entre 1 y 20.': 'Enter a level between 1 and 20.',
    'El nivel elegido todavía no es válido.': 'The selected level is not valid yet.',
    'El catálogo no contiene rasgos de clase para esta combinación.': 'The catalog contains no class features for this combination.',
    'Elegí una clase para consultar los rasgos de subclase.': 'Choose a class to review subclass features.',
    'Elegí una subclase para consultar sus rasgos.': 'Choose a subclass to review its features.',
    'La lista se actualiza al cambiar de clase, subclase o nivel.': 'The list updates when you change class, subclass, or level.',
    'No se encontró la subclase elegida dentro del catálogo permitido.': 'The selected subclass was not found in the approved catalog.',
    'No se pueden mostrar rasgos para una opción fuera del catálogo.': 'Features cannot be shown for an option outside the catalog.',
    'El catálogo no contiene rasgos de esta subclase hasta el nivel elegido.': 'The catalog contains no features for this subclass up to the selected level.',
    'Formato de catálogo no válido': 'Invalid catalog format',
    'No se pudo cargar el catálogo de opciones aprobadas por el canon de campaña. No se muestran opciones genéricas.': 'The campaign-approved options catalog could not be loaded. Generic options are not shown.',
    'Falta una URL válida del Web App de Creator Personarum.': 'A valid Creator Personarum Web App URL is missing.',
    'El servicio no devolvió JSON legible.': 'The service did not return readable JSON.',
    'Las seis tiradas están asignadas, una por característica.': 'All six rolls are assigned, one to each ability score.',
    'Cargá la asignación primero…': 'Load the assignment first…',
    'Cargá y verificá tu asignación para distribuir las seis tiradas.': 'Load and verify your assignment before distributing the six rolls.',
    'Elegí un resultado…': 'Choose a roll…',
    'Elegí tu nombre…': 'Choose your name…',
    'Elegí tu nombre antes de cargar la asignación.': 'Choose your name before loading the assignment.',
    'La asignación todavía no contiene un nivel y seis resultados válidos.': 'The assignment does not yet contain a valid level and six rolls.',
    'No se pudo consultar la asignación.': 'The assignment could not be retrieved.',
    'La asignación del Director se usa en «Ya sé lo que quiero jugar».': 'The Director’s assignment is used in “I Know What I Want to Play.”',
    'DEJÁ QUE EL MUNDO TE INSPIRE': 'LET THE WORLD INSPIRE YOU',
    'Primero registrá la pista que te despertó curiosidad. No hace falta que ya tengas nombre, linaje o clase definidos.': 'First record the clue that sparked your curiosity. You do not need to have a name, lineage, or class yet.',
    'AL FINAL: elegí una de las diez ciudades del Imperio Gris para registrar la procedencia de tu personaje.': 'AT THE END: choose one of the ten cities of the Grey Empire as your character’s place of origin.',
    'EXPLORACIÓN': 'EXPLORATION',
    'Podés dejarlo para más adelante': 'You can leave this for later',
    '¿Cómo lo llamarán las crónicas?': 'What will the chronicles call them?',
    'Las asignaciones se consultan en la hoja privada de la campaña.': 'Assignments are checked in the campaign’s private sheet.',
    'Todavía no hace falta que tengas todas las respuestas.': 'You do not need to have all the answers yet.',
    'Ingresá tu nombre de jugador antes de empezar.': 'Enter your player name before starting.',
    'La fuente de Appendix no coincide con el roster local.': 'The Appendix source does not match the local roster.',
    'Una ciudad está duplicada o carece de textos canónicos.': 'A city is duplicated or missing canonical text.',
    'No se pudo leer el registro canónico del Appendix.': 'The Appendix canonical register could not be read.',
    'Appendix no disponible — ciudad pendiente': 'Appendix unavailable — city pending',
    'No se encontró el registro de idioma de este linaje en el catálogo.': 'No language record for this lineage was found in the catalog.',
    'El catálogo no registra un tamaño para este linaje.': 'The catalog does not record a size for this lineage.',
    'El catálogo no registra una velocidad base para este linaje.': 'The catalog does not record a base speed for this lineage.',
    'El catálogo no registra incrementos de características para esta entrada del linaje.': 'The catalog does not record ability score increases for this lineage entry.',
    'El catálogo no registra habilidades concretas para este linaje.': 'The catalog does not record specific skills for this lineage.',
    'Elegí un linaje para consultar sus habilidades.': 'Choose a lineage to review its skills.',
    'La selección se guarda en el borrador.': 'Your selection is saved in the draft.',
    'El borrador conserva la asignación anterior. Elegí tu nombre para volver a cargar el nivel y las tiradas; no necesitás ingresar ningún código.': 'The draft keeps the previous assignment. Choose your name to reload the level and rolls; no access code is needed.',
    'Se encontró un borrador con formato no reconocido; guardá uno nuevo para reemplazarlo.': 'A draft with an unrecognized format was found; save a new one to replace it.',
    'No se pudieron cargar las marcas zodiacales canónicas; no se puede finalizar sin esa selección.': 'Canonical zodiacal marks could not be loaded; the character cannot be finalized without that choice.',
    'El canon no especifica cómo resolver marcas cósmicas superpuestas. El borrador puede guardarse, pero consultá a la dirección antes de finalizar o exportar.': 'Canon does not specify how overlapping cosmic marks are resolved. The draft can be saved, but consult the Director before finalizing or exporting.',
    'Cargá y verificá la asignación del Director antes de finalizar o exportar el personaje.': 'Load and verify the Director’s assignment before finalizing or exporting the character.',
    'Asigná las seis tiradas, una por característica, antes de finalizar o exportar.': 'Assign all six rolls, one to each ability, before finalizing or exporting.',
    'No se puede finalizar ni exportar un personaje de nivel superior a 1: primero hay que completar la base de nivel 1 y las decisiones de cada nivel. La progresión aún no está implementada.': 'A character above level 1 cannot be finalized or exported: the level 1 foundation and each level’s choices must be completed first. Progression has not yet been implemented.',
    'Elegí dos herramientas distintas para la marca de la Tortuga.': 'Choose two different tools for the Turtle mark.',
    'El nivel debe estar entre 1 y 20.': 'The level must be between 1 and 20.',
    'Elegí un jugador antes de guardar.': 'Choose a player before saving.',
    'No se pudo guardar la finalización en este navegador. El personaje sigue editable.': 'The character could not be finalized in this browser. It remains editable.',
    'Podés editar el personaje, pero no se pudo actualizar el estado local. Guardá el borrador para conservarlo.': 'You can edit the character, but its local state could not be updated. Save the draft to preserve it.',
    'Ya hay una historia escrita. No la reemplacé; vaciá el campo manualmente si querés preparar otra propuesta.': 'A story has already been written. It was not replaced; clear the field manually if you want to prepare another suggestion.',
    'Elegí una ciudad del Imperio Gris antes de preparar la propuesta.': 'Choose a city of the Grey Empire before preparing the suggestion.',
    'Propuesta preparada. Podés editarla libremente; el párrafo del Atlas conserva su carácter de referencia canónica.': 'Suggestion prepared. You can edit it freely; the Atlas paragraph remains a canonical reference.',
    'Elegí una pista antes de continuar; puede cambiar más adelante.': 'Choose a clue before continuing; you can change it later.',
    'Volvé a elegir una pista del mundo para continuar con este camino.': 'Choose a world clue again to continue along this path.',
    'Saltar introducción': 'Skip intro',
    'Saltar transición': 'Skip transition',
    'Registro canónico:': 'Canonical record:',
    'PERSONAJE FINALIZADO': 'CHARACTER FINALIZED',
    'VOLVISTE A ESTE CAMINO: CONSERVAMOS LOS DATOS DE ESTA SESIÓN. «GUARDAR BORRADOR» LOS GUARDA EN ESTE NAVEGADOR.': 'YOU RETURNED TO THIS PATH: WE KEPT THIS SESSION’S DATA. “SAVE DRAFT” STORES IT IN THIS BROWSER.',
    'BORRADOR RECUPERADO DE ESTE CAMINO EN ESTE NAVEGADOR.': 'DRAFT RESTORED FOR THIS PATH IN THIS BROWSER.',
    'PERSONAJE FINALIZADO EL ': 'CHARACTER FINALIZED ON ',
    'VOLVISTE A EDITAR EL PERSONAJE. LOS CAMBIOS SE GUARDAN AL PULSAR «GUARDAR BORRADOR».': 'YOU RETURNED TO EDITING THE CHARACTER. CHANGES ARE SAVED WHEN YOU PRESS “SAVE DRAFT”.',
    'Elegí tu nombre para recuperar o guardar tu personaje.': 'Choose your name to restore or save your character.',
    'No se pudo guardar la finalización en este navegador. El personaje sigue editable.': 'The character could not be finalized in this browser. It remains editable.',
    'Dracónido': 'Dragonborn',
    'Enano de las montañas': 'Mountain Dwarf',
    'Kóbold': 'Kobold',
    'Sátiro': 'Satyr',
    'Tritón': 'Triton',
    'Común': 'Common',
    'Dracónico': 'Draconic',
    'Druídico': 'Druidic',
    'Élfico': 'Elvish',
    'Gnómico': 'Gnomish',
    'Ígneo': 'Ignan',
    'Infracomún': 'Undercommon',
    'Engaño': 'Deception',
    'Canon de campaña': 'Campaign canon',
    'opciones del trasfondo': 'background options',
    'cualquier habilidad': 'any skill',
    'clase personalizada': 'custom class',
    'El catálogo no registra habilidades concretas para este trasfondo.': 'The catalog does not record specific skills for this background.',
    'Introducción cinematográfica de Creator Personarum': 'Creator Personarum cinematic introduction',
    'Introducción cinematográfica del libro': 'Cinematic introduction to the book',
    'Transición cinematográfica hacia el creador de personajes': 'Cinematic transition to the character creator',
    'Tu nombre': 'Your name',
    'Pasos de creación': 'Creation steps',
    'Opciones del personaje': 'Character options',
    'Escribí cualquier otro linaje permitido por la campaña': 'Enter another lineage permitted by the campaign',
    'Condiciones de nacimiento para las marcas cósmicas excepcionales': 'Birth conditions for exceptional cosmic marks',
    'Una promesa, una deuda, una pregunta sin resolver…': 'A promise, a debt, an unanswered question…',
    '¿Qué vivió tu personaje antes de comenzar esta aventura?': 'What did your character experience before this adventure began?',
    'ELEGÍ EL TRUCO ADICIONAL CONCEDIDO': 'CHOOSE THE ADDITIONAL GRANTED CANTRIP',
    'Elegí una raza aprobada y completá sus decisiones obligatorias antes de seguir.': 'Choose an approved species and complete its required choices before continuing.',
    'Clase y opciones de clase': 'Class and class options',
    'Elegí la clase y completá sus habilidades y opciones disponibles para el personaje.': 'Choose a class and complete its available skills and options for the character.',
    'Trasfondo y habilidades': 'Background and skills',
    'Revisá las opciones de trasfondo aprobadas y completá sus elecciones cuando estén disponibles.': 'Review approved background options and complete their choices when available.',
    'Marca zodiacal y cósmica': 'Zodiacal and cosmic marks',
    'Elegí una de las nueve marcas zodiacales y registrá solo las condiciones cósmicas que correspondan.': 'Choose one of the nine zodiacal marks and record only the applicable cosmic conditions.',
    'Nivel y resto del personaje': 'Level and remaining character details',
    'Terminá los datos restantes. La progresión obligatoria nivel por nivel todavía requiere una etapa posterior.': 'Complete the remaining details. Required level-by-level progression still needs a later phase.',
    'Ya sé lo que quiero jugar': 'I Know What I Want to Play',
    'Especificá el nombre del linaje personalizado.': 'Enter the custom lineage name.',
    'Para finalizar, escribí el nombre del aventurero.': 'To finalize, enter the adventurer’s name.',
    'Para finalizar, elegí la raza y su variante cuando corresponda.': 'To finalize, choose the species and its variant when applicable.',
    'Para finalizar, especificá el nombre del linaje personalizado.': 'To finalize, enter the custom lineage name.',
    'Para finalizar, elegí una clase.': 'To finalize, choose a class.',
    'Personaje sin nombre': 'Unnamed character',
    'Linaje': 'Lineage',
    'Ascendencia dracónica': 'Draconic ancestry',
    'Clase': 'Class',
    'Nivel elegido': 'Chosen level',
    'Trasfondo': 'Background',
    'Marca zodiacal y don': 'Zodiacal mark and gift',
    'Marcas cósmicas excepcionales': 'Exceptional cosmic marks',
    'Características elegidas para el linaje': 'Ability scores chosen for the lineage',
    'Fuente del Atlas': 'Atlas source',
    'Registro canónico del Appendix': 'Appendix canonical register',
    'Concepto del jugador': 'Player concept',
    'Historia de origen': 'Origin story',
    'Pequeño': 'Small',
    'Mediano': 'Medium',
    'Grande': 'Large',
    'Diminuto': 'Tiny',
    'natación': 'swimming',
    'herramientas de albañil': 'mason’s tools',
    'herramientas de ladrón': 'thieves’ tools',
    'materiales de calígrafo': 'calligrapher’s supplies',
    'herramientas de cartógrafo': 'cartographer’s tools',
    'espadón': 'greatsword',
    'No se encontró un registro coincidente.': 'No matching record was found.',
    'No hay datos de habilidades para esta opción de trasfondo en el catálogo.': 'The catalog contains no skill data for this background option.',
    'Este linaje no requiere elegir idiomas adicionales.': 'This lineage does not require additional language choices.',
    'El catálogo no registra idiomas concedidos ni elecciones de idioma para este linaje.': 'The catalog records no granted languages or language choices for this lineage.',
    'El catálogo registra una elección de idioma, pero no contiene opciones válidas suficientes para mostrarla.': 'The catalog records a language choice but does not contain enough valid options to display it.',
    'Sin idiomas automáticos ni elecciones registradas.': 'No automatic languages or choices are recorded.',
    'Incrementos de características registrados:': 'Ability score increases recorded:',
    'Elegiste todas las habilidades del linaje.': 'You selected all lineage skills.',
    'Algunas opciones ya las concede la clase o el trasfondo; revisá esas elecciones antes de continuar.': 'Some options are already granted by your class or background; review those choices before continuing.',
    'Este linaje concede sus habilidades automáticamente; no hay elecciones adicionales registradas.': 'This lineage grants its skills automatically; no additional choices are recorded.',
    'Elegiste todas las habilidades que permite este trasfondo.': 'You selected all skills allowed by this background.',
    'Este trasfondo concede sus habilidades automáticamente; no hay elecciones adicionales registradas.': 'This background grants its skills automatically; no additional choices are recorded.',
    'Elegí Devil o Yugoloth. La forma Demon está prohibida por la regla de campaña.': 'Choose Devil or Yugoloth. The Demon form is prohibited by campaign rules.'
  };

  const textStates = new WeakMap();
  const attributeStates = new WeakMap();
  const attributes = ['placeholder', 'aria-label', 'title'];

  function getLanguage() {
    return document.documentElement.dataset.creatorLanguage === 'en' ? 'en' : 'es';
  }

  function getPlayerLanguage(playerId) {
    if (!PLAYER_IDS.has(playerId)) return 'es';
    try {
      return window.localStorage.getItem(STORAGE_KEY + '.player.' + playerId) === 'en' ? 'en' : 'es';
    } catch (_) {
      return 'es';
    }
  }

  function setPlayer(playerId) {
    currentPlayerId = PLAYER_IDS.has(playerId) ? playerId : '';
    const next = getPlayerLanguage(currentPlayerId);
    document.documentElement.dataset.creatorLanguage = next;
    document.documentElement.lang = next;
    const skillLanguage = document.getElementById('creator-skill-language');
    if (skillLanguage && skillLanguage.value !== next) {
      skillLanguage.value = next;
      skillLanguage.dispatchEvent(new Event('change', { bubbles: true }));
    }
    applyTranslations();
    window.dispatchEvent(new CustomEvent('creator-personarum:language-changed', { detail: { language: next, playerId: currentPlayerId } }));
    return next;
  }

  function translateText(value) {
    const exact = TEXT[value.trim()];
    if (exact) return value.replace(value.trim(), exact);
    let translated = value;
    translated = translated.replace(/^PASO (\d+) DE (\d+)$/i, 'STEP $1 OF $2');
    translated = translated.replace(/^NIVEL (\d+)$/i, 'LEVEL $1');
    translated = translated.replace(/^Nivel (\d+): /, 'Level $1: ');
    translated = translated.replace(/^(\d+) conjuros disponibles con este filtro\. La selección se conserva en el borrador\.$/, '$1 spells available with this filter. Your selection is saved in the draft.');
    translated = translated.replace(/^Pista elegida: (.+)\. Podés cambiarla después\.$/, 'Clue selected: $1. You can change it later.');
    translated = translated.replace(/^Elegiste las (\d+) habilidades permitidas\.$/, 'You selected all $1 permitted skills.');
    translated = translated.replace(/^Elegiste (\d+) de (\d+); te falta(n)? (\d+)\.$/, 'You selected $1 of $2; $4 remaining.');
    translated = translated.replace(/ · nivel (\d+)/gi, ' · level $1');
    translated = translated.replace(/ \(nivel (\d+)\)/gi, ' (level $1)');
    translated = translated.replace(/^Se recordó tu elección: (.+)\. No necesitás ingresar ningún código\.$/, 'Your choice was remembered: $1. No access code is needed.');
    translated = translated.replace(/^Buscando la asignación de (.+)…$/, 'Looking up $1’s assignment…');
    translated = translated.replace(/^Asignación de (.+) cargada: nivel (\d+) y seis resultados\. Distribuí cada tirada entre una característica distinta\.$/, 'Assignment for $1 loaded: level $2 and six rolls. Assign each roll to a different ability.');
    translated = translated.replace(/^Tu elección quedó guardada\. La dirección todavía debe completar la fila de (.+) en ASIGNACIONES con el nivel y los seis resultados\.$/, 'Your choice was saved. The Director still needs to complete $1’s row in ASSIGNMENTS with the level and six rolls.');
    translated = translated.replace(/^Tu elección quedó guardada, pero no se pudo consultar la asignación de (.+)\.$/, 'Your choice was saved, but $1’s assignment could not be retrieved.');
    translated = translated.replace(/^Elección guardada en este navegador: (.+)\. Podés cambiarla después\.$/, 'Choice saved in this browser: $1. You can change it later.');
    translated = translated.replace(/^Completá las (\d+) habilidades obligatorias del linaje antes de continuar\.$/, 'Complete the $1 required lineage skills before continuing.');
    translated = translated.replace(/^Elegí (\d+) idioma entre estas opciones:$/, 'Choose $1 language from these options:');
    translated = translated.replace(/^Elegí (\d+) idiomas entre estas opciones:$/, 'Choose $1 languages from these options:');
    translated = translated.replace(/^(\d+) idiomas permitidos en este grupo\. Desmarcá uno para cambiar la selección\.$/, '$1 languages are allowed in this group. Uncheck one to change your selection.');
    translated = translated.replace(/^Elegiste (\d+) de (\d+) idiomas opcionales\.$/, 'You selected $1 of $2 optional languages.');
    translated = translated.replace(/^(\d+) idioma\(s\) automático\(s\) registrado\(s\)\.$/, '$1 automatically granted language(s) recorded.');
    translated = translated.replace(/^(\d+) rasgos de clase registrados hasta el nivel (\d+)\.$/, '$1 class features recorded through level $2.');
    translated = translated.replace(/^(\d+) rasgos de subclase registrados hasta el nivel (\d+)\.$/, '$1 subclass features recorded through level $2.');
    translated = translated.replace(/^El servicio respondió HTTP (\d+)\.$/, 'The service returned HTTP $1.');
    translated = translated.replace(/^Concede automáticamente: (.+)\.$/, 'Automatically grants: $1.');
    translated = translated.replace(/^Tamaño registrado: (.+)$/, 'Recorded size: $1');
    translated = translated.replace(/^Fuente: (.+)\.$/, 'Source: $1.');
    translated = translated.replace(/^Quitar conjuro (.+)$/, 'Remove spell $1');
    translated = translated.replace(/^Marcá (\d+) habilidad(es)?$/, 'Select $1 skill(s)');
    translated = translated.replace(/^Elegí exactamente (\d+) habilidades? permitidas?\.$/, 'Choose exactly $1 permitted skill(s).');
    translated = translated.replace(/^PERSONAJE FINALIZADO EL (.+)\. PODÉS VOLVER A EDITARLO CUANDO QUIERAS\.$/, 'CHARACTER FINALIZED ON $1. YOU CAN RETURN TO EDIT IT AT ANY TIME.');
    translated = translated.replace(/^Elegí exactamente (\d+) habilidades? de (.+)\.$/, 'Choose exactly $1 skill(s) from $2.');
    translated = translated.replace(/^Elegí (\d+) habilidades? para el linaje (.+)\.$/, 'Choose $1 skill(s) for the lineage $2.');
    translated = translated.replace(/^Completá las (\d+) características obligatorias para el linaje (.+)\.$/, 'Complete the $1 required ability score choice(s) for the lineage $2.');
    translated = translated.replace(/^Incrementos de características registrados: (.+)$/, 'Ability score increases recorded: $1');
    translated = translated.replace(/^Elegiste todas las habilidades del linaje\.$/, 'You selected all lineage skills.');
    translated = translated.replace(/^Elegiste todas las habilidades que permite este trasfondo\.$/, 'You selected all skills allowed by this background.');
    translated = translated.replace(/^Concede automáticamente (.+)$/, 'Automatically grants $1');
    translated = translated.replace(/^Tamaño registrado: (.+)$/, 'Recorded size: $1');
    translated = translated.replace(/^\s*· nivel (\d+)$/, ' · level $1');
    translated = translated.replace(/^Velocidad base registrada: (.+)$/, 'Recorded base speed: $1');
    translated = translated.replace(/^\((según rasgo de especie)\)$/, '(as listed in the species trait)');
    translated = translated.replace(/^\((ya concedida por clase o trasfondo)\)$/, '(already granted by class or background)');
    translated = translated.replace(/^elegí (\d+) competencia entre (\d+) competencias con herramientas; las opciones concretas no están registradas$/, 'choose $1 proficiency from $2 tool proficiencies; the specific options are not recorded');
    translated = translated.replace(/^elegir (\d+) competencia con arma permitida por el catálogo$/, 'choose $1 weapon proficiency allowed by the catalog');
    translated = translated.replace(/^(\d+) competencias con armas permitidas por el catálogo$/, '$1 weapon proficiencies permitted by the catalog');
    translated = translated.replace(/^(\d+) habilidades permitidas\. Desmarcá una para cambiar la selección\.$/, '$1 skills are allowed. Uncheck one to change your selection.');
    translated = translated.replace(/^(\d+) idiomas permitidos en este grupo\. Desmarcá uno para cambiar la selección\.$/, '$1 languages are allowed in this group. Uncheck one to change your selection.');
    translated = translated.replace(/^Elegí (\d+) habilidad entre estas opciones:$/, 'Choose $1 skill from these options:');
    translated = translated.replace(/^Elegí (\d+) habilidades entre estas opciones:$/, 'Choose $1 skills from these options:');
    translated = translated.replace(/^Marcá (\d+) habilidad$/, 'Select $1 skill');
    translated = translated.replace(/^Marcá (\d+) habilidades$/, 'Select $1 skills');
    translated = translated.replace(/^Elegí (\d+) característica entre estas opciones:$/, 'Choose $1 ability score from these options:');
    translated = translated.replace(/^Elegí (\d+) características entre estas opciones:$/, 'Choose $1 ability scores from these options:');
    translated = translated.replace(/^Elegiste (\d+) de (\d+) habilidades permitidas\.$/, 'You selected $1 of $2 permitted skills.');
    translated = translated.replace(/^Elegiste (\d+) de (\d+) características permitidas\.$/, 'You selected $1 of $2 permitted ability scores.');
    translated = translated.replace(/^Elegiste (\d+) de (\d+) herramientas permitidas\.$/, 'You selected $1 of $2 permitted tools.');
    translated = translated.replace(/^\s*(\d+) rasgos de clase registrados hasta el nivel (\d+)$/, '$1 class features recorded through level $2');
    translated = translated.replace(/^\s*(\d+) rasgos de subclase registrados hasta el nivel (\d+)$/, '$1 subclass features recorded through level $2');
    return translated;
  }

  function translateTextNode(node) {
    if (!node || !node.parentElement || node.parentElement.closest('script,style,textarea,input')) return;
    if (node.parentElement.closest('#creator-preview-name,#creator-preview-origin-story,#creator-origin-story,#creator-concept,#creator-character-name,#creator-player-name')) return;
    const current = node.nodeValue;
    let state = textStates.get(node);
    if (!state) {
      state = { es: current, en: current };
      textStates.set(node, state);
    } else if (current !== state.es && current !== state.en) {
      state.es = current;
    }
    state.en = translateText(state.es);
    const next = getLanguage() === 'en' ? state.en : state.es;
    if (current !== next) node.nodeValue = next;
  }

  function translateAttribute(element, name) {
    const current = element.getAttribute(name);
    if (current == null) return;
    let state = attributeStates.get(element);
    if (!state) {
      state = {};
      attributeStates.set(element, state);
    }
    if (!state[name]) state[name] = { es: current, en: current };
    else if (current !== state[name].es && current !== state[name].en) state[name].es = current;
    state[name].en = translateText(state[name].es);
    const next = getLanguage() === 'en' ? state[name].en : state[name].es;
    if (current !== next) element.setAttribute(name, next);
  }

  function translateElement(element) {
    if (!element || element.nodeType !== 1) return;
    if (element.matches('script,style')) return;
    attributes.forEach(name => translateAttribute(element, name));
    Array.from(element.childNodes).forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) translateTextNode(node);
      else if (node.nodeType === Node.ELEMENT_NODE) translateElement(node);
    });
  }

  function applyTranslations() {
    document.documentElement.dataset.creatorLanguage = getLanguage();
    document.documentElement.lang = getLanguage();
    translateElement(document.body);
    const button = document.getElementById('creator-language-toggle');
    if (button) {
      button.textContent = getLanguage() === 'en' ? 'ESPAÑOL' : 'ENGLISH';
      button.setAttribute('aria-label', getLanguage() === 'en' ? 'Switch language to Spanish' : 'Switch language to English');
      button.title = getLanguage() === 'en' ? 'Switch language to Spanish' : 'Switch language to English';
    }
    document.title = 'Creator Personarum | El Foundry de la Banda';
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = getLanguage() === 'en'
      ? 'Creator Personarum: open the book and begin creating your next adventurer.'
      : 'Creator Personarum: abrí el libro y empezá a crear tu próximo aventurero.';
  }

  function setLanguage(language) {
    const next = language === 'en' ? 'en' : 'es';
    document.documentElement.dataset.creatorLanguage = next;
    if (currentPlayerId) {
      try { window.localStorage.setItem(STORAGE_KEY + '.player.' + currentPlayerId, next); } catch (_) {}
    }
    const skillLanguage = document.getElementById('creator-skill-language');
    if (skillLanguage && skillLanguage.value !== next) {
      skillLanguage.value = next;
      skillLanguage.dispatchEvent(new Event('change', { bubbles: true }));
    }
    applyTranslations();
    window.dispatchEvent(new CustomEvent('creator-personarum:language-changed', { detail: { language: next, playerId: currentPlayerId } }));
  }

  try {
    const rememberedPlayerId = window.localStorage.getItem(PLAYER_ASSIGNMENT_STORAGE_KEY) || '';
    currentPlayerId = PLAYER_IDS.has(rememberedPlayerId) ? rememberedPlayerId : '';
  } catch (_) {
    currentPlayerId = '';
  }
  const initialLanguage = getPlayerLanguage(currentPlayerId);
  document.documentElement.dataset.creatorLanguage = initialLanguage;
  document.documentElement.lang = initialLanguage;

  window.creatorPersonarumLanguage = getLanguage;
  window.creatorPersonarumTranslate = (spanish, english) => getLanguage() === 'en' ? english : spanish;
  window.creatorPersonarumTranslateText = translateText;
  window.creatorPersonarumSetLanguage = setLanguage;
  window.creatorPersonarumSetPlayer = setPlayer;

  const button = document.getElementById('creator-language-toggle');
  if (button) button.addEventListener('click', () => setLanguage(getLanguage() === 'en' ? 'es' : 'en'));

  const skillLanguage = document.getElementById('creator-skill-language');
  if (skillLanguage) skillLanguage.value = initialLanguage;

  const observer = new MutationObserver(records => {
    records.forEach(record => {
      if (record.type === 'characterData') translateTextNode(record.target);
      else if (record.type === 'attributes') translateAttribute(record.target, record.attributeName);
      else record.addedNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) translateTextNode(node);
        else if (node.nodeType === Node.ELEMENT_NODE) translateElement(node);
      });
    });
  });
  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: attributes });
  applyTranslations();
})();
