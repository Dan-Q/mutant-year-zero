// Import Modules
import { MYZ } from "./config.js";
import { registerSystemSettings } from "./settings.js";
import MYZHooks from "./MYZHooks.js";
import { MYZActor } from "./actor/actor.js";
import { MYZMutantSheet } from "./actor/mutant-sheet.js";
import { MYZAnimalSheet } from "./actor/animal-sheet.js";
import { MYZRobotSheet } from "./actor/robot-sheet.js";
import { MYZHumanSheet } from "./actor/human-sheet.js";
import { MYZNpcSheet } from "./actor/npc-sheet.js";
import { MYZArkSheet } from "./actor/ark-sheet.js";
import {MYZVehicleSheet} from "./actor/vehicle-sheet.js";
import { MYZItem } from "./item/item.js";
import { MYZItemSheet } from "./item/item-sheet.js";
import { MYZDieBase } from "./MYZDice.js";
import { MYZDieSkill } from "./MYZDice.js";
import { MYZDieGear } from "./MYZDice.js";

import { DiceRoller } from "./component/dice-roller.js";
import { RollDialog } from "./app/roll-dialog.js";

//import * as migrations from "./migration.js";

/* ------------------------------------ */
/* Setup MYZ system	 */
/* ------------------------------------ */

Hooks.once("init", async function () {
    game.myz = {
        MYZ,
        MYZActor,
        MYZMutantSheet,
        MYZAnimalSheet,
        MYZRobotSheet,
        MYZHumanSheet,
        MYZNpcSheet,
        MYZArkSheet,
        MYZVehicleSheet,
        rollItemMacro,
        DiceRoller,
        RollDialog,
    };
    /**
     * Set an initiative formula for the system
     * @type {String}
     */
    CONFIG.Combat.initiative = {
        formula: "1d6 + (@attributes.agility.value/10)",
        decimals: 1,
    };

    // Define custom Entity classes
    CONFIG.MYZ = MYZ;
    CONFIG.Actor.documentClass = MYZActor;
    CONFIG.Item.documentClass = MYZItem;
    //CONFIG.diceRoller = DiceRoller;

    CONFIG.roller = new DiceRoller();

    CONFIG.Dice.terms["b"] = MYZDieBase;
    CONFIG.Dice.terms["s"] = MYZDieSkill;
    CONFIG.Dice.terms["g"] = MYZDieGear;

    // Register System Settings
    registerSystemSettings();

    // Register sheet application classes
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("mutant-year-zero", MYZMutantSheet, {
        types: ["mutant"],
        makeDefault: true,
    });
    Actors.registerSheet("mutant-year-zero", MYZAnimalSheet, {
        types: ["animal"],
        makeDefault: true,
    });
    Actors.registerSheet("mutant-year-zero", MYZRobotSheet, {
        types: ["robot"],
        makeDefault: true,
    });
    Actors.registerSheet("mutant-year-zero", MYZHumanSheet, {
        types: ["human"],
        makeDefault: true,
    });
    Actors.registerSheet("mutant-year-zero", MYZNpcSheet, {
        types: ["npc"],
        makeDefault: true,
    });
    Actors.registerSheet("mutant-year-zero", MYZArkSheet, {
        types: ["ark"],
        makeDefault: true,
    });
    Actors.registerSheet("mutant-year-zero", MYZVehicleSheet, {
        types: ["vehicle"],
        makeDefault: true,
    });
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("mutant-year-zero", MYZItemSheet, { makeDefault: true });

    /* -------------------------------------------- */
    /*  HANDLEBARS HELPERS      */
    /* -------------------------------------------- */

    _preloadHandlebarsTemplates();

    Handlebars.registerHelper("concat", function () {
        var outStr = "";
        for (var arg in arguments) {
            if (typeof arguments[arg] != "object") {
                outStr += arguments[arg];
            }
        }
        return outStr;
    });

    Handlebars.registerHelper("weaponCategory", function (category) {
        category = normalize(category, "melee");
        switch (category) {
            case "melee":
                return game.i18n.localize("MYZ.WEAPON_MELEE");
            case "ranged":
                return game.i18n.localize("MYZ.WEAPON_RANGED");
        }
    });
    
    Handlebars.registerHelper("armorPart", function (part) {
        part = normalize(part, "armor");
        switch (part) {
            case "armor":
                return game.i18n.localize("MYZ.ARMOR_BODY");
            case "shield":
                return game.i18n.localize("MYZ.ARMOR_SHIELD");
        }
    });

    Handlebars.registerHelper("isBroken", function (item) {
        let bonus = 0;
        let max = 0;
        if (item.type == "weapon") {
            bonus = item.system.bonus.value;
            max = item.system.bonus.max;
        } else if (item.type == "armor") {
            bonus = item.system.rating.value;
            max = item.system.rating.max;
        } else {
            return false;
        }
        if (parseInt(max, 10) > 0 && parseInt(bonus, 10) === 0) {
            return "broken";
        } else {
            return "";
        }
    });

    Handlebars.registerHelper("ifCond", function (v1, operator, v2, options) {
        switch (operator) {
            case "==":
                return v1 == v2 ? options.fn(this) : options.inverse(this);
            case "===":
                return v1 === v2 ? options.fn(this) : options.inverse(this);
            case "!=":
                return v1 != v2 ? options.fn(this) : options.inverse(this);
            case "!==":
                return v1 !== v2 ? options.fn(this) : options.inverse(this);
            case "<":
                return v1 < v2 ? options.fn(this) : options.inverse(this);
            case "<=":
                return v1 <= v2 ? options.fn(this) : options.inverse(this);
            case ">":
                return v1 > v2 ? options.fn(this) : options.inverse(this);
            case ">=":
                return v1 >= v2 ? options.fn(this) : options.inverse(this);
            case "&&":
                return v1 && v2 ? options.fn(this) : options.inverse(this);
            case "||":
                return v1 || v2 ? options.fn(this) : options.inverse(this);
            default:
                return options.inverse(this);
        }
    });

    Handlebars.registerHelper("math", function (lvalue, operator, rvalue, options) {
        lvalue = parseFloat(lvalue);
        rvalue = parseFloat(rvalue);

        return {
            "+": lvalue + rvalue,
            "-": lvalue - rvalue,
            "*": lvalue * rvalue,
            "/": lvalue / rvalue,
            "%": lvalue % rvalue
        }[operator];
    });

    Handlebars.registerHelper("trimString3", function (passedString) {
        var theString = passedString.substring(0, 3);
        return new Handlebars.SafeString(theString);
    });

    Handlebars.registerHelper("createLocalizationString", function () {
        let fullString = "";
        for (var i = 0; i < arguments.length; i++) {
            if (typeof arguments[i] === "string" || arguments[i] instanceof String) {
                fullString += arguments[i];
                if (i + 2 < arguments.length) {
                    fullString += "_";
                }
            }
        }
        return fullString.toUpperCase();
    });

    Handlebars.registerHelper("toLowerCase", function (str) {
        return str.toLowerCase();
    });

    Handlebars.registerHelper("toUpperCase", function (str) {
        return str.toUpperCase();
    });

    Handlebars.registerHelper("isdefined", function (value) {
        return value !== undefined;
    });

    Handlebars.registerHelper("ifvalue", function (condition, value) {
        return condition == value;
    });

    Handlebars.registerHelper("greaterThan", function (val1, val2) {
        return val1 > val2;
    });

    Handlebars.registerHelper("substract", function (val1, val2) {
        return val1 - val2;
    });

    Handlebars.registerHelper("getAbilitiesTypeName", function (val) {
        if(val=="mutant"){
            return "MYZ.MUTATIONS"
        }else if(val=="animal"){
            return "MYZ.ANIMAL_POWERS"
        }else if(val=="robot"){
            return "MYZ.MODULES"
        }else if(val=="human"){
            return "MYZ.CONTACTS"
        }else{ return ""}
    });
});

