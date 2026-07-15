(() => {
  "use strict";

  const container = document.querySelector("#code-rain");
  if (!container) return;

  const snippets = [
    'npc.create("innkeeper", { alignment: "NG" });',
    'shop.inventory.push(item.roll("rare"));',
    'encounter.spawn("goblin", roll("2d6"));',
    'scene.load("TAVERN_CROSSROADS");',
    'quest.flag.set("dragon_awake", false);',
    'spell.slot.consume(3);',
    'party.member("BARD").inspiration += 1;',
    'loot.table.roll("MAGIC_ITEMS_B");',
    'door.lock.dc = 18;',
    'initiative.sortDescending();',
    'world.activate("SIGIL_GATE");',
    'dm.screen.mode = "HIDDEN";',
    'npc.dialogue.queue("rumor_07");',
    'item.shop.create({ stock: roll("1d8") });',
    'compendium.mount("MONSTERS_5E");',
    'fogOfWar.enabled = true;',
    'token.vision.range = 60;',
    'savingThrow.roll("DEX", 15);',
    'party.longRest.commit();',
    'combat.round += 1;',
    'monster.hp -= damage.roll("4d6");',
    'journal.open("CAMPAIGN_NOTES");',
    'macro.execute("ROLL_INITIATIVE");',
    'actor.class.add("ROGUE", 1);',
    'map.grid.size = 5;',
    'dice.roll("1d20+7");',
    'world.clock.advance("1h");',
    'merchant.price.apply("CHARISMA_MOD");',
    'trap.detect.dc = 16;',
    'portal.destination = "ASTRAL_PLANE";'
  ];

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function getColumnCount() {
    if (window.innerWidth < 560) return 4;
    if (window.innerWidth < 900) return 5;
    if (window.innerWidth < 1300) return 6;
    return 7;
  }

  function shuffledLines(seed) {
    const lines = [];
    for (let index = 0; index < 8; index += 1) {
      lines.push(snippets[(seed * 5 + index * 7) % snippets.length]);
    }
    return lines;
  }

  const columnCount = getColumnCount();
  const laneWidth = 100 / columnCount;
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < columnCount; index += 1) {
    const column = document.createElement("span");
    column.className = "code-column";
    column.style.left = `${index * laneWidth}%`;
    column.style.width = `${laneWidth}%`;
    column.style.overflow = "hidden";
    column.style.paddingInline = "0.7rem";
    column.style.opacity = `${0.42 + (index % 3) * 0.1}`;
    column.style.setProperty("--fall-duration", `${52 + (index % 4) * 9}s`);
    column.style.setProperty("--fall-delay", `${-index * 8.5}s`);

    shuffledLines(index).forEach((line) => {
      const row = document.createElement("span");
      row.textContent = line;
      row.style.display = "block";
      row.style.overflow = "hidden";
      row.style.textOverflow = "clip";
      row.style.whiteSpace = "nowrap";
      row.style.marginBottom = "0.72rem";
      column.appendChild(row);
    });

    if (prefersReducedMotion) {
      column.style.top = `${(index % 4) * 18 - 15}%`;
    }

    fragment.appendChild(column);
  }

  container.appendChild(fragment);
})();
