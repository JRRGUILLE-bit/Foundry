# Creator Personarum — Auditoría del catálogo de subclases

Fecha de revisión: 2026-10-30  
Rama revisada: `main`  
No se modificaron las opciones jugables ni el canon durante esta auditoría.

## Resultado

El selector actual no contiene 115 subclases mal clasificadas: contiene solo 39, y esas 39 corresponden correctamente a los registros aprobados del PHB 2014. El problema real es que el selector recibe un catálogo incompleto: no incluye la gran mayoría de las subclases oficiales de suplementos 2014.

| Estado | Cantidad | Tratamiento actual |
|---|---:|---|
| Opciones visibles en Creator Personarum | 39 | Aprobadas/verificadas; todas del PHB 2014 |
| Exclusiones explícitas | 2 | No mostrar |
| Propuestas canónicas pendientes | 4 | No mostrar hasta revisión/aprobación |
| Candidatas ausentes del canon de subclases | 70 | No mostrar hasta revisión y alta canónica |
| **Total del índice oficial de candidatas** | **115** | |

El índice `creator-personarum-data/player-options.json` declara reglas `dnd5e_2014` y su política incluye fuentes oficiales de Wizards anteriores a 2024; excluye Critical Role/Exandria, material 2024/5.5e, Unearthed Arcana, terceros y homebrew. El catálogo de ejecución `campaign-options.json` aplica además el filtro de aprobación del canon y por eso hoy conserva solo los 39 registros PHB aprobados.

## 39 opciones que sí aparecen

Se compararon por identificador, clase, nombre en inglés/español, nivel de elección y fuente contra `Firmamentum-Velatum/character-data/rules/subclasses/subclasses.json`. Las 39 coinciden con sus registros canónicos y todas son PHB 2014.

| Clase | Opciones visibles | Nivel de elección |
|---|---:|---:|
| Bárbaro | 2 | 3 |
| Bardo | 2 | 3 |
| Clérigo | 7 | 1 |
| Druida | 2 | 2 |
| Guerrero | 3 | 3 |
| Monje | 3 | 3 |
| Paladín | 3 | 3 |
| Explorador | 2 | 3 |
| Pícaro | 3 | 3 |
| Hechicero | 2 | 1 |
| Brujo | 2 | 1 |
| Mago | 8 | 2 |
| Artífice | 0 | — |
| **Total** | **39** | |

Por tanto, no corresponde cambiar las asociaciones de clase/nivel de esos 39 registros. El Artífice, sin embargo, está aprobado como clase y no tiene ninguna subclase en el catálogo ejecutable.

## Exclusiones explícitas

- **Aberrant Mind / Mente aberrante** — Hechicero, TCE, nivel 1. Excluida por la dirección de campaña.
- **The Great Old One / El Gran Antiguo** — Brujo, PHB, nivel 1. Excluida por la dirección de campaña por su vínculo con el Abismo.

Ambas están registradas en `character-data/campaign/excluded-subclass-records.json`; ninguna aparece en el catálogo ejecutable.

## Cuatro propuestas ya presentes en el canon, pero no aprobadas

Estos registros existen en `character-data/rules/subclasses/subclasses.json` con `campaign_status: proposed` y `data_quality: needs_review`. El constructor hace bien en no mostrarlos todavía:

| Clase | Subclase | Fuente |
|---|---|---|
| Bárbaro | Path of the Battlerager | SCAG, p. 121 |
| Clérigo | Arcana Domain | SCAG, p. 125 |
| Clérigo | Death Domain | DMG, p. 96 |
| Guerrero | Purple Dragon Knight (Banneret) | SCAG, p. 128 |

## 70 candidatas oficiales que todavía no tienen registro en el canon de subclases

Estas entradas están en el índice filtrado de opciones 2014, pero no existen en el archivo canónico de subclases. Las páginas y fuentes proceden del índice de referencia; esta lista no las declara aprobadas para la campaña.

### Artífice
- Alchemist — TCE, p. 14
- Armorer — TCE, p. 15
- Artillerist — TCE, p. 17
- Battle Smith — TCE, p. 18

### Guerrero
- Arcane Archer — XGE, p. 28
- Cavalier — XGE, p. 30
- Psi Warrior — TCE, p. 42
- Rune Knight — TCE, p. 44
- Samurai — XGE, p. 31

### Mago
- Bladesinging — TCE, p. 76
- Order of Scribes — TCE, p. 77
- War Magic — XGE, p. 59

### Druida
- Circle of Dreams — XGE, p. 22
- Circle of Spores — TCE, p. 36
- Circle of Stars — TCE, p. 38
- Circle of the Shepherd — XGE, p. 23
- Circle of Wildfire — TCE, p. 39

