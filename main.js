const saveData = {
    pos: { x: 0, y: 0 },
    turning: 1,
    selectedtile: 1,
    selectedrecipe: 0,
    inventory: {},
    usedworldseed: null,
    usedcenter: null,

    version: 0,
};


const tileData = {
    none: {
        name: "barrier",
        placeable: false,
        holdable: false,
        breakable: false,
        replaceable: false,
        passable: false,
        under: false,
        fluid: false,
    },
    0: {
        name: "water",
        placeable: false,
        holdable: false,
        breakable: false,
        replaceable: true,
        passable: true,
        under: false,
        fluid: true,
    },
    1: {
        name: "grass",
        placeable: true,
        holdable: true,
        breakable: true,
        replaceable: true,
        passable: true,
        under: false,
        fluid: false,
    },
    2: {
        name: "sand",
        placeable: true,
        holdable: true,
        breakable: true,
        replaceable: true,
        passable: true,
        under: false,
        fluid: false,
    },
    3: {
        name: "wood block",
        placeable: true,
        holdable: true,
        breakable: true,
        replaceable: false,
        passable: false,
        under: false,
        fluid: false,
    },
    4: {
        name: "wood floor",
        placeable: true,
        holdable: true,
        breakable: true,
        replaceable: true,
        passable: true,
        under: false,
        fluid: false,
    },
    5: {
        name: "stone",
        placeable: true,
        holdable: true,
        breakable: true,
        replaceable: false,
        passable: false,
        under: false,
        fluid: false,
    },
    6: {
        name: "groundstone",
        placeable: false,
        holdable: false,
        breakable: false,
        replaceable: true,
        passable: true,
        under: false,
        fluid: false,
    },
    7: {
        name: "tree",
        placeable: true,
        holdable: true,
        breakable: true,
        replaceable: false,
        passable: false,
        under: 1,
        fluid: false,
    },
    8: {
        name: "path",
        placeable: true,
        holdable: true,
        breakable: true,
        replaceable: true,
        passable: true,
        under: false,
        fluid: false,
    },
};

const placeabletiles = [];
for (let i in tileData) {
    if (tileData[i].placeable) {
        placeabletiles.push(i);
    }
}


const recipeData = {
    0: {
        id: 0,
        name: "1x tree --> 2x wood block",
        inputs: [
            {
                amount: 1,
                type: 7,
            },
        ],
        outputs: [
            {
                amount: 2,
                type: 3,
            },
        ],
    },
    1: {
        id: 1,
        name: "1x wood block --> 2x wood floor",
        inputs: [
            {
                amount: 1,
                type: 3,
            },
        ],
        outputs: [
            {
                amount: 2,
                type: 4,
            },
        ],
    },
    2: {
        id: 2,
        name: "3x sand + 5x grass --> 1x stone",
        inputs: [
            {
                amount: 3,
                type: 2,
            },
            {
                amount: 5,
                type: 1,
            },
        ],
        outputs: [
            {
                amount: 1,
                type: 5,
            },
        ],
    },
    3: {
        id: 3,
        name: "5x grass + 1x sand --> 5x path",
        inputs: [
            {
                amount: 5,
                type: 1,
            },
            {
                amount: 1,
                type: 2,
            },
        ],
        outputs: [
            {
                amount: 5,
                type: 8,
            },
        ],
    },
};

const recipes = [];
for (let i in recipeData) {
    recipes.push(i);
}


window.setInterval(function () {
    for (let i in tileData) {
        if (!saveData.inventory[i]) {
            saveData.inventory[i] = 0;
        }
    }
}, 100);


function convertoldworld(save, world) {
    if (save.version == undefined) {
        return compressWorld2D(world);
    }
    else if (save.version == 0) {
        return world;
    }
}


