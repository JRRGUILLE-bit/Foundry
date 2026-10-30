# Orden de trabajo — Creator Personarum (30/10/2026)

**Repositorio:** `JRRGUILLE-bit/Foundry`  
**Rama de trabajo:** `main`  
**Propósito:** dejar instrucciones persistentes para que una nueva sesión de ChatGPT pueda retomar el trabajo sin depender del historial del chat.

#

## 0. Auditoría cruzada obligatoria: Foundry contra Firmamentum Velatum

**Esta es una condición central del trabajo, no una consulta opcional.** El creador está implementado en `JRRGUILLE-bit/Foundry`, pero las reglas de campaña, el mundo, el canon, las decisiones de contenido y las listas de opciones aprobadas/excluidas están documentadas en `JRRGUILLE-bit/Firmamentum-Velatum`.

La auditoría debe abarcar **todo el trabajo existente de Creator Personarum en Foundry** y contrastarlo con la repo Firmamentum. No alcanza con leer el código de Foundry, revisar si compila o comprobar que las opciones existen en D&D. Una opción puede ser oficial y técnicamente correcta y aun así no estar permitida en esta campaña.

### Repositorios y autoridad

- **Repo de implementación:** [JRRGUILLE-bit/Foundry](https://github.com/JRRGUILLE-bit/Foundry). Aquí se inspecciona y desarrolla Creator Personarum.
- **Repo de canon y decisiones:** [JRRGUILLE-bit/Firmamentum-Velatum](https://github.com/JRRGUILLE-bit/Firmamentum-Velatum). Aquí se consulta el mundo, las reglas de campaña, los datasets canónicos, las aprobaciones, las exclusiones y las decisiones vigentes.
- Leer primero el [AI_HANDOFF](https://github.com/JRRGUILLE-bit/Firmamentum-Velatum/blob/main/docs/AI_HANDOFF.md), y después, como mínimo:
  - [CANON_AND_RULES.md](https://github.com/JRRGUILLE-bit/Firmamentum-Velatum/blob/main/docs/CANON_AND_RULES.md)
  - [DECISIONS_AND_OPEN_QUESTIONS.md](https://github.com/JRRGUILLE-bit/Firmamentum-Velatum/blob/main/docs/DECISIONS_AND_OPEN_QUESTIONS.md)
  - [PROJECT_STATUS.md](https://github.com/JRRGUILLE-bit/Firmamentum-Velatum/blob/main/docs/PROJECT_STATUS.md)
  - [MASTER_CHECKLIST.md](https://github.com/JRRGUILLE-bit/Firmamentum-Velatum/blob/main/docs/MASTER_CHECKLIST.md)
  - [world-overview.md](https://github.com/JRRGUILLE-bit/Firmamentum-Velatum/blob/main/lore/world-overview.md)
  - [geography-and-geopolitics.md](https://github.com/JRRGUILLE-bit/Firmamentum-Velatum/blob/main/lore/geography-and-geopolitics.md)
  - [cosmology-and-pantheon.md](https://github.com/JRRGUILLE-bit/Firmamentum-Velatum/blob/main/lore/cosmology-and-pantheon.md)
  - Los archivos JSON actuales de campaña para razas/procedencias, backgrounds, feats, clases, subclases y exclusiones, además de los informes de auditoría vinculados desde esos documentos.
- La información viva de GitHub manda sobre resúmenes antiguos: verificar `main` en ambas repos antes de concluir.

**Si la sesión no tiene acceso de lectura a Firmamentum-Velatum**, debe decirlo claramente y pedir que se habilite. No debe sustituir esa auditoría por una revisión parcial basada solo en Foundry, ni inventar el canon a partir de recuerdos o resúmenes.

### Qué hay que contrastar

Para cada opción mecánica que el creador muestra, guarda, restaura o permite seleccionar, comprobar:
1. que su fuente y edición correspondan a D&D 5e 2014 / Legacy;
2. que sea genérica y no específica de un setting;
3. que no pertenezca a Critical Role / Exandria;
4. que no esté en la ban list ni en las exclusiones de campaña;
5. que sus requisitos, disponibilidad y restricciones coincidan con las decisiones de Firmamentum;
6. que cualquier conexión con el mundo, regiones, reinos, culturas, religiones, panteón o cosmología respete el canon y no invente hechos.

No limitar la auditoría a backgrounds y feats: revisar el conjunto del creador y sus datos visibles —razas (sin reabrir la lista aprobada), clases, subclases, backgrounds, feats, habilidades, idiomas, herramientas, conjuros, rasgos, invocaciones, pactos, marcas, procedencias, elecciones por nivel, multiclase, textos y recorridos— en la medida en que existan en la implementación.

### Resultado exigido de la auditoría

Dejar una matriz trazable de las categorías y opciones revisadas, indicando fuente, decisión de Firmamentum, estado en Foundry y discrepancia/acción necesaria. Separar:
- correcto y alineado;
- presente pero debe excluirse;
- ausente y debe incorporarse por ser genérico, oficial y permitido;
- pendiente de verificación de fuente;
- bloqueado por una decisión de canon realmente abierta.

No marcar como auditado un conjunto que no se revisó registro por registro o con una validación equivalente y reproducible. Corregir las discrepancias autorizadas por decisiones ya existentes. Si una decisión realmente no está tomada en Firmamentum, documentar el punto exacto y consultar antes de inventar una respuesta.


# Objetivo

Revisar integralmente el Creator Personarum existente y **continuar su desarrollo hasta completar el creador mecánico**. No limitarse a auditar, enumerar pendientes o redactar recomendaciones: hay que implementar y verificar el trabajo que corresponda.

El jugador debe poder:
1. Crear un personaje desde cero y completar correctamente su nivel 1.
2. Volver a su personaje y continuar subiendo niveles.
3. Recibir las elecciones, rasgos y opciones que correspondan a cada nivel.
4. Acceder a las opciones válidas de multiclase cuando cumpla los requisitos de D&D 5e 2014.
5. Completar todas las decisiones mecánicas en una secuencia clara, una elección detrás de la otra, mostrando únicamente las opciones que correspondan.

## Dos modalidades del creador

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

## Reglas obligatorias para las opciones de D&D

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

## Revisión de contenido existente

Revisar lo ya incorporado y las decisiones documentadas, especialmente:

- backgrounds (trasfondos);
- feats (dotes);
- clases y subclases;
- opciones y elecciones que se desbloquean por nivel;
- requisitos de multiclase;
- demás opciones mecánicas del catálogo.

Comprobar la procedencia de las opciones y aplicar las reglas anteriores. Las opciones excluidas no deben aparecer como elecciones disponibles para el jugador. Conservar las aprobaciones y exclusiones ya registradas; no reabrir decisiones cerradas por iniciativa propia.

La revisión debe contrastar los datos reales del repositorio, sus fuentes y la lógica efectiva de los selectores. No declarar una categoría auditada por completo si solo se revisó una parte de sus registros o nombres.

## Desarrollo mecánico requerido

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

## Prioridad de implementación y estética

La prioridad es completar y verificar la funcionalidad mecánica de creación y progresión.

Una vez resuelto ese trabajo, si queda tiempo, mejorar la estética y la presentación general del creador. Las mejoras visuales no deben sustituir ni postergar el trabajo mecánico pendiente.

## Cómo retomar esta tarea

Cuando el usuario diga algo equivalente a **«revisá lo que hay para hacer en la repo»**, esta orden es la instrucción de trabajo para Creator Personarum.

La sesión debe:
1. Leer este documento y las instrucciones generales del repositorio.
2. Verificar el estado actual de `main`, el código, los datos, la documentación y las pruebas; no asumir que el estado descrito por auditorías anteriores sigue vigente.
3. Revisar los pendientes reales del creador, incluidos backgrounds, feats y progresión.
4. Tener presente que el mapa y los tokens del Modo creativo siguen siendo trabajo de Claude/Cloud.
5. Continuar con la implementación mecánica; no detenerse en una auditoría o un listado de recomendaciones.
6. Verificar los cambios y actualizar la documentación/checklist correspondiente con lo efectivamente realizado y lo que siga pendiente.

No inventar requisitos ni prohibiciones adicionales. Ante una ambigüedad real que cambie una decisión de contenido o implementación, consultar al usuario antes de decidirla.