### Hechicero
- Clockwork Soul — TCE, p. 68
- Divine Soul — XGE, p. 50
- Lunar Sorcery — DSOTDQ, p. 34
- Shadow Magic — XGE, p. 50
- Storm Sorcery — XGE, p. 51

### Bardo
- College of Creation — TCE, p. 28
- College of Eloquence — TCE, p. 29
- College of Glamour — XGE, p. 14
- College of Spirits — VRGR, p. 28
- College of Swords — XGE, p. 15
- College of Whispers — XGE, p. 16

### Explorador
- Drakewarden — FTD, p. 15
- Fey Wanderer — TCE, p. 58
- Gloom Stalker — XGE, p. 41
- Horizon Walker — XGE, p. 42
- Monster Slayer — XGE, p. 43
- Swarmkeeper — TCE, p. 59

### Clérigo
- Forge Domain — XGE, p. 18
- Grave Domain — XGE, p. 19
- Order Domain — TCE, p. 31
- Peace Domain — TCE, p. 32
- Twilight Domain — TCE, p. 34

### Pícaro
- Inquisitive — XGE, p. 45
- Mastermind — XGE, p. 46
- Phantom — TCE, p. 62
- Scout — XGE, p. 47
- Soulknife — TCE, p. 63
- Swashbuckler — XGE, p. 48

### Paladín
- Oath of Conquest — XGE, p. 37
- Oath of Glory — TCE, p. 53
- Oath of Redemption — XGE, p. 38
- Oath of the Crown — SCAG, p. 132
- Oath of the Watchers — TCE, p. 54
- Oathbreaker — DMG, p. 97

### Bárbaro
- Path of the Ancestral Guardian — XGE, p. 9
- Path of the Beast — TCE, p. 24
- Path of the Giant — BGG, p. 11
- Path of the Storm Herald — XGE, p. 10
- Path of the Zealot — XGE, p. 11
- Path of Wild Magic — TCE, p. 25

### Brujo
- The Celestial — XGE, p. 54
- The Fathomless — TCE, p. 72
- The Genie — TCE, p. 73
- The Hexblade — XGE, p. 55
- The Undead — VRGR, p. 30
- The Undying — SCAG, p. 139

### Monje
- Way of Mercy — TCE, p. 49
- Way of the Ascendant Dragon — FTD, p. 13
- Way of the Astral Self — TCE, p. 50
- Way of the Drunken Master — XGE, p. 33
- Way of the Kensei — XGE, p. 34
- Way of the Long Death — SCAG, p. 130
- Way of the Sun Soul — XGE, p. 35

## Segundo defecto: vínculo de rasgos por nombre abreviado

El índice de referencia guarda algunos rasgos con un `subclassShortName` abreviado, no con el nombre completo que tendría la subclase. El adaptador actual elimina ciertos prefijos (`Path of`, `College of`, etc.), pero no resuelve todos los sufijos ni todos los nombres cortos. Antes de integrar las candidatas siguientes hay que extender y probar la asociación de rasgos:

- Arcana Domain → `Arcana`
- Death Domain → `Death`
- Forge Domain → `Forge`
- Grave Domain → `Grave`
- Order Domain → `Order`
- Twilight Domain → `Twilight`
- Lunar Sorcery → `Lunar`
- Shadow Magic → `Shadow`
- Storm Sorcery → `Storm`
- Order of Scribes → `Scribes`
- War Magic → `War`
- Peace Domain → `Peace`

**Corrección aplicada en `Foundry/main`:** `subclassNameAliases()` ahora resuelve el prefijo `Order of` y los sufijos `Domain`, `Sorcery` y `Magic`. La comprobación dirigida de los 12 pares anteriores dio 12/12 coincidencias. Creator Personarum Desktop QA pasó en [run 40999441991](https://github.com/JRRGUILLE-bit/Foundry/actions/runs/40999441991): incluye las regresiones de disponibilidad por nivel, rasgos de progresión, persistencia al cambiar idioma, aislamiento de borradores por jugador y restauración del nivel/subclase tras recargar. Esta corrección no agrega candidatas al selector ni cambia el estado canónico.

## Conclusión y siguiente trabajo

1. El listado visible actual es correcto para las 39 subclases PHB aprobadas, pero no representa el catálogo oficial 2014 disponible en el índice.
2. El hueco es de cobertura: 70 candidatas aún no tienen entrada canónica, y cuatro están esperando revisión/aprobación.
3. Antes de habilitar nuevas opciones hay que revisar su relación con el Abismo según la regla de campaña, preparar sus nombres ES/EN canónicos y completar/validar los datos mecánicos y los vínculos de rasgos.
4. No se habilitó ninguna candidata adicional en esta auditoría. No se cambió el canon ni se levantó ninguna exclusión.
