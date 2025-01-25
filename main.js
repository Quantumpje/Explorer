//#region DECLARATIONS

import DATA_tiles from "./data/tiles.json" with { type: "json" };
import DATA_objects from "./data/objects.json" with { type: "json" };
import DATA_recipes from "./data/recipes.json" with { type: "json" };
import DATA_items from "./data/items.json" with { type: "json" };
import DATA_ids from "./data/ids.json" with { type: "json" };


const DefaultData = {
    player: {
        pos: [0, 0],
        facing: "N",
        selected_item: "Grass",
        inventory: {},
        equipped: {},
    },
    world: {
        meta: {
            name: null,
            seed: null,
            type: null,
            spawn: [0, 0],
            time: 0,
        },
        rows: [],
        updatable_tiles: [],
    },

    originalversion: "v0.0.1",
    version: "v0.0.1",
};

//#endregion



//#region HELPERS

function type_to_halfsize() {
    let halfsize;

    if (Data?.world?.meta?.type == "Classic") { halfsize = 160; }

    if (Data?.world?.meta?.type == "Archipelago") { halfsize = 260; }

    if (Data?.world?.meta?.type == "Smol") { halfsize = 32; }

    if (Data?.world?.meta?.type == "UrMom") { halfsize = 300; }

    if (Data?.world?.meta?.type == "CheckerPatternTest") { halfsize = 200; }

    if (Data?.world?.meta?.type == "Old") { halfsize = 192; }

    return halfsize || 16;
}


function add_updatable_tile(x, y) {
    return Data?.world?.updatable_tiles?.push([x, y]);
}

function remove_updatable_tile(x, y) {
    let array = Data?.world?.updatable_tiles;
    let index = array?.findIndex(function (v) { return v[0] == x && v[1] == y; });

    if (index != -1) {
        return array?.splice(index, 1);
    }

    return undefined;
}

//#endregion



//#region COMPRESSION



//#endregion



//#region SAVE MANAGEMENT

var Data;
var GameLoop;

openWindow("WorldManagementWindow");

const WorldNameInput = document.getElementById("WorldNameInput");
const WorldSeedInput = document.getElementById("WorldSeedInput");
const WorldTypeInput = document.getElementById("WorldTypeInput");

function createWorld() {
    Data = DefaultData;

    generateWorld(WorldSeedInput.value, WorldTypeInput.value, WorldNameInput.value);

    if (GameLoop) { window.clearInterval(GameLoop); }

    GameLoop = start();

    startSaving();

    openWindow("GameWindow");
}

function deleteSave() {
    localStorage.removeItem("Explorer-Data");
    location.reload();
}

function loading() {
    localStorage.removeItem("Explorer-Save");
    localStorage.removeItem("Explorer-World");


    let load = JSON.parse(localStorage.getItem("Explorer-Data"));

    load = checkVersioning(load);

    if (load && load != "No") {
        load.world.rows = decompressWorld(load?.world?.rows);

        Data = load;

        if (GameLoop) { window.clearInterval(GameLoop); }

        GameLoop = start();

        openWindow("GameWindow");

        startSaving();
    }
}


function startSaving() {
    return window.setInterval(function () {
        let exportObj = JSON.parse(JSON.stringify(Data));
        exportObj.world.rows = compressWorld(exportObj?.world?.rows);
        localStorage.setItem("Explorer-Data", JSON.stringify(exportObj));
    }, 1000);
}


