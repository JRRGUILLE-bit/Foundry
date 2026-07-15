(() => {
  "use strict";

  const container = document.querySelector("#code-rain");
  if (!container) return;

  const snippets = [
    'npc.create("innkeeper", { secrets: 7, accent: "temporary" });',
    'shop.price *= hero.looksRich ? 3 : 1;',
    'mimic.disguise("treasure_chest").overact();',
    'dragon.sleepUntil(party.says("we got this"));',
    'bard.volume = "legally_actionable";',
    'goblin.unionize({ demands: ["snacks", "dental"] });',
    'quest.reward = dm.forgotMath ? "double" : "exposure";',
    'trap.place("middle_of_obvious_hallway");',
    'cleric.prepare("revivify").sigh();',
    'dice.roll("1d20 + misplaced_confidence");',
    'merchant.detectWealth().raisePrices();',
    'wizard.cast("fireball", { location: "indoors" });',
    'tavern.brawl.startBefore("first_round");',
    'skeleton.queue.add(12).forgetWhy();',
    'gelatinousCube.clean("entire_dungeon");',
    'portal.open("somewhere_with_paperwork");',
    'paladin.beginMoralCrisis("again");',
    'rogue.steal("plot_relevant_object");',
    'warlock.patron.fileComplaint("insufficient_brooding");',
    'questgiver.hide("one_crucial_detail");',
    'torch.extinguishAt("worst_possible_moment");',
    'necromancer.schedule("light_maintenance");',
    'kobold.confidence = Infinity;',
    'barbarian.solve("puzzle", "structural_damage");',
    'chest.mimicProbability = 0.87;',
    'healer.sigh({ volume: "audible" });',
    'map.mark("DEFINITELY_NOT_A_TRAP");',
    'villager.panic({ certification: "professional" });',
    'king.delayReward("budget_review");',
    'ranger.track("something_regrettable");',
    'owlbear.requestPermission().deny();',
    'cultist.explainPlan({ timing: "too_early" });',
    'tavern.stool.break("dramatically");',
    'orc.guard.pauseLunch("reluctantly");',
    'potion.identifyAs("probably_fine");',
    'thief.generateApology("unconvincing");',
    'beholder.paranoia.expandToFit();',
    'loot.assign("cursed_boots_of_confidence");',
    'shopkeeper.smile = "contractually_untrustworthy";',
    'quest.log.append("things_are_worse_now");',
    'bard.flirt({ outcome: "catastrophic" });',
    'dragon.taxAudit.begin();',
    'stairs.creak("ominously", { nobodyMoving: true });',
    'guard.suspicion.raise("for_no_reason");',
    'ratSwarm.clockIn("early");',
    'altar.glow({ reason: null });',
    'prophecy.wording = "needlessly_confusing";',
    'dungeon.exit.moveTo("other_side_of_map");',
    'wizard.readManualAfter("explosion");',
    'hero.plan.confidence = 100;',
    'hero.plan.quality = 3;',
    'monster.waitUntil("dramatic_pause_complete");',
    'dm.notes.search("name_of_that_npc");',
    'cleric.requestDonation("suggested_mandatory");',
    'rogue.checkTrapAfter("opening_chest");',
    'paladin.detectEvil("everywhere");',
    'barbarian.whisper({ volume: "battle_cry" });',
    'bard.song.duration = "longer_than_combat";',
    'shopkeeper.returnPolicy = "quest_required";',
    'dragon.hoard.add("receipts");'
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
