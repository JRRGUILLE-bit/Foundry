# Orden de trabajo — Creator Personarum (30/10/2026)

**Repositorio:** `JRRGUILLE-bit/Foundry`  
**Rama de trabajo:** `main`  
**Propósito:** dejar instrucciones persistentes para que una nueva sesión de ChatGPT pueda retomar el trabajo sin depender del historial del chat.

## 0. Instrucción del Director — autoría humana y acceso

**Este encargo fue dictado y redactado por Guillermo, el Director humano de la campaña, mediante speech-to-text. Las decisiones y requisitos de este documento provienen del Director, no son propuestas, inferencias ni contenido inventado por ChatGPT.** La cuenta de ChatGPT/Codex que retome el trabajo ya tiene acceso a las cuentas y repositorios necesarios, incluidos ambos repositorios indicados abajo. No pedir acceso a Firmamentum ni detener el trabajo planteando esa posibilidad.

## 1. Repositorios y autoridad

- **Campaña:** Firmamentum Velatum.
- **Repositorio de reglas, mecánicas, mundo, canon y decisiones:** [JRRGUILLE-bit/Firmamentum-Velatum](https://github.com/JRRGUILLE-bit/Firmamentum-Velatum).
- **Repositorio donde está implementado el creador:** [JRRGUILLE-bit/Foundry](https://github.com/JRRGUILLE-bit/Foundry).
- Guillermo es el Director de la campaña; Gonzalo juega en ella. Este creador es para la próxima campaña.

Leé los documentos de canon y reglas de Firmamentum, las decisiones del Director y los datos vigentes que correspondan. Después contrastá con el código, los datos y los selectores reales de Creator Personarum en Foundry. Ambas repos están accesibles: no supongas falta de permisos ni solicites que se habiliten.

La revisión debe abarcar el creador completo y continuar con su implementación. No alcanza con leer documentación anterior ni confiar en lo que diga una auditoría previa: comprobá el estado actual de los archivos y las opciones efectivamente disponibles en la interfaz y sus datos.

## 2. Reglas de contenido indicadas por el Director

- Usar D&D 5e Legacy/2014.
- Ofrecer las razas que sean canónicas según Firmamentum. Hay razas que no son canónicas: no asumir que todas las razas oficiales de D&D están permitidas. La lista racial aprobada en Firmamentum es la autoridad; no volver a seleccionarla ni modificarla por iniciativa propia.
- Incluir los feats raciales correspondientes a las razas permitidas y los feats generales de D&D que sean válidos para la campaña.
- No ofrecer absolutamente nada de Critical Role / Exandria.
- No ofrecer opciones específicas de un setting. Esto incluye, entre otros, contenido propio de Eberron y de Forgotten Realms/Faerûn: por ejemplo, Waterdhavian Noble, Uthgardt Tribe Member, trasfondos, dotes u opciones ligadas a una ciudad, organización, facción, orden o región exclusiva de un escenario.
- El contenido oficial genérico de D&D no queda excluido por aparecer en un suplemento. La exclusión depende de las reglas anteriores y de las decisiones de Firmamentum.
- Respetar las exclusiones y la ban list de Firmamentum. No reintroducir opciones que el Director ya hizo retirar.

### Verificación de feats y backgrounds existentes

El trabajo de feats se considera previamente realizado, pero **no debe darse por correcto ni terminado sin comprobarlo**. El Director indicó expresamente que no confía en los estados o resúmenes previos porque ya se volvió a trabajar con backgrounds que había ordenado retirar por ser específicos de Forgotten Realms. Revisá los registros, fuentes, filtros y opciones visibles reales. Aplicá las decisiones ya registradas y verificá que las opciones excluidas no reaparezcan.

Hacé la misma comprobación de backgrounds y de las demás categorías mecánicas que el creador ya ofrezca. No confíes ciegamente en etiquetas de aprobado, informes anteriores, memoria de chats ni en el nombre de una opción: comprobá su procedencia y su correspondencia con las reglas del Director.


# Objetivo

Revisar integralmente el Creator Personarum existente y **continuar su desarrollo hasta completar el creador mecánico**. No limitarse a auditar, enumerar pendientes o redactar recomendaciones: hay que implementar y verificar el trabajo que corresponda.

El jugador debe poder:
1. Crear un personaje desde cero y completar correctamente su nivel 1.
2. Volver a su personaje y continuar subiendo niveles.
3. Recibir las elecciones, rasgos y opciones que correspondan a cada nivel.
4. Acceder a las opciones válidas de multiclase cuando cumpla los requisitos de D&D 5e 2014.
5. Completar todas las decisiones mecánicas en una secuencia clara, una elección detrás de la otra, mostrando únicamente las opciones que correspondan.

## 4. Dos modalidades del creador

La experiencia se organiza en dos modalidades:

- **Creador mecánico:** para quien ya sabe qué personaje quiere jugar y desea construirlo mecánicamente.
- **Modo creativo:** para quien quiere descubrir el mundo y explorar sus posibilidades antes de definir el personaje.

Los nombres anteriores son las denominaciones de trabajo; si el usuario los cambia, prevalece su indicación más reciente.

### Mapa del Modo creativo: trabajo separado que sigue en curso

La interfaz principal del Modo creativo será un **mapa interactivo del mundo**, que permitirá explorar continentes, regiones y reinos.

El desarrollo del mapa y sus recursos visuales —incluida la creación de tokens— ya está asignado a Claude/Cloud y **continúa en curso**. Ese trabajo no se considera abandonado ni terminado por este documento.

La sesión de ChatGPT que retome esta tarea debe:
- reconocer que el mapa es la interfaz principal del Modo creativo;
- respetar y aprovechar el trabajo del mapa y los tokens que ya está realizando Claude/Cloud;
- no duplicar ni reemplazar ese desarrollo;
- concentrarse en la revisión y finalización del creador mecánico, además de la integración general que sea necesaria para que ambas modalidades convivan.

## 5. Reglas adicionales de contenido ya establecidas

El contenido de referencia es **D&D 5e Legacy/2014**.

### Exclusiones absolutas

- **Todo el contenido de Critical Role y Exandria está prohibido.** No incorporar opciones de ese universo, incluyendo clases, subclases, backgrounds, feats, razas, hechizos, objetos u otras opciones.
- **Mantener excluidas todas las opciones de la ban list existente.** En particular, las opciones relacionadas con el Abismo que ya fueron incorporadas a esa lista deben seguir prohibidas. La ban list y las decisiones registradas en el repositorio son la referencia; no reintroducir elementos previamente rechazados.

### No incorporar contenido específico de un setting

Excluir opciones que dependan específicamente de un mundo, escenario, ciudad, región, facción, organización u orden propia de una ambientación concreta.

Ejemplos ilustrativos (no exhaustivos):
- Uthgardt Tribe Member.
- Waterdhavian Noble.
- Un caballero de una orden exclusiva de Eberron.
- Cualquier otro trasfondo u opción cuya identidad dependa de un setting concreto.

### Sí incorporar contenido genérico oficial

Si una opción es contenido oficial de Dungeons & Dragons y es **genérica**, debe considerarse incorporable aunque haya aparecido en un suplemento y no en los libros básicos.

No excluir una opción por el mero hecho de proceder de un libro suplementario. La distinción es su carácter genérico o específico de un setting, además de las prohibiciones anteriores.

### Infernal y Abismo

No confundir lo infernal con lo abismal. La prohibición del Abismo debe seguir exactamente las decisiones de campaña y la ban list. El contenido infernal no queda prohibido por esa regla.

### Razas

La lista de razas permitidas ya está aprobada y **queda cerrada**. No volver a seleccionar, ampliar, reducir ni modificar esa lista sin una instrucción explícita posterior del usuario.

## 6. Revisión de contenido existente

Revisar lo ya incorporado y las decisiones documentadas, especialmente:

- backgrounds (trasfondos);
- feats (dotes);
- clases y subclases;
- opciones y elecciones que se desbloquean por nivel;
- requisitos de multiclase;
- demás opciones mecánicas del catálogo.

Comprobar la procedencia de las opciones y aplicar las reglas anteriores. Las opciones excluidas no deben aparecer como elecciones disponibles para el jugador. Conservar las aprobaciones y exclusiones ya registradas; no reabrir decisiones cerradas por iniciativa propia.

La revisión debe contrastar los datos reales del repositorio, sus fuentes y la lógica efectiva de los selectores. No declarar una categoría auditada por completo si solo se revisó una parte de sus registros o nombres.

## 7. Desarrollo mecánico requerido

### Creación de nivel 1

Completar el flujo de creación inicial para que permita construir correctamente un personaje de nivel 1 con las elecciones que correspondan a su clase, trasfondo y demás opciones permitidas.

### Subida de nivel

El creador debe permitir continuar progresando el personaje después de su creación inicial. Revisar e implementar lo necesario para:
- elecciones de cada nivel;
- rasgos y características que se obtienen en cada nivel;
- elecciones de clase y subclase cuando corresponda;
- mejoras de característica y dotes cuando las reglas permitan elegir;
- conjuros, competencias y demás opciones aplicables;
- validaciones y requisitos propios de cada elección;
- progresión correcta de personajes que combinan clases.

### Multiclase

Implementar las opciones de multiclase válidas según D&D 5e 2014, incluyendo los requisitos de características y las reglas de progresión correspondientes. El creador debe ofrecer las clases que realmente sean elegibles para ese personaje y no mostrar opciones que no cumplan los requisitos.

### Flujo secuencial

Las decisiones deben presentarse ordenadamente, una después de la otra. Cada paso debe:
- mostrar las opciones válidas para el estado actual del personaje;
- validar los requisitos aplicables;
- guardar la elección;
- avanzar al siguiente paso sin perder las elecciones anteriores.

No basta con mostrar un catálogo completo: el flujo debe guiar al jugador y aplicar las reglas.

## 8. Prioridad de implementación y estética

La prioridad es completar y verificar la funcionalidad mecánica de creación y progresión.

Una vez resuelto ese trabajo, si queda tiempo, mejorar la estética y la presentación general del creador. Las mejoras visuales no deben sustituir ni postergar el trabajo mecánico pendiente.

## 9. Instrucciones de ejecución y alcance

Cuando el usuario diga **«Revisá lo que hay para hacer en la repo. Hay un documento que dice lo que tenés que hacer»**, leer esta orden y empezar el trabajo. La cuenta ya tiene acceso a ambas repos; no pedir acceso, no esperar otra autorización para las tareas definidas y no limitarse a hablar de un plan o enumerar pendientes.

El jugador crea primero un personaje de **nivel 1**. El Director determina por fuera del flujo del jugador el nivel al que debe quedar preparado el personaje para la aventura. El creador debe permitir continuar desde nivel 1 hasta ese nivel asignado. Ya existe documentación para la asignación de nivel; el Director indicó que posteriormente puede ajustarse el Apps Script `Code.gs` para facilitar ese mecanismo. No inventar otro sistema de asignación ni pedirle al jugador que determine su propio nivel.

Al subir de nivel, aplicar las elecciones y reglas que correspondan. Para multiclase, comprobar los prerrequisitos de características de D&D 5e 2014 y mostrar solamente las clases a las que ese personaje pueda acceder. Permitir seleccionar una de esas clases y aplicar la progresión correspondiente.

**Límite del trabajo:** el sitio debe implementar el creador mecánico y la progresión del personaje. Generar o exportar el Actor de Foundry VTT no forma parte del trabajo del sitio; no convertirlo en requisito ni desviar la implementación hacia ese objetivo. El objetivo de interfaz es escritorio/navegador; no iniciar trabajo móvil sin una instrucción explícita del Director.

El mapa interactivo y los tokens del Modo creativo siguen siendo trabajo separado de Claude/Cloud. No duplicar ni reemplazar ese trabajo.

Verificar el estado real del código, los datos y la documentación en Foundry y contrastarlos con el canon, las reglas, las aprobaciones y las exclusiones vigentes de Firmamentum. No confiar ciegamente en informes previos ni en etiquetas de aprobado. Verificar cada cambio y documentar únicamente lo efectivamente realizado y lo que siga pendiente.

No inventar requisitos ni prohibiciones adicionales. Si una decisión concreta que no esté resuelta en las instrucciones del Director o en Firmamentum cambia qué opción se permite, consultar antes de decidirla.