Hooks.once("ready", async function () {
    // Determine whether a system migration is required and feasible
    const currentVersion = game.settings.get("mutant-year-zero", "systemMigrationVersion");
    const NEEDS_MIGRATION_VERSION = 0.95;
    const COMPATIBLE_MIGRATION_VERSION = 0.5;
    let needMigration = currentVersion < NEEDS_MIGRATION_VERSION || currentVersion === null;

    // ! Perform the migration
    if (needMigration && game.user.isGM) {
        if (currentVersion && currentVersion < COMPATIBLE_MIGRATION_VERSION) {
            ui.notifications.error(
                `Your MYZ system data is from too old a Foundry version and cannot be reliably migrated to the latest version. The process will be attempted, but errors may occur.`,
                { permanent: true }
            );
        }
        // UNCOMMENT import * as migrations from "./migration.js";
        // CALL migrations.migrateWorld(); in future if you need migration and delete two lines bellow since they are contained in the migrations.migrateWorld();     
        //migrations.migrateWorld();
        game.settings.set("mutant-year-zero", "systemMigrationVersion", game.system.version);
        ui.notifications.info(`MYZ System Migration to version ${game.system.version} completed!`, { permanent: true });
    }
    // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
    //Hooks.on("hotbarDrop", (bar, data, slot) => createMYZMacro(data, slot));

});

