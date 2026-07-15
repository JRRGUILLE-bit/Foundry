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
  const columnCount = Math.max(6, Math.min(12, Math.ceil(window.innerWidth / 170)));

  function shuffledLines(seed) {
    const lines = [];
    for (let index = 0; index < 12; index += 1) {
      lines.push(snippets[(seed * 5 + index * 7) % snippets.length]);
    }
    return lines;
  }

  const fragment = document.createDocumentFragment();

  for (let index = 0; index < columnCount; index += 1) {
    const column = document.createElement("span");
    column.className = "code-column";
    column.style.left = `${(index / columnCount) * 100 + (index % 2 ? 1.5 : 0)}%`;
    column.style.setProperty("--fall-duration", `${21 + (index % 5) * 3}s`);
    column.style.setProperty("--fall-delay", `${-index * 2.7}s`);
    column.innerHTML = shuffledLines(index)
      .map((line) => `<span>${line}</span>`)
      .join("<br>");

    if (prefersReducedMotion) {
      column.style.top = `${(index % 4) * 18 - 15}%`;
    }

    fragment.appendChild(column);
  }

  container.appendChild(fragment);
})();