function download(exportObj = JSON.parse(JSON.stringify(Data)), exportName = 'Explorer-Data_' + Data?.world?.meta?.name) {
    exportObj.world.rows = compressWorld(exportObj?.world?.rows);
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

const SavefileLoader = document.getElementById("SavefileLoader");

function upload() {
    var fr = new FileReader();
    fr.onload = function (e) {
        console.log(e);
        var result = e.target.result;

        result = checkVersioning(JSON.parse(result));

        localStorage.setItem("Explorer-Data", JSON.stringify(result));
        location.reload();
    };
    fr.readAsText(SavefileLoader.files[0]);
}


// Code with help of ChatGPT
function compressWorld(world) {
    return world.map(row => {
        let compressedRow = [];
        let current = null;
        let count = 0;

        row.forEach(block => {
            const blockStr = `${DATA_ids?.[block.type]},${DATA_ids?.[block.object?.type] || -1}`;
            if (blockStr === current) {
                count++;
            } else {
                if (current) compressedRow.push(`${current}x${count}`);
                current = blockStr;
                count = 1;
            }
        });

        if (current) compressedRow.push(`${current}x${count}`);
        return compressedRow.join("|");
    });
}

// Code with help of ChatGPT
function decompressWorld(compressedWorld) {
    return compressedWorld.map(compressedRow => {
        return compressedRow.split("|").flatMap(chunk => {
            const [data, count] = chunk.split("x");
            const [type, objecttype] = data.split(",").map(String);
            return Array(Number(count)).fill().map(() => ({
                type: DATA_ids?.[type],
                object: { type: objecttype == -1 ? null : DATA_ids?.[objecttype] }
            }));
        });
    });
}


function checkVersioning(data) {
    if (data?.save?.version == 0) {
        let newdata = JSON.parse(JSON.stringify(DefaultData));

        newdata.world.meta.spawn = [0, 0];
        newdata.player.pos = [0, 0];

        newdata.world.meta.name = "Old Imported World";
        newdata.world.meta.seed = null;
        newdata.world.meta.type = "Old";

        newdata.originalversion = "Old";

        if (data?.save?.inventory?.["1"] > 0) { newdata.player.inventory["Grass"] = data?.save?.inventory?.["1"]; }
        if (data?.save?.inventory?.["2"] > 0) { newdata.player.inventory["Sand"] = data?.save?.inventory?.["2"]; }
        if (data?.save?.inventory?.["3"] > 0) { newdata.player.inventory["Wood Block"] = data?.save?.inventory?.["3"]; }
        if (data?.save?.inventory?.["4"] > 0) { newdata.player.inventory["Wood Floor"] = data?.save?.inventory?.["4"]; }
        if (data?.save?.inventory?.["7"] > 0) { newdata.player.inventory["Tree"] = data?.save?.inventory?.["7"]; }
        if (data?.save?.inventory?.["8"] > 0) { newdata.player.inventory["Path"] = data?.save?.inventory?.["8"]; }
        if (data?.save?.inventory?.["9"] > 0) { newdata.player.inventory["Glass"] = data?.save?.inventory?.["9"]; }

        newdata.world.rows = compressWorld(decompressWorld_OLD(data?.world));

        return newdata;
    }

    if (data?.version && data?.version != DefaultData?.version) {

        // Version converters

    } else if (data?.version && data?.version == DefaultData?.version) {
        return data;
    } else {
        return "No";
    }
}

// Code with help of ChatGPT
function decompressWorld_OLD(compressedWorld) {
    return compressedWorld.map(compressedRow => {
        return compressedRow.split("|").flatMap(chunk => {
            const [data, count] = chunk.split("x");
            const [t, n] = data.split(",").map(Number);
            let type;
            let object = null;

            if (t == 0) { type = "Water"; }
            if (t == 1) { type = "Grass"; }
            if (t == 2) { type = "Sand"; }
            if (t == 3 || t == 5 || t == 10) { type = "Wood Block"; }
            if (t == 4) { type = "Wood Floor"; }
            if (t == 6) { type = "Ground Stone"; }
            if (t == 7) { object = { type: "Tree" }; type = "Grass"; }
            if (t == 8) { type = "Path"; }
            if (t == 9) { type = "Glass"; }

            return Array(Number(count)).fill().map(() => ({ type: type, object: object }));
        });
    });
}

//#endregion



//#region TERRAIN GENERATION

function terrain_Classic(x, y, seed) {
    let seedrng = new_rng(seed);
    let rng = new_rng(`${seed} ${x} ${y}`);

    noise.seed(seedrng());
    let n1 = noise.perlin2(x / 9 + Math.PI, y / 9 + Math.PI) * 0.5;

    noise.seed(seedrng());
    let n2 = noise.perlin2(x / 30 + Math.PI, y / 30 + Math.PI) * 1.25;

    noise.seed(seedrng());
    let n3 = noise.perlin2(x / 100 + Math.PI, y / 100 + Math.PI) * 1.5;

    let n = n1 + n2 + n3;

    let R = [rng()];

    let tiletype = "Water";
    if (n > 0) { tiletype = "Grass"; }
    else if (n > -0.075) { tiletype = "Sand"; }

    let objecttype = null;
    let object = null;

    if (tiletype == "Grass" && R[0] < 0.15) {
        objecttype = "Tree";
        object = { type: objecttype };
    }
    else if ((tiletype == "Grass" || tiletype == "Sand") && R[0] < 0.165) {
        objecttype = "Stone";
        object = { type: objecttype };
    }

    else if ((tiletype == "Grass" || tiletype == "Sand") && R[0] < 0.17) {
        objecttype = "Copper Ore";
        object = { type: objecttype };
    }

    else if ((tiletype == "Grass" || tiletype == "Sand") && R[0] < 0.1765) {
        objecttype = "Iron Ore";
        object = { type: objecttype };
    }

    else if ((tiletype == "Grass" || tiletype == "Sand") && R[0] < 0.1785) {
        objecttype = "Diamond Ore";
        object = { type: objecttype };
    }

    return { type: tiletype, object: object };
}

function terrain_Archipelago(x, y, seed) {
    let seedrng = new_rng(seed);
    let rng = new_rng(`${seed} ${x} ${y}`);

    noise.seed(seedrng());
    let n1 = noise.perlin2(x / 9 + Math.PI, y / 9 + Math.PI) * 0.5;

    noise.seed(seedrng());
    let n2 = noise.perlin2(x / 30 + Math.PI, y / 30 + Math.PI) * 1.25;

    let n = n1 + n2;

    let R = [rng()];

    let tiletype = "Water";
    if (n > 0.4) { tiletype = "Grass"; }
    else if (n > 0.325) { tiletype = "Sand"; }

    let objecttype = null;
    let object = null;

    if (tiletype == "Grass" && R[0] < 0.15) {
        objecttype = "Tree";
        object = { type: objecttype };
    }
    else if ((tiletype == "Grass" || tiletype == "Sand") && R[0] < 0.165) {
        objecttype = "Stone";
        object = { type: objecttype };
    }

    else if ((tiletype == "Grass" || tiletype == "Sand") && R[0] < 0.17) {
        objecttype = "Copper Ore";
        object = { type: objecttype };
    }

    else if ((tiletype == "Grass" || tiletype == "Sand") && R[0] < 0.1765) {
        objecttype = "Iron Ore";
        object = { type: objecttype };
    }

    else if ((tiletype == "Grass" || tiletype == "Sand") && R[0] < 0.1775) {
        objecttype = "Diamond Ore";
        object = { type: objecttype };
    }

    return { type: tiletype, object: object };
}

function terrain_Smol(x, y, seed) {
    let seedrng = new_rng(seed);
    let rng = new_rng(`${seed} ${x} ${y}`);

    noise.seed(seedrng());
    let n1 = noise.perlin2(x / 9 + Math.PI, y / 9 + Math.PI) * 0.5;

    noise.seed(seedrng());
    let n2 = noise.perlin2(x / 30 + Math.PI, y / 30 + Math.PI) * 1.25;

    let n = n1 + n2;

    let R = [rng()];

    let tiletype = "Water";
    if (n > 0) { tiletype = "Grass"; }
    else if (n > -0.075) { tiletype = "Sand"; }

    let objecttype = null;
    let object = null;

    if (tiletype == "Grass" && R[0] < 0.15) {
        objecttype = "Tree";
        object = { type: objecttype };
    }
    else if ((tiletype == "Grass" || tiletype == "Sand") && R[0] < 0.165) {
        objecttype = "Stone";
        object = { type: objecttype };
    }

    else if ((tiletype == "Grass" || tiletype == "Sand") && R[0] < 0.17) {
        objecttype = "Copper Ore";
        object = { type: objecttype };
    }

    else if ((tiletype == "Grass" || tiletype == "Sand") && R[0] < 0.1765) {
        objecttype = "Iron Ore";
        object = { type: objecttype };
    }

    else if ((tiletype == "Grass" || tiletype == "Sand") && R[0] < 0.1775) {
        objecttype = "Diamond Ore";
        object = { type: objecttype };
    }

    return { type: tiletype, object: object };
}

function terrain_CheckerPatternTest(x, y, seed) {
    let rng = new_rng(`${seed} ${x} ${y}`);

    let R = [rng()];

    let tiletype = "Grass";
    if ((y % 2 === 0 && x % 2 !== 0) || (y % 2 !== 0 && x % 2 === 0)) {
        tiletype = "Sand";
    }

    let objecttype = null;
    let object = null;
    if (tiletype == "Grass" && !(x == 0 && y == 0) && R[0] < 0.5) {
        objecttype = "Tree";
        object = { type: objecttype };
    }

    return { type: tiletype, object: object };
}

function generateWorld(seed, type, name) {
    let rows = [];

    if (type == "Classic") {
        for (let y = -160; y <= 160; y++) {
            rows[y + 160] = [];
            for (let x = -160; x <= 160; x++) {
                let tile = terrain_Classic(x, y, seed);
                rows[y + 160][x + 160] = tile;
            }
        }
    }

    if (type == "Archipelago") {
        for (let y = -260; y <= 260; y++) {
            rows[y + 260] = [];
            for (let x = -260; x <= 260; x++) {
                let tile = terrain_Archipelago(x, y, seed);
                rows[y + 260][x + 260] = tile;
            }
        }
    }

    if (type == "Smol") {
        for (let y = -32; y <= 32; y++) {
            rows[y + 32] = [];
            for (let x = -32; x <= 32; x++) {
                let tile = terrain_Smol(x, y, seed);
                rows[y + 32][x + 32] = tile;
            }
        }
    }

    if (type == "UrMom") {
        for (let y = -300; y <= 300; y++) {
            rows[y + 300] = [];
            for (let x = -300; x <= 300; x++) {
                let tile = terrain_Classic(x, y, seed);
                rows[y + 300][x + 300] = tile;
            }
        }
    }

    if (type == "CheckerPatternTest") {
        for (let y = -200; y <= 200; y++) {
            rows[y + 200] = [];
            for (let x = -200; x <= 200; x++) {
                let tile = terrain_CheckerPatternTest(x, y, seed);
                rows[y + 200][x + 200] = tile;
            }
        }
    }

    Data.world.rows = rows;
    Data.world.meta.type = type;
    Data.world.meta.seed = seed;
    Data.world.meta.name = name;

    let halfsize = type_to_halfsize();
    let spawn = [0, 0];
    let rng = new_rng(seed);

    while (Data?.world?.rows?.[spawn[1] + halfsize]?.[spawn[0] + halfsize]?.type != "Grass") {
        spawn = [Math.floor((rng() - 0.5) * halfsize * 2), Math.floor((rng() - 0.5) * halfsize * 2)];
    }

    Data.world.meta.spawn = spawn;
    Data.player.pos = spawn;
}

//#endregion



//#region PAGE MANAGEMENT

function openWindow(id) {
    let windows = ["GameWindow", "CraftingWindow", "MapWindow", "WorldManagementWindow", "SettingsWindow", "InfoWindow"];

    for (let w of windows) {
        document.getElementById(w).hidden = true;
    }

    document.getElementById(id).hidden = false;
}

function updateCurrentWorldDisplay() {
    let displays = [["WorldNameDisplay", `World Name: ${Data?.world?.meta?.name}`], ["WorldSeedDisplay", `World Seed: ${Data?.world?.meta?.seed}`], ["WorldTypeDisplay", `World Type: ${Data?.world?.meta?.type}`]];

    if (Data) {
        document.getElementById("NoWorldDisplay").hidden = true;

        document.getElementById("DownloadingDiv").hidden = false;
        document.getElementById("UploadingDiv").hidden = false;

        for (let d of displays) {
            document.getElementById(d[0]).innerHTML = d[1];
            document.getElementById(d[0]).hidden = false;
        }
    } else {
        document.getElementById("NoWorldDisplay").hidden = false;

        document.getElementById("DownloadingDiv").hidden = true;
        document.getElementById("UploadingDiv").hidden = false;

        for (let d of displays) {
            document.getElementById(d[0]).hidden = true;
        }
    }
}; window.setTimeout(updateCurrentWorldDisplay, 50);

function updateCreateNewWorldDisplay() {
    if (Data) {
        document.getElementById("CreateNewWorldDiv").hidden = true;
        document.getElementById("DeleteWorldDiv").hidden = false;
    } else {
        document.getElementById("CreateNewWorldDiv").hidden = false;
        document.getElementById("DeleteWorldDiv").hidden = true;
    }
}; window.setTimeout(updateCreateNewWorldDisplay, 50);

function updateSelectedItemDisplay() {
    if (!Data?.player?.selected_item) {
        document.getElementById("CurrentSelectedItem").innerHTML = "No Item Selected";
    } else {
        document.getElementById("CurrentSelectedItem").innerHTML = `${Data?.player?.selected_item} Selected [${Data?.player?.inventory?.[Data?.player?.selected_item] || 0}x]`;
    }
}


const inv_buttons_list = [];

function setupInventoryButtons() {
    for (let tile of Object.values(DATA_tiles)) {
        if (tile?.data_tags?.holdable) {
            let button = document.createElement("button");
            button.style.background = `url(assets/${tile?.texture})`;
            button.id = `InvButton_${tile?.name}`;
            button.name = tile?.name;
            button.onclick = selectItem;
            document.getElementById("InventoryButtons").appendChild(button);

            inv_buttons_list.push(tile?.name);
        }
    }
    for (let object of Object.values(DATA_objects)) {
        if (object?.data_tags?.holdable) {
            let button = document.createElement("button");
            button.style.background = `url(assets/${object?.texture})`;
            button.id = `InvButton_${object?.name}`;
            button.name = object?.name;
            button.onclick = selectItem;
            document.getElementById("InventoryButtons").appendChild(button);

            inv_buttons_list.push(object?.name);
        }
    }
    for (let item of Object.values(DATA_items)) {
        let button = document.createElement("button");
        button.style.background = `url(assets/${item?.texture})`;
        button.id = `InvButton_${item?.name}`;
        button.name = item?.name;
        button.onclick = selectItem;
        document.getElementById("InventoryButtons").appendChild(button);

        inv_buttons_list.push(item?.name);
    }
}

function updateInventoryButtons() {
    let buttons = document.getElementById("InventoryButtons").children;

    for (let button of buttons) {
        if (Data?.player?.selected_item == button.name) {
            button.style.width = "38px";
            button.style.height = "38px";
        }
        else {
            button.style.width = "36px";
            button.style.height = "36px";
        }
    }
}


function setupCraftingButtons() {
    for (let recipe of Object.values(DATA_recipes)) {
        let inputstring = "";
        let outputstring = "";

        for (let input of recipe?.inputs) {
            let amount = Data?.player?.inventory?.[input[0]] || 0;
            inputstring += `(${input[1]}x ${input[0]} [${amount}x]) `;
        }

        for (let output of recipe?.outputs) {
            let amount = Data?.player?.inventory?.[output[0]] || 0;
            outputstring += `(${output[1]}x ${output[0]} [${amount}x]) `;
        }

        let button = document.createElement("button");
        button.id = `RecipeButton_${recipe?.name}`;
        button.name = recipe?.name;
        button.onclick = craft;
        button.innerHTML = `${recipe?.name}: ${inputstring}---> ${outputstring}`;
        document.getElementById("RecipeButtons").appendChild(button);
    }
}

function updateCraftingButtons() {
    let buttons = document.getElementById("RecipeButtons").children;

    for (let button of buttons) {
        let recipe = DATA_recipes?.[button.name];

        let allowed = true;

        let inputstring = "";
        let outputstring = "";

        for (let input of recipe?.inputs) {
            let amount = Data?.player?.inventory?.[input[0]] || 0;
            inputstring += `(${input[1]}x ${input[0]} [${amount}x]) `;

            if (amount < input[1]) {
                allowed = false;
            }
        }

        for (let output of recipe?.outputs) {
            let amount = Data?.player?.inventory?.[output[0]] || 0;
            outputstring += `(${output[1]}x ${output[0]} [${amount}x]) `;
        }

        button.innerHTML = `${recipe?.name}: ${inputstring}---> ${outputstring}`;

        button.style["background-color"] = allowed ? "green" : "red";
    }
}


function addEquippedImage(name) {
    let img = document.createElement("img");
    img.id = `EquippedItem_${name}`;
    img.src = `assets/${DATA_items?.[name]?.texture}`;
    document.getElementById("EquippedItems").appendChild(img);
}

function removeEquippedImage(name) {
    let img = document.getElementById(`EquippedItem_${name}`);
    if (img) { img.remove(); }
}


function updateTimeDisplay() {
    document.getElementById("TimeDisplay").innerHTML = `Time in world: ${Math.floor(Data?.world?.meta?.time / 2) / 10}s`;
}

function updateOriginalVersionDisplay() {
    document.getElementById("OriginalVersionDisplay").innerHTML = `World was made in version ${Data?.originalversion}`;
}

//#endregion



//#region CANVAS DRAWING

const GameCanvas = document.getElementById("GameCanvas");
const GameCanvasCTX = GameCanvas.getContext("2d");

function drawGameCanvasPlayer() {
    if (Data?.player?.facing == "N") { GameCanvasCTX.drawImage(document.getElementById("player_N.png"), GameCanvas.width / 2 - 12, GameCanvas.height / 2 - 12, 24, 24); }
    if (Data?.player?.facing == "E") { GameCanvasCTX.drawImage(document.getElementById("player_E.png"), GameCanvas.width / 2 - 12, GameCanvas.height / 2 - 12, 24, 24); }
    if (Data?.player?.facing == "S") { GameCanvasCTX.drawImage(document.getElementById("player_S.png"), GameCanvas.width / 2 - 12, GameCanvas.height / 2 - 12, 24, 24); }
    if (Data?.player?.facing == "W") { GameCanvasCTX.drawImage(document.getElementById("player_W.png"), GameCanvas.width / 2 - 12, GameCanvas.height / 2 - 12, 24, 24); }
}

function updateGameCanvas(x, y, p) {
    let halfsize = type_to_halfsize();

    let type = Data?.world?.rows?.[y + halfsize + Data?.player?.pos?.[1]]?.[x + halfsize + Data?.player?.pos?.[0]]?.type || "None";

    GameCanvasCTX.drawImage(document.getElementById(DATA_tiles?.[type]?.texture), (x + 8) * 32, (y + 8) * 32, 32, 32);

    let objecttype = Data?.world?.rows?.[y + halfsize + Data?.player?.pos?.[1]]?.[x + halfsize + Data?.player?.pos?.[0]]?.object?.type || null;

    if (objecttype) {
        GameCanvasCTX.drawImage(document.getElementById(DATA_objects?.[objecttype]?.texture), (x + 8) * 32 + 4, (y + 8) * 32 + 4, 24, 24);
    }

    if (p) { drawGameCanvasPlayer(); }
}

function drawGameCanvas() {
    for (let x = -8; x <= 8; x++) {
        for (let y = -8; y <= 8; y++) {
            updateGameCanvas(x, y, false);
        }
    }

    drawGameCanvasPlayer();
}


const MapCanvas = document.getElementById("MapCanvas");
const MapCanvasCTX = MapCanvas.getContext("2d");

function updateMapCanvas(x, y) {
    let halfsize = type_to_halfsize();

    let type = Data?.world?.rows?.[y + halfsize]?.[x + halfsize]?.type || "None";

    MapCanvasCTX.drawImage(document.getElementById(DATA_tiles?.[type]?.texture), (x + halfsize) * 8, (y + halfsize) * 8, 8, 8);

    let objecttype = Data?.world?.rows?.[y + halfsize]?.[x + halfsize]?.object?.type || null;

    if (objecttype) {
        MapCanvasCTX.drawImage(document.getElementById(DATA_objects?.[objecttype]?.texture), (x + halfsize) * 8 + 1, (y + halfsize) * 8 + 1, 6, 6);
    }
}

function drawMapCanvas() {
    let halfsize = type_to_halfsize();

    for (let x = -halfsize; x <= halfsize; x++) {
        for (let y = -halfsize; y <= halfsize; y++) {
            updateMapCanvas(x, y);
        }
    }
}


function setCanvasSize() {
    let halfsize = type_to_halfsize();
    let size = halfsize * 2 + 1;

    GameCanvas.width = 17 * 32;
    GameCanvas.height = 17 * 32;

    MapCanvas.width = size * 8;
    MapCanvas.height = size * 8;
}

//#endregion



//#region GAME FUNCTIONS

function selectItem() {
    Data.player.selected_item = this.name;
}

function craft() {
    let recipe = DATA_recipes?.[this.name];

    let allowed = true;

    for (let input of recipe?.inputs) {
        let amount = Data?.player?.inventory?.[input[0]] || 0;

        if (amount < input[1]) {
            allowed = false;
        }
    }

    if (allowed) {
        for (let input of recipe?.inputs) {
            if (!Data?.player?.inventory?.[input[0]]) { Data.player.inventory[input[0]] = 0; };
            Data.player.inventory[input[0]] -= input[1];
        }

        for (let output of recipe?.outputs) {
            if (!Data?.player?.inventory?.[output[0]]) { Data.player.inventory[output[0]] = 0; };
            Data.player.inventory[output[0]] += output[1];
        }
    }
}

function equip() {
    let data = DATA_items?.[Data?.player?.selected_item];
    if (data && Data?.player?.equipped && data?.equippable && (!Data?.player?.equipped?.[data?.equiptype] || Data?.player?.equipped?.[data?.equiptype] == data?.name) && Data?.player?.inventory?.[data?.name] > 0) {
        if (!Data?.player?.equipped?.[data?.equiptype]) {
            Data.player.equipped[data.equiptype] = false;
        }
        if (Data?.player?.equipped?.[data?.equiptype]) {
            delete Data.player.equipped[data.equiptype];
            removeEquippedImage(data?.name);
        } else {
            Data.player.equipped[data.equiptype] = data?.name;
            addEquippedImage(data?.name);
        }
    }
}


function updateTile(v, t) {
    let halfsize = type_to_halfsize();

    let x = v[0];
    let y = v[1];

    let tile = Data?.world?.rows?.[y + halfsize]?.[x + halfsize];
    let object = Data?.world?.rows?.[y + halfsize]?.[x + halfsize]?.object;

    if (tile?.type == "Ground Stone" && t % 20 === 0) {
        let sides = [[0, 1], [0, -1], [1, 0], [-1, 0]];

        for (let i in sides) {
            let side = Data?.world?.rows?.[y + halfsize + sides[i][1]]?.[x + halfsize + sides[i][0]];
            if (DATA_tiles?.[side?.type || "None"]?.data_tags?.fluid) {
                Data.world.rows[y + halfsize][x + halfsize].type = DATA_tiles?.[side?.type]?.data_tags?.movingvariant;

                drawGameCanvas();
                updateMapCanvas(x, y);

                break;
            }
        }
    }

    if (object?.type == "Sapling" && t % 20 === 0) {
        if (Math.random() < 0.015) {
            Data.world.rows[y + halfsize][x + halfsize].object = { type: "Tree" };

            drawGameCanvas();
            updateMapCanvas(x, y);

            remove_updatable_tile(x, y);
        }
    }

    if (DATA_tiles?.[tile?.type]?.data_tags?.ismovingfluid && (t + 10) % 20 === 0) {
        Data.world.rows[y + halfsize][x + halfsize].type = DATA_tiles?.[tile?.type]?.data_tags?.stillvariant;

        remove_updatable_tile(x, y);
    }
}


function move(x, y) {
    let halfsize = type_to_halfsize();

    let type = Data?.world?.rows?.[Data?.player?.pos?.[1] + y + halfsize]?.[Data?.player?.pos?.[0] + x + halfsize]?.type || "None";
    let objecttype = Data?.world?.rows?.[Data?.player?.pos?.[1] + y + halfsize]?.[Data?.player?.pos?.[0] + x + halfsize]?.object?.type || null;

    let walked = false;
    if (DATA_tiles?.[type]?.data_tags?.walkable && (!objecttype || DATA_objects?.[objecttype]?.data_tags?.walkable)) {
        Data.player.pos[0] += x;
        Data.player.pos[1] += y;

        drawGameCanvas();

        walked = true;
    }

    return [type, walked];
}

function rotate(r) {
    if (Data?.player?.facing == "N") { Data.player.facing = r == 1 ? "E" : "W"; }
    else if (Data?.player?.facing == "E") { Data.player.facing = r == 1 ? "S" : "N"; }
    else if (Data?.player?.facing == "S") { Data.player.facing = r == 1 ? "W" : "E"; }
    else if (Data?.player?.facing == "W") { Data.player.facing = r == 1 ? "N" : "S"; }

    drawGameCanvasPlayer();

    return [];
}


function place(xo, yo) {
    let halfsize = type_to_halfsize();

    let x = xo + Data?.player?.pos?.[0] + halfsize;
    let y = yo + Data?.player?.pos?.[1] + halfsize;

    let type = Data?.world?.rows?.[y]?.[x]?.type || "None";
    let objecttype = Data?.world?.rows?.[y]?.[x]?.object?.type || null;

    let typetoplace = Data?.player?.selected_item;

    let placed = false;
    if (DATA_tiles?.[typetoplace] && type != "None") {
        if (DATA_tiles?.[type]?.data_tags?.replaceable && DATA_tiles?.[typetoplace]?.data_tags?.placeable && Data?.player?.inventory?.[typetoplace] > 0) {
            if (DATA_tiles?.[type]?.data_tags?.holdable) {
                if (!Data?.player?.inventory?.[type]) { Data.player.inventory[type] = 0; };
                Data.player.inventory[type] += 1;
            }

            Data.player.inventory[typetoplace] -= 1;

            Data.world.rows[y][x].type = typetoplace;

            if (DATA_tiles?.[typetoplace]?.data_tags?.updatable) {
                add_updatable_tile(x - halfsize, y - halfsize);
            }
            else if (DATA_tiles?.[type]?.data_tags?.updatable) {
                remove_updatable_tile(x - halfsize, y - halfsize);
            }

            updateGameCanvas(xo, yo, true);
            updateMapCanvas(x - halfsize, y - halfsize);

            placed = true;
        }
    }
    else if (DATA_objects?.[typetoplace] && type != "None") {
        let notplacerestricted = false;
        if (DATA_objects?.[typetoplace]?.data_tags?.placerestrict) {
            if (DATA_objects?.[typetoplace]?.data_tags?.placerestrictdata?.type == "+") {
                if (DATA_objects?.[typetoplace]?.data_tags?.placerestrictdata?.tiles.includes(type)) { notplacerestricted = true; }
            }
            else if (DATA_objects?.[typetoplace]?.data_tags?.placerestrictdata?.type == "-") {
                if (!DATA_objects?.[typetoplace]?.data_tags?.placerestrictdata?.tiles.includes(type)) { notplacerestricted = true; }
            }
        }
        else {
            notplacerestricted = true;
        }

        if ((DATA_objects?.[objecttype]?.data_tags?.replaceable || objecttype == null) && DATA_objects?.[typetoplace]?.data_tags?.placeable && Data?.player?.inventory?.[typetoplace] > 0 && notplacerestricted) {
            if (DATA_objects?.[objecttype]?.data_tags?.holdable) {
                if (!Data?.player?.inventory?.[objecttype]) { Data.player.inventory[objecttype] = 0; };
                Data.player.inventory[objecttype] += 1;
            }

            Data.player.inventory[typetoplace] -= 1;

            if (!Data?.world?.rows?.[y]?.[x]?.object) {
                Data.world.rows[y][x].object = { type: null };
            }

            Data.world.rows[y][x].object.type = typetoplace;

            if (DATA_objects?.[typetoplace]?.data_tags?.updatable) {
                add_updatable_tile(x - halfsize, y - halfsize);
            }

            updateGameCanvas(xo, yo, true);
            updateMapCanvas(x - halfsize, y - halfsize);

            placed = true;
        }
    }

    return [type, typetoplace, placed];
}

function mine(xo, yo) {
    let halfsize = type_to_halfsize();

    let x = xo + Data?.player?.pos?.[0] + halfsize;
    let y = yo + Data?.player?.pos?.[1] + halfsize;

    let type = Data?.world?.rows?.[y]?.[x]?.type || "None";
    let objecttype = Data?.world?.rows?.[y]?.[x]?.object?.type || null;

    let mined = false;
    if (objecttype) {
        let tierallowed = false;
        let equippedtier = DATA_items?.[Data?.player?.equipped?.Pickaxe]?.tier || 0;
        if (DATA_objects?.[objecttype]?.data_tags?.minimumtier) {
            if (DATA_objects?.[objecttype]?.data_tags?.minimumtier <= equippedtier) {
                tierallowed = true;
            }
        } else {
            tierallowed = true;
        }

        if (DATA_objects?.[objecttype]?.data_tags?.breakable && tierallowed) {
            if (DATA_objects?.[objecttype]?.data_tags?.holdable) {
                if (!Data?.player?.inventory?.[objecttype]) { Data.player.inventory[objecttype] = 0; };
                Data.player.inventory[objecttype] += 1;
            }

            Data.world.rows[y][x].object = null;

            if (DATA_objects?.[objecttype]?.data_tags?.updatable && !DATA_tiles?.[type]?.data_tags?.updatable) {
                remove_updatable_tile(x - halfsize, y - halfsize);
            }

            updateGameCanvas(xo, yo, true);
            updateMapCanvas(x - halfsize, y - halfsize);

            mined = true;
        }
    }
    else if (DATA_tiles?.[type]?.data_tags?.breakable) {
        if (DATA_tiles?.[type]?.data_tags?.holdable) {
            if (!Data?.player?.inventory?.[type]) { Data.player.inventory[type] = 0; };
            Data.player.inventory[type] += 1;
        }

        Data.world.rows[y][x].type = "Ground Stone";

        if (DATA_tiles?.["Ground Stone"]?.data_tags?.updatable) {
            add_updatable_tile(x - halfsize, y - halfsize);
        }

        updateGameCanvas(xo, yo, true);
        updateMapCanvas(x - halfsize, y - halfsize);

        mined = true;
    }

    return [type, mined];
}

//#endregion



//#region USER INPUT

const pressedkeys = {
    w: false,
    s: false,
    a: false,
    d: false,
    q: false,
    e: false,
    f: false,
    g: false,
    t: false,
};

document.addEventListener('keydown', function (event) {
    if (pressedkeys[event.key] != undefined) {
        pressedkeys[event.key] = true;
    }
});

document.addEventListener('keyup', function (event) {
    if (pressedkeys[event.key] != undefined) {
        pressedkeys[event.key] = false;
    }
});


const cooldowns = {
    move: false,
    rotate: false,
    place: false,
    equip: false,
};

const intervals = {};
function cooldown(type, time) {
    cooldowns[type] = true;
    intervals[type] = window.setInterval(function () {
        cooldowns[type] = false;
        window.clearInterval(intervals[type]);
    }, time);
}


function onKEY() {
    let speedMultiplier = 1;

    for (let f of DATA_items?.[Data?.player?.equipped?.Boots]?.effects || []) {
        if (f?.type == "Speed") {
            speedMultiplier *= f?.multiplier;
        }
    }


    if (pressedkeys.t && cooldowns['equip'] == false) {
        equip();
        cooldown('equip', 350);
    }


    if (pressedkeys.f && cooldowns['place'] == false) {
        let x = 0;
        let y = 0;

        if (Data?.player?.facing == "N") { y += -1; }
        if (Data?.player?.facing == "E") { x += 1; }
        if (Data?.player?.facing == "S") { y += 1; }
        if (Data?.player?.facing == "W") { x += -1; }

        place(x, y);
        cooldown('place', 200);
    }

    if (pressedkeys.g && cooldowns['place'] == false) {
        let x = 0;
        let y = 0;

        if (Data?.player?.facing == "N") { y += -1; }
        if (Data?.player?.facing == "E") { x += 1; }
        if (Data?.player?.facing == "S") { y += 1; }
        if (Data?.player?.facing == "W") { x += -1; }

        mine(x, y);
        cooldown('place', 200);
    }


    if (pressedkeys.w && !pressedkeys.s && !pressedkeys.a && !pressedkeys.d && cooldowns['move'] == false) {
        let movef = move(0, -1);

        if (movef[1]) {
            let time = DATA_tiles?.[movef[0]]?.data_tags?.walkcooldown / speedMultiplier;

            cooldown('move', time);
        }
    }

    if (!pressedkeys.w && pressedkeys.s && !pressedkeys.a && !pressedkeys.d && cooldowns['move'] == false) {
        let movef = move(0, 1);

        if (movef[1]) {
            let time = DATA_tiles?.[movef[0]]?.data_tags?.walkcooldown / speedMultiplier;

            cooldown('move', time);
        }
    }

    if (!pressedkeys.w && !pressedkeys.s && pressedkeys.a && !pressedkeys.d && cooldowns['move'] == false) {
        let movef = move(-1, 0);

        if (movef[1]) {
            let time = DATA_tiles?.[movef[0]]?.data_tags?.walkcooldown / speedMultiplier;

            cooldown('move', time);
        }
    }

    if (!pressedkeys.w && !pressedkeys.s && !pressedkeys.a && pressedkeys.d && cooldowns['move'] == false) {
        let movef = move(1, 0);

        if (movef[1]) {
            let time = DATA_tiles?.[movef[0]]?.data_tags?.walkcooldown / speedMultiplier;

            cooldown('move', time);
        }
    }


    if (pressedkeys.w && !pressedkeys.s && pressedkeys.a && !pressedkeys.d && cooldowns['move'] == false) {
        let movef = move(-1, -1);

        if (movef[1]) {
            let time = DATA_tiles?.[movef[0]]?.data_tags?.walkcooldown * Math.sqrt(2) / speedMultiplier;

            cooldown('move', time);
        }
    }

    if (pressedkeys.w && !pressedkeys.s && !pressedkeys.a && pressedkeys.d && cooldowns['move'] == false) {
        let movef = move(1, -1);

        if (movef[1]) {
            let time = DATA_tiles?.[movef[0]]?.data_tags?.walkcooldown * Math.sqrt(2) / speedMultiplier;

            cooldown('move', time);
        }
    }

    if (!pressedkeys.w && pressedkeys.s && pressedkeys.a && !pressedkeys.d && cooldowns['move'] == false) {
        let movef = move(-1, 1);

        if (movef[1]) {
            let time = DATA_tiles?.[movef[0]]?.data_tags?.walkcooldown * Math.sqrt(2) / speedMultiplier;

            cooldown('move', time);
        }
    }

    if (!pressedkeys.w && pressedkeys.s && !pressedkeys.a && pressedkeys.d && cooldowns['move'] == false) {
        let movef = move(1, 1);

        if (movef[1]) {
            let time = DATA_tiles?.[movef[0]]?.data_tags?.walkcooldown * Math.sqrt(2) / speedMultiplier;

            cooldown('move', time);
        }
    }


    if (pressedkeys.q && cooldowns['rotate'] == false) {
        rotate(-1);
        cooldown('rotate', 150);
    }

    if (pressedkeys.e && cooldowns['rotate'] == false) {
        rotate(1);
        cooldown('rotate', 150);
    }
}


function addInventoryKeys() {
    return document.addEventListener('keydown', function (event) {
        if (!(DATA_tiles?.[Data?.player?.selected_item] || DATA_objects?.[Data?.player?.selected_item] || DATA_items?.[Data?.player?.selected_item])) {
            Data.player.selected_item = "Grass";
        }

        if (event.key == 1) {
            let previous = inv_buttons_list[inv_buttons_list.findIndex(function (v) { return v == Data?.player?.selected_item; }) - 1];
            if (previous != undefined) {
                Data.player.selected_item = previous;
            }
        }

        if (event.key == 2) {
            let next = inv_buttons_list[inv_buttons_list.findIndex(function (v) { return v == Data?.player?.selected_item; }) + 1];
            if (next != undefined) {
                Data.player.selected_item = next;
            }
        }
    });
}

//#endregion



//#region GAME LOOP

window.setTimeout(loading, 25);

function start() {
    var t = 0;

    setCanvasSize();
    drawGameCanvas();
    drawMapCanvas();

    setupInventoryButtons();
    setupCraftingButtons();

    addInventoryKeys();

    for (let e of Object.values(Data?.player?.equipped)) { addEquippedImage(e); }

    const GameLoop = window.setInterval(function () {

        t++;


        if (t % 5 === 0) { updateInventoryButtons(); }

        if (t % 5 === 0) { updateCraftingButtons(); }

        if (t % 5 === 0) { updateSelectedItemDisplay(); }

        if (t % 5 === 0) { updateCurrentWorldDisplay(); }

        if (t % 5 === 0) { updateCreateNewWorldDisplay(); }

        if (t % 5 === 0) { updateTimeDisplay(); }

        if (t % 5 === 0) { updateOriginalVersionDisplay(); }


        for (let v of Data?.world?.updatable_tiles) { updateTile(v, t); }


        onKEY();


        Data.world.meta.time += 1;

    }, 50);

    return GameLoop;
}

//#endregion



//#region WINDOW FUNCTIONS

window.openWindow = openWindow;
window.createWorld = createWorld;
window.deleteSave = deleteSave;
window.selectItem = selectItem;
window.download = download;
window.upload = upload;

//#endregion