/* SET CHARACTER TYPE */
/* POPULATE CHARACTER WITH DEFAULT SKILLS */
Hooks.on("createActor", async (actor, options, userId) => MYZHooks.onCreateActor(actor, options, userId));
Hooks.on("preCreateItem", MYZHooks.onPreCreateItem);
Hooks.on("preUpdateItem", MYZHooks.onUpdateOwnedItem);

/* -------------------------------------------- */
/*  DsN Hooks                                   */
/* -------------------------------------------- */

Hooks.on("diceSoNiceRollComplete", (chatMessageID) => { });

Hooks.once("diceSoNiceReady", (dice3d) => {
    dice3d.addColorset({
        name: "yellow",
        description: "Yellow",
        category: "Colors",
        foreground: "#b1990f",
        background: "#b1990f",
        outline: "#b1990f",
        texture: "none",
    });
    dice3d.addColorset({
        name: "green",
        description: "Green",
        category: "Colors",
        foreground: "#00810a",
        background: "#00810a",
        outline: "#00810a",
        texture: "none",
    });

    dice3d.addSystem({ id: "mutant-year-zero", name: "Mutant Year Zero" }, true);
    dice3d.addDicePreset({
        type: "db",
        labels: [
            "systems/mutant-year-zero/ui/dice/b1.png",
            "systems/mutant-year-zero/ui/dice/b2.png",
            "systems/mutant-year-zero/ui/dice/b3.png",
            "systems/mutant-year-zero/ui/dice/b4.png",
            "systems/mutant-year-zero/ui/dice/b5.png",
            "systems/mutant-year-zero/ui/dice/b6.png",
        ],
        colorset: "yellow",
        system: "mutant-year-zero",
    });
    dice3d.addDicePreset({
        type: "ds",
        labels: [
            "systems/mutant-year-zero/ui/dice/s1.png",
            "systems/mutant-year-zero/ui/dice/s2.png",
            "systems/mutant-year-zero/ui/dice/s3.png",
            "systems/mutant-year-zero/ui/dice/s4.png",
            "systems/mutant-year-zero/ui/dice/s5.png",
            "systems/mutant-year-zero/ui/dice/s6.png",
        ],
        colorset: "green",
        system: "mutant-year-zero",
    });
    dice3d.addDicePreset({
        type: "dg",
        labels: [
            "systems/mutant-year-zero/ui/dice/g1.png",
            "systems/mutant-year-zero/ui/dice/g2.png",
            "systems/mutant-year-zero/ui/dice/g3.png",
            "systems/mutant-year-zero/ui/dice/g4.png",
            "systems/mutant-year-zero/ui/dice/g5.png",
            "systems/mutant-year-zero/ui/dice/g6.png",
        ],
        colorset: "black",
        system: "mutant-year-zero",
    });
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createMYZMacro(data, slot) {
    //ui.notifications.warn("DRAGGING ITEMS WILL BE IMPLEMENTED IN THE FUTURE");
    return;
    if (data.type !== "Item") return;
    if (!("data" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
    const item = data.data;

    // Create the macro command
    const command = `game.mutant-year-zero.rollItemMacro("${item.name}");`;
    let macro = game.macros.entities.find((m) => m.name === item.name && m.command === command);
    if (!macro) {
        macro = await Macro.create({
            name: item.name,
            type: "script",
            img: item.img,
            command: command,
            flags: { "mutant-year-zero.itemMacro": true },
        });
    }
    game.user.assignHotbarMacro(macro, slot);
    return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
    const speaker = ChatMessage.getSpeaker();
    let actor;
    if (speaker.token) actor = game.actors.tokens[speaker.token];
    if (!actor) actor = game.actors.get(speaker.actor);
    const item = actor ? actor.items.find((i) => i.name === itemName) : null;
    if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

    // Trigger the item roll
    return item.roll();
}

/* -------------------------------------------- */
/** LOAD PARTIALS
/* -------------------------------------------- */

function _preloadHandlebarsTemplates() {
    const templatePaths = [
        "systems/mutant-year-zero/templates/actor/partials/character-header.html",
        "systems/mutant-year-zero/templates/actor/partials/attributes.html",
        "systems/mutant-year-zero/templates/actor/partials/conditions.html",
        "systems/mutant-year-zero/templates/actor/partials/criticals.html",
        "systems/mutant-year-zero/templates/actor/partials/rot.html",
        "systems/mutant-year-zero/templates/actor/partials/skills.html",
        "systems/mutant-year-zero/templates/actor/partials/weapons.html",
        "systems/mutant-year-zero/templates/actor/partials/armors.html",
        "systems/mutant-year-zero/templates/actor/partials/chassis.html",
        "systems/mutant-year-zero/templates/actor/partials/chassis-1row.html",
        "systems/mutant-year-zero/templates/actor/partials/gear.html",
        "systems/mutant-year-zero/templates/actor/partials/artifacts.html",
        "systems/mutant-year-zero/templates/actor/partials/resource-counter.html",
        "systems/mutant-year-zero/templates/actor/partials/abilities.html",
        "systems/mutant-year-zero/templates/actor/partials/talents.html",
        "systems/mutant-year-zero/templates/actor/partials/info.html",
        "systems/mutant-year-zero/templates/actor/partials/consumables.html",
        "systems/mutant-year-zero/templates/actor/partials/encumbrance.html",
        "systems/mutant-year-zero/templates/actor/partials/actor-effects.html",
        "systems/mutant-year-zero/templates/actor/partials/special.html",
        "systems/mutant-year-zero/templates/actor/partials/npc-inventory.html",
        "systems/mutant-year-zero/templates/item/partials/header-simple.html",
        "systems/mutant-year-zero/templates/item/partials/header-physical.html",
        "systems/mutant-year-zero/templates/item/partials/tabs.html",
        "systems/mutant-year-zero/templates/item/partials/modifiers.html"
        
    ];
    return loadTemplates(templatePaths);
}

function normalize(data, defaultValue) {
    if (data) {
        return data.toLowerCase();
    } else {
        return defaultValue;
    }
}


// CHAT STUNTS
async function _onMYZDiceResult(ev, message, html, data){
    let text = await TextEditor.enrichHTML('<p><strong>Stunts</strong>: For every extra&nbsp;<span style="font-family: myz;">A</span>&nbsp;you roll, choose one of these stunts:</p> <ul> <li>You inflict one more point of damage. You can choose this stunt multiple times, if you roll several&nbsp;<span style="font-family: myz;">A</span>.</li> <li>You subdue or tire your enemy. He suffers one point of fatigue (@UUID[JournalEntry.qlW4AKuIr7ruAAko.JournalEntryPage.EcNUTcVJoZrbs11V]{page 88}).</li> <li>You increase your initiative score by 2 (@UUID[JournalEntry.qlW4AKuIr7ruAAko.JournalEntryPage.tMfXjv0KeMXE9RMn]{page 80}), taking effect next turn.</li> <li>You knock or pull a weapon or other object from your opponent. You choose which. During a conflict, picking up a dropped object counts as a maneuver (@UUID[JournalEntry.qlW4AKuIr7ruAAko.JournalEntryPage.LgY1k9dQaWKFJXR8]{page 80}).</li> <li>Your opponent falls to the ground or is pushed back, for example through a doorway or over a cliff.</li> <li>You hold the opponent in a @UUID[JournalEntry.qlW4AKuIr7ruAAko.JournalEntryPage.BOvWoJtj4smlidiB#grappling]{grapple}. He needs to successfully Fight you to break free, and can&rsquo;t perform any other action (or any maneuver) until he has done so &ndash; or until you are broken or let him go.</li> </ul>', {async: true})
    html.find(".chat-stunts").html(text)
    html.find(".chat-stunts").toggleClass("expanded");
}

Hooks.on("renderChatMessage",(message, html, data)=>{
    html.find('.stunts-link').click( async (event)=> {
        await _onMYZDiceResult(event, message, html, data)
    })    
})