// Code with help of ChatGPT
function compressWorld2D(world) {
    return world.map(row => {
        let compressedRow = [];
        let current = null;
        let count = 0;

        row.forEach(block => {
            const blockStr = `${block.t},${block.n}`;
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
function decompressWorld2D(compressedWorld) {
    return compressedWorld.map(compressedRow => {
        return compressedRow.split("|").flatMap(chunk => {
            const [data, count] = chunk.split("x");
            const [t, n] = data.split(",").map(Number);
            return Array(Number(count)).fill().map(() => ({ t, n }));
        });
    });
}


function download(exportObj = { save: saveData, world: compressWorld2D(world) }, exportName = "Explorer-Save") {
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

const savefile_load = document.getElementById("savefile_load");
function upload() {
    var fr = new FileReader();
    fr.onload = function (e) {
        console.log(e);
        var result = JSON.parse(e.target.result);

        for (let i in result.save) {
            saveData[i] = result.save[i];
        }

        let decompressedWorld = decompressWorld2D(convertoldworld(result.save, result.world));
        for (let i in result.world) {
            world[i] = decompressedWorld[i];
        }

        localStorage.setItem("Explorer-Save", JSON.stringify(saveData));
        localStorage.setItem("Explorer-World", JSON.stringify(compressWorld2D(world)));
        location.reload();
    };
    fr.readAsText(savefile_load.files[0]);
}


const worldscreenhalfN = 8;
const tilepixelsizeN = 32;
const worldscreenhalfLM = 64;
const tilepixelsizeLM = 4;


const worldsizehalf = 192;
const wholemappixelsize = 2;


var savegame = JSON.parse(localStorage.getItem("Explorer-Save"));
for (let i in saveData) {
    if (savegame && savegame[i]) {
        saveData[i] = savegame[i];
    }
}

let loadworld = localStorage.getItem("Explorer-World");
if (savegame && loadworld) { loadworld = convertoldworld(savegame, JSON.parse(loadworld)); }
if (savegame && loadworld) { var saveworld = decompressWorld2D(loadworld); }


var potentialcenter = [Math.floor(Math.random() * 50 + 100), Math.floor(Math.random() * 50 + 100)];

let potentialnewseed = Math.floor(Math.random() * 65536 + 1);
const world = saveworld ? saveworld : generateWorld(potentialnewseed);
saveData.usedworldseed = saveworld ? saveData.usedworldseed : potentialnewseed;


const centerinworlddata = saveData.usedcenter ? saveData.usedcenter : potentialcenter;
saveData.usedcenter = saveData.usedcenter ? saveData.usedcenter : potentialcenter;


var saveGameLoop = window.setInterval(function () {
    localStorage.setItem("Explorer-Save", JSON.stringify(saveData));
}, 2500);
var saveWorldLoop = window.setInterval(function () {
    localStorage.setItem("Explorer-World", JSON.stringify(compressWorld2D(world)));
}, 2500);


function move(x, y) {
    let tile = world[y + centerinworlddata[0] + saveData.pos.y]?.[x + centerinworlddata[1] + saveData.pos.x].t;
    if (tile == undefined) { tile = "none"; }

    if (tileData[tile].passable) {
        saveData.pos.x += x;
        saveData.pos.y += y;
    }

    return tile;
}


function craft(recipe = recipeData[saveData.selectedrecipe]) {
    allowed = true;
    for (let i in recipe.inputs) {
        if (saveData.inventory[recipe.inputs[i].type] < recipe.inputs[i].amount) {
            allowed = false;
            break;
        }
    }

    if (allowed) {
        for (let i in recipe.inputs) {
            saveData.inventory[recipe.inputs[i].type] -= recipe.inputs[i].amount;
        }
        for (let i in recipe.outputs) {
            saveData.inventory[recipe.outputs[i].type] += recipe.outputs[i].amount;
        }
    }

    return allowed;
}


function rotate(r) {
    if (saveData.turning == 1 && r == 1) { saveData.turning = 4; return 4; }
    if (saveData.turning == 2 && r == 1) { saveData.turning = 1; return 1; }
    if (saveData.turning == 3 && r == 1) { saveData.turning = 2; return 2; }
    if (saveData.turning == 4 && r == 1) { saveData.turning = 3; return 3; }
    if (saveData.turning == 1 && r == -1) { saveData.turning = 2; return 2; }
    if (saveData.turning == 2 && r == -1) { saveData.turning = 3; return 3; }
    if (saveData.turning == 3 && r == -1) { saveData.turning = 4; return 4; }
    if (saveData.turning == 4 && r == -1) { saveData.turning = 1; return 1; }
}


function placeTile(xo, yo, type) {
    let x = xo + centerinworlddata[1] + saveData.pos.x;
    let y = yo + centerinworlddata[0] + saveData.pos.y;

    let tile = world[y]?.[x].t;
    if (tile == undefined) { tile = "none"; }

    if (tileData[tile].replaceable && tileData[type].placeable && saveData.inventory[type] > 0) {
        if (tileData[tile].holdable) { saveData.inventory[tile] += 1; }
        saveData.inventory[type] -= 1;

        tile = world[y][x].t = type;
        world[y][x].n = false;
    }

    return tile;
}

function breakTile(xo, yo) {
    let x = xo + centerinworlddata[1] + saveData.pos.x;
    let y = yo + centerinworlddata[0] + saveData.pos.y;

    let tile = world[y]?.[x].t;
    if (tile == undefined) { tile = "none"; }

    if (tileData[tile].breakable) {
        if (tileData[tile].holdable) { saveData.inventory[tile] += 1; }
        if (tileData[tile].under != false && world[y][x].n == 1) { tile = world[y][x].t = tileData[tile].under; }
        else { tile = world[y][x].t = 6; checkfluidflow(x, y); }
        world[y][x].n = 0;
    }

    return tile;
}


// Code with help of ChatGPT
function checkfluidflow(x, y) {
    if (world[y]?.[x]?.t !== 6) return;

    let connectedairs = new Set();
    let newconnectedairs = new Set();
    connectedairs.add(`${x},${y}`);

    let newconnections = true;

    while (newconnections) {
        newconnections = false;

        for (let coord of connectedairs) {
            let [cx, cy] = coord.split(',').map(Number);

            // Check all four neighbors
            [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([dx, dy]) => {
                let nx = cx + dx, ny = cy + dy;

                // Boundary check: ensure `ny` and `nx` are valid indices
                if (world[ny]?.[nx]?.t === 6) {
                    let neighborKey = `${nx},${ny}`;
                    if (!connectedairs.has(neighborKey)) {
                        newconnections = true;
                        newconnectedairs.add(neighborKey);
                    }
                }
            });
        }

        newconnectedairs.forEach(tile => connectedairs.add(tile));
        newconnectedairs.clear();
    }

    // Check for connected fluid
    let connectedfluid = false;
    let connectedfluidtype;

    for (let coord of connectedairs) {
        let [cx, cy] = coord.split(',').map(Number);

        // Check all four neighbors for fluid
        [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([dx, dy]) => {
            let nx = cx + dx, ny = cy + dy;

            // Boundary check: ensure `ny` and `nx` are valid indices
            if (tileData[world[ny]?.[nx]?.t]?.fluid) {
                connectedfluid = true;
                connectedfluidtype = world[ny][nx].t;
            }
        });

        if (connectedfluid) break;
    }

    // Update all connected tiles
    if (connectedfluid) {
        connectedairs.forEach(coord => {
            let [cx, cy] = coord.split(',').map(Number);
            world[cy][cx].t = connectedfluidtype;
        });
    }
}


function noiseToTile(x, y, seed) {
    noise.seed(seed);
    let rng = newRNG(`${seed} ${x} ${y}`);
    let n = noise.perlin2(x / 9 + Math.PI, y / 9 + Math.PI) * 0.5 + noise.perlin2(x / 30 + Math.PI, y / 30 + Math.PI) * 1.25 + noise.perlin2(x / 100 + Math.PI, y / 100 + Math.PI) * 1.5;

    let R = [rng()];

    let tiletype = 0;
    if (n > 0.15 && R[0] < 0.1) { tiletype = 7; }
    else if (n > -0.1) { tiletype = 1; }
    else if (n > -0.175) { tiletype = 2; }

    return { t: tiletype, n: 1 };
}

function noiseToTile_CheckMaxSize_CheckerPattern(x, y) {
    let tiletype = 0;
    if ((y % 2 === 0 && x % 2 !== 0) || (y % 2 !== 0 && x % 2 === 0)) {
        tiletype = 1;
    }

    return { t: tiletype, n: 1 };
}

function generateWorld(seed) {
    let data = [];

    for (let y = -worldsizehalf; y <= worldsizehalf; y++) {
        data[y + worldsizehalf] = [];
        for (let x = -worldsizehalf; x <= worldsizehalf; x++) {
            let tile = noiseToTile(x, y, seed);
            data[y + worldsizehalf][x + worldsizehalf] = tile;
        }
    }

    while (data[potentialcenter[0]][potentialcenter[1]].t != 1) {
        potentialcenter = [Math.floor(Math.random() * 50 + 100), Math.floor(Math.random() * 50 + 100)];
    }

    return data;
}


const canvasN = document.getElementById("canvasnormal");
const canvasLM = document.getElementById("canvaslargemap");
const canvasW = document.getElementById("canvaswhole");
const ctxN = canvasN.getContext("2d");
const ctxLM = canvasLM.getContext("2d");
const ctxW = canvasW.getContext("2d");

function drawcanvasN() {
    for (let x = -worldscreenhalfN; x <= worldscreenhalfN; x++) {
        for (let y = -worldscreenhalfN; y <= worldscreenhalfN; y++) {
            let tile = world[y + centerinworlddata[0] + saveData.pos.y]?.[x + centerinworlddata[1] + saveData.pos.x]?.t;
            if (tile == undefined) { tile = "none"; }

            ctxN.drawImage(document.getElementById(`texture_${tile}`), (x + worldscreenhalfN) * tilepixelsizeN, (y + worldscreenhalfN) * tilepixelsizeN, tilepixelsizeN, tilepixelsizeN);
        }
    }

    if (saveData.turning == 1) { ctxN.drawImage(document.getElementById('texture_player1'), worldscreenhalfN * tilepixelsizeN + tilepixelsizeN / 4, worldscreenhalfN * tilepixelsizeN + tilepixelsizeN / 4, tilepixelsizeN / 2, tilepixelsizeN / 2); }
    if (saveData.turning == 2) { ctxN.drawImage(document.getElementById('texture_player2'), worldscreenhalfN * tilepixelsizeN + tilepixelsizeN / 4, worldscreenhalfN * tilepixelsizeN + tilepixelsizeN / 4, tilepixelsizeN / 2, tilepixelsizeN / 2); }
    if (saveData.turning == 3) { ctxN.drawImage(document.getElementById('texture_player3'), worldscreenhalfN * tilepixelsizeN + tilepixelsizeN / 4, worldscreenhalfN * tilepixelsizeN + tilepixelsizeN / 4, tilepixelsizeN / 2, tilepixelsizeN / 2); }
    if (saveData.turning == 4) { ctxN.drawImage(document.getElementById('texture_player4'), worldscreenhalfN * tilepixelsizeN + tilepixelsizeN / 4, worldscreenhalfN * tilepixelsizeN + tilepixelsizeN / 4, tilepixelsizeN / 2, tilepixelsizeN / 2); }
}

function drawcanvasLM() {
    for (let x = -worldscreenhalfLM; x <= worldscreenhalfLM; x++) {
        for (let y = -worldscreenhalfLM; y <= worldscreenhalfLM; y++) {
            let tile = world[y + centerinworlddata[0] + saveData.pos.y]?.[x + centerinworlddata[1] + saveData.pos.x]?.t;
            if (tile == undefined) { tile = "none"; }

            ctxLM.drawImage(document.getElementById(`texture_${tile}`), (x + worldscreenhalfLM) * tilepixelsizeLM, (y + worldscreenhalfLM) * tilepixelsizeLM, tilepixelsizeLM, tilepixelsizeLM);
        }
    }

    ctxLM.drawImage(document.getElementById('texture_player1'), worldscreenhalfLM * tilepixelsizeLM - tilepixelsizeLM / 2, worldscreenhalfLM * tilepixelsizeLM - tilepixelsizeLM / 2, tilepixelsizeLM * 2, tilepixelsizeLM * 2);
}

function drawcanvasW() {
    for (let x = -worldsizehalf; x <= worldsizehalf; x++) {
        for (let y = -worldsizehalf; y <= worldsizehalf; y++) {
            let tile = world[y + worldsizehalf]?.[x + worldsizehalf]?.t;
            if (tile == undefined) { tile = "none"; }

            ctxW.drawImage(document.getElementById(`texture_${tile}`), (x + worldsizehalf) * wholemappixelsize, (y + worldsizehalf) * wholemappixelsize, wholemappixelsize, wholemappixelsize);
        }
    }

    ctxW.drawImage(document.getElementById('texture_player1'), (saveData.usedcenter[1] + saveData.pos.x) * wholemappixelsize - wholemappixelsize - 1, (saveData.usedcenter[0] + saveData.pos.y) * wholemappixelsize - wholemappixelsize - 1, wholemappixelsize * 4, wholemappixelsize * 4);
}


const pos_display = document.getElementById("pos_display");
const selectedtile_display = document.getElementById("selectedtile_display");
const selectedrecipe_display = document.getElementById("selectedrecipe_display");
const inventory_display = document.getElementById("inventory_display");

function updateDisplayNORMAL() {
    drawcanvasN();
    pos_display.innerHTML = `You are at: (${saveData.pos.x}, ${saveData.pos.y}).`;
    selectedtile_display.innerHTML = `Selected tile type to place: ${tileData[saveData.selectedtile].name}. You have ${saveData.inventory[saveData.selectedtile]}.`;
    selectedrecipe_display.innerHTML = `Selected recipe: ${recipeData[saveData.selectedrecipe].name}.`;
}
window.setInterval(updateDisplayNORMAL, 100);

function updateDisplayMEDIUM() {
    drawcanvasLM();
}
window.setTimeout(updateDisplayMEDIUM, 50);
window.setInterval(updateDisplayMEDIUM, 1000);

function updateDisplaySLOW() {
    drawcanvasW();
}
window.setTimeout(updateDisplaySLOW, 50);
window.setInterval(updateDisplaySLOW, 10000);


const pressedkeys = {
    w: false,
    s: false,
    a: false,
    d: false,
    q: false,
    e: false,
    f: false,
    g: false,
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
};

const intervals = {};
function cooldown(type, time) {
    cooldowns[type] = true;
    intervals[type] = window.setInterval(function () {
        cooldowns[type] = false;
        window.clearInterval(intervals[type]);
    }, time);
}

window.setInterval(function () {
    if (pressedkeys.w && !pressedkeys.s && !pressedkeys.a && !pressedkeys.d && cooldowns['move'] == false) {
        let tile = move(0, -1);
        let time = 400;
        if (tileData[tile].fluid == true) {
            time = 1250;
        }
        if (tile == 8) {
            time = 250;
        }
        cooldown('move', time);
    }

    if (!pressedkeys.w && pressedkeys.s && !pressedkeys.a && !pressedkeys.d && cooldowns['move'] == false) {
        let tile = move(0, 1);
        let time = 400;
        if (tileData[tile].fluid == true) {
            time = 1250;
        }
        if (tile == 8) {
            time = 250;
        }
        cooldown('move', time);
    }

    if (!pressedkeys.w && !pressedkeys.s && pressedkeys.a && !pressedkeys.d && cooldowns['move'] == false) {
        let tile = move(-1, 0);
        let time = 400;
        if (tileData[tile].fluid == true) {
            time = 1250;
        }
        if (tile == 8) {
            time = 250;
        }
        cooldown('move', time);
    }

    if (!pressedkeys.w && !pressedkeys.s && !pressedkeys.a && pressedkeys.d && cooldowns['move'] == false) {
        let tile = move(1, 0);
        let time = 400;
        if (tileData[tile].fluid == true) {
            time = 1250;
        }
        if (tile == 8) {
            time = 250;
        }
        cooldown('move', time);
    }


    if (pressedkeys.w && !pressedkeys.s && pressedkeys.a && !pressedkeys.d && cooldowns['move'] == false) {
        let tile = move(-1, -1);
        let time = 600;
        if (tileData[tile].fluid == true) {
            time = 2000;
        }
        if (tile == 8) {
            time = 350;
        }
        cooldown('move', time);
    }

    if (pressedkeys.w && !pressedkeys.s && !pressedkeys.a && pressedkeys.d && cooldowns['move'] == false) {
        let tile = move(1, -1);
        let time = 600;
        if (tileData[tile].fluid == true) {
            time = 2000;
        }
        if (tile == 8) {
            time = 350;
        }
        cooldown('move', time);
    }

    if (!pressedkeys.w && pressedkeys.s && pressedkeys.a && !pressedkeys.d && cooldowns['move'] == false) {
        let tile = move(-1, 1);
        let time = 600;
        if (tileData[tile].fluid == true) {
            time = 2000;
        }
        if (tile == 8) {
            time = 350;
        }
        cooldown('move', time);
    }

    if (!pressedkeys.w && pressedkeys.s && !pressedkeys.a && pressedkeys.d && cooldowns['move'] == false) {
        let tile = move(1, 1);
        let time = 600;
        if (tileData[tile].fluid == true) {
            time = 2000;
        }
        if (tile == 8) {
            time = 350;
        }
        cooldown('move', time);
    }


    if (pressedkeys.q && cooldowns['rotate'] == false) {
        rotate(-1);
        cooldown('rotate', 150);
    }

    if (pressedkeys.e && cooldowns['rotate'] == false) {
        rotate(1);
        cooldown('rotate', 150);
    }


    if (pressedkeys.f && cooldowns['place'] == false) {
        let x = 0;
        let y = 0;

        if (saveData.turning == 1) { y += -1; }
        if (saveData.turning == 2) { x += -1; }
        if (saveData.turning == 3) { y += 1; }
        if (saveData.turning == 4) { x += 1; }

        placeTile(x, y, saveData.selectedtile);
        cooldown('place', 200);
    }

    if (pressedkeys.g && cooldowns['place'] == false) {
        let x = 0;
        let y = 0;

        if (saveData.turning == 1) { y += -1; }
        if (saveData.turning == 2) { x += -1; }
        if (saveData.turning == 3) { y += 1; }
        if (saveData.turning == 4) { x += 1; }

        breakTile(x, y);
        cooldown('place', 200);
    }
}, 50);

document.addEventListener('keydown', function (event) {
    if (event.key == 1) {
        let previous = placeabletiles[placeabletiles.findIndex(function (v) { return v == saveData.selectedtile; }) - 1];
        if (previous != undefined) {
            saveData.selectedtile = previous;
        }
    }

    if (event.key == 2) {
        let next = placeabletiles[placeabletiles.findIndex(function (v) { return v == saveData.selectedtile; }) + 1];
        if (next != undefined) {
            saveData.selectedtile = next;
        }
    }


    if (event.key == 3) {
        let previous = recipes[recipes.findIndex(function (v) { return v == saveData.selectedrecipe; }) - 1];
        if (previous != undefined) {
            saveData.selectedrecipe = previous;
        }
    }

    if (event.key == 4) {
        let next = recipes[recipes.findIndex(function (v) { return v == saveData.selectedrecipe; }) + 1];
        if (next != undefined) {
            saveData.selectedrecipe = next;
        }
    }
});


function deleteSave() {
    localStorage.removeItem("Explorer-Save");
    localStorage.removeItem("Explorer-World");
    location.reload();
}
