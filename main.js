const saveData = {
    pos: { x: 0, y: 0 },
    turning: 1,
    selectedtile: 1,
    selectedrecipe: 0,
    inventory: {},
    usedworldseed: null,
    usedcenter: null
}
var move_cooldown = false
var place_cooldown = false


const tileData = {
    none: {
        name: "barrier",
        color: "#FFFFFF",
        placeable: false,
        holdable: false,
        breakable: false,
        replaceable: false,
        passable: false,
        under: false,
    },
    0: {
        name: "water",
        color: "#1CA3EC",
        placeable: false,
        holdable: false,
        breakable: false,
        replaceable: true,
        passable: false,
        under: false,
    },
    1: {
        name: "grass",
        color: "#41980A",
        placeable: true,
        holdable: true,
        breakable: true,
        replaceable: true,
        passable: true,
        under: false,
    },
    2: {
        name: "sand",
        color: "#EFDD6F",
        placeable: true,
        holdable: true,
        breakable: true,
        replaceable: true,
        passable: true,
        under: false,
    },
    3: {
        name: "wood block",
        color: "#614A27",
        placeable: true,
        holdable: true,
        breakable: true,
        replaceable: false,
        passable: false,
        under: false,
    },
    4: {
        name: "wood floor",
        color: "#705832",
        placeable: true,
        holdable: true,
        breakable: true,
        replaceable: true,
        passable: true,
        under: false,
    },
    5: {
        name: "stone",
        color: "#757575",
        placeable: true,
        holdable: true,
        breakable: true,
        replaceable: false,
        passable: false,
        under: false,
    },
    6: {
        name: "air",
        color: "#FFFFFF",
        placeable: false,
        holdable: false,
        breakable: false,
        replaceable: true,
        passable: true,
        under: false,
    },
    7: {
        name: "tree",
        color: "#334D25",
        placeable: true,
        holdable: true,
        breakable: true,
        replaceable: false,
        passable: false,
        under: 1,
    },
}

const placeabletiles = []
for (let i in tileData) {
    if (tileData[i].placeable) {
        placeabletiles.push(i)
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
}

const recipes = []
for (let i in recipeData) {
    recipes.push(i)
}


window.setInterval(function () {
    for (let i in tileData) {
        if (!saveData.inventory[i]) {
            saveData.inventory[i] = 0
        }
    }
}, 100)


const worldscreenhalfN = 8
const tilepixelsizeN = 32
const worldscreenhalfLM = 64
const tilepixelsizeLM = 4


const worldsizehalf = 192
const wholemappixelsize = 2


var savegame = JSON.parse(localStorage.getItem("Explorer-Save"))
for (let i in saveData) {
    if (savegame && savegame[i]) {
        saveData[i] = savegame[i]
    }
}

var saveworld = JSON.parse(localStorage.getItem("Explorer-World"))

let potentialnewseed = Math.floor(Math.random() * 65536 + 1)
const world = saveworld ? saveworld : generateWorld(potentialnewseed)
saveData.usedworldseed = saveworld ? saveData.usedworldseed : potentialnewseed


let potentialcenter = [Math.floor(Math.random() * 50 + 100), Math.floor(Math.random() * 50 + 100)]

while (world[potentialcenter[0]][potentialcenter[1]].t != 1) {
    potentialcenter = [Math.floor(Math.random() * 50 + 100), Math.floor(Math.random() * 50 + 100)]
}

const centerinworlddata = saveData.usedcenter ? saveData.usedcenter : potentialcenter
saveData.usedcenter = saveData.usedcenter ? saveData.usedcenter : potentialcenter


var saveGameLoop = window.setInterval(function () {
    localStorage.setItem("Explorer-Save", JSON.stringify(saveData))
}, 2500)
var saveWorldLoop = window.setInterval(function () {
    localStorage.setItem("Explorer-World", JSON.stringify(world))
}, 2500)


function move(x, y) {
    let tile = world[y + centerinworlddata[0] + saveData.pos.y]?.[x + centerinworlddata[1] + saveData.pos.x].t
    if (tile == undefined) { tile = "none" }

    if (tileData[tile].passable) {
        saveData.pos.x += x
        saveData.pos.y += y
    }

    return saveData.pos
}


function craft(recipe=recipeData[saveData.selectedrecipe]) {
    allowed = true
    for (let i in recipe.inputs) {
        if (saveData.inventory[recipe.inputs[i].type] < recipe.inputs[i].amount) {
            allowed = false
            break
        }
    }

    if (allowed) {
        for (let i in recipe.inputs) {
            saveData.inventory[recipe.inputs[i].type] -= recipe.inputs[i].amount
        }
        for (let i in recipe.outputs) {
            saveData.inventory[recipe.outputs[i].type] += recipe.outputs[i].amount
        }
    }

    return allowed
}


function rotate(r) {
    if (saveData.turning == 1 && r == 1) { saveData.turning = 4; return 4 }
    if (saveData.turning == 2 && r == 1) { saveData.turning = 1; return 1 }
    if (saveData.turning == 3 && r == 1) { saveData.turning = 2; return 2 }
    if (saveData.turning == 4 && r == 1) { saveData.turning = 3; return 3 }
    if (saveData.turning == 1 && r == -1) { saveData.turning = 2; return 2 }
    if (saveData.turning == 2 && r == -1) { saveData.turning = 3; return 3 }
    if (saveData.turning == 3 && r == -1) { saveData.turning = 4; return 4 }
    if (saveData.turning == 4 && r == -1) { saveData.turning = 1; return 1 }
}


function placeTile(xo, yo, type) {
    let x = xo + centerinworlddata[1] + saveData.pos.x
    let y = yo + centerinworlddata[0] + saveData.pos.y

    let tile = world[y]?.[x].t
    if (tile == undefined) { tile = "none" }

    if (tileData[tile].replaceable && tileData[type].placeable && saveData.inventory[type] > 0) {
        if (tileData[tile].holdable) { saveData.inventory[tile] += 1 }
        saveData.inventory[type] -= 1

        tile = world[y][x].t = type
        world[y][x].n = false
    }

    return tile
}

function breakTile(xo, yo) {
    let x = xo + centerinworlddata[1] + saveData.pos.x
    let y = yo + centerinworlddata[0] + saveData.pos.y

    let tile = world[y]?.[x].t
    if (tile == undefined) { tile = "none" }

    if (tileData[tile].breakable) {
        if (tileData[tile].holdable) { saveData.inventory[tile] += 1 }
        if (tileData[tile].under != false && world[y][x].n == 1) { tile = world[y][x].t = tileData[tile].under }
        else { tile = world[y][x].t = 6 }
        world[y][x].n = 0
    }

    return tile
}


function noiseToTile(x, y, seed) {
    noise.seed(seed)
    let rng = newRNG(`${seed} ${x} ${y}`)
    let n = noise.perlin2(x / 9 + Math.PI, y / 9 + Math.PI) * 0.5 + noise.perlin2(x / 30 + Math.PI, y / 30 + Math.PI) * 1.25 + noise.perlin2(x / 100 + Math.PI, y / 100 + Math.PI) * 1.5

    let R = [rng()]

    let tiletype = 0
    if (n > 0.15 && R[0] < 0.1) { tiletype = 7 }
    else if (n > -0.1) { tiletype = 1 }
    else if (n > -0.175) { tiletype = 2 }

    return { t: tiletype, n: 1 }
}

function generateWorld(seed) {
    let data = []

    for (let y = -worldsizehalf; y <= worldsizehalf; y++) {
        data[y + worldsizehalf] = []
        for (let x = -worldsizehalf; x <= worldsizehalf; x++) {
            let tile = noiseToTile(x, y, seed)
            data[y + worldsizehalf][x + worldsizehalf] = tile
        }
    }

    return data
}


const canvasN = document.getElementById("canvasnormal")
const canvasLM = document.getElementById("canvaslargemap")
const canvasW = document.getElementById("canvaswhole")
const ctxN = canvasN.getContext("2d")
const ctxLM = canvasLM.getContext("2d")
const ctxW = canvasW.getContext("2d")

function drawcanvasN() {
    for (let x = -worldscreenhalfN; x <= worldscreenhalfN; x++) {
        for (let y = -worldscreenhalfN; y <= worldscreenhalfN; y++) {
            let tile = world[y + centerinworlddata[0] + saveData.pos.y]?.[x + centerinworlddata[1] + saveData.pos.x]?.t
            if (tile == undefined) { tile = "none" }

            ctxN.fillStyle = tileData[tile].color
            ctxN.fillRect((x + worldscreenhalfN) * tilepixelsizeN, (y + worldscreenhalfN) * tilepixelsizeN, tilepixelsizeN, tilepixelsizeN)
        }
    }

    ctxN.fillStyle = "black"
    ctxN.fillRect(worldscreenhalfN * tilepixelsizeN + tilepixelsizeN / 4, worldscreenhalfN * tilepixelsizeN + tilepixelsizeN / 4, tilepixelsizeN / 2, tilepixelsizeN / 2)
    if (saveData.turning == 1) { ctxN.fillRect(worldscreenhalfN * tilepixelsizeN + tilepixelsizeN / 4 + 4, worldscreenhalfN * tilepixelsizeN + tilepixelsizeN / 4 - 8, tilepixelsizeN / 4, tilepixelsizeN / 4) }
    if (saveData.turning == 2) { ctxN.fillRect(worldscreenhalfN * tilepixelsizeN + tilepixelsizeN / 4 - 8, worldscreenhalfN * tilepixelsizeN + tilepixelsizeN / 4 + 4, tilepixelsizeN / 4, tilepixelsizeN / 4) }
    if (saveData.turning == 3) { ctxN.fillRect(worldscreenhalfN * tilepixelsizeN + tilepixelsizeN / 4 + 4, worldscreenhalfN * tilepixelsizeN + tilepixelsizeN / 4 + 16, tilepixelsizeN / 4, tilepixelsizeN / 4) }
    if (saveData.turning == 4) { ctxN.fillRect(worldscreenhalfN * tilepixelsizeN + tilepixelsizeN / 4 + 16, worldscreenhalfN * tilepixelsizeN + tilepixelsizeN / 4 + 4, tilepixelsizeN / 4, tilepixelsizeN / 4) }
}

function drawcanvasLM() {
    for (let x = -worldscreenhalfLM; x <= worldscreenhalfLM; x++) {
        for (let y = -worldscreenhalfLM; y <= worldscreenhalfLM; y++) {
            let tile = world[y + centerinworlddata[0] + saveData.pos.y]?.[x + centerinworlddata[1] + saveData.pos.x]?.t
            if (tile == undefined) { tile = "none" }

            ctxLM.fillStyle = tileData[tile].color
            ctxLM.fillRect((x + worldscreenhalfLM) * tilepixelsizeLM, (y + worldscreenhalfLM) * tilepixelsizeLM, tilepixelsizeLM, tilepixelsizeLM)
        }
    }

    ctxLM.fillStyle = "black"
    ctxLM.fillRect(worldscreenhalfLM * tilepixelsizeLM - tilepixelsizeLM / 4, worldscreenhalfLM * tilepixelsizeLM - tilepixelsizeLM / 4, tilepixelsizeLM * 2, tilepixelsizeLM * 2)
}

function drawcanvasW() {
    for (let x = -worldsizehalf; x <= worldsizehalf; x++) {
        for (let y = -worldsizehalf; y <= worldsizehalf; y++) {
            let tile = world[y + worldsizehalf]?.[x + worldsizehalf]?.t
            if (tile == undefined) { tile = "none" }

            ctxW.fillStyle = tileData[tile].color
            ctxW.fillRect((x + worldsizehalf) * wholemappixelsize, (y + worldsizehalf) * wholemappixelsize, wholemappixelsize, wholemappixelsize)
        }
    }

    ctxW.fillStyle = "black"
    ctxW.fillRect((saveData.usedcenter[1] + saveData.pos.x) * wholemappixelsize - wholemappixelsize, (saveData.usedcenter[0] + saveData.pos.y) * wholemappixelsize - wholemappixelsize, wholemappixelsize * 4, wholemappixelsize * 4)
}


const pos_display = document.getElementById("pos_display")
const selectedtile_display = document.getElementById("selectedtile_display")
const selectedrecipe_display = document.getElementById("selectedrecipe_display")
const inventory_display = document.getElementById("inventory_display")
function updateDisplay() {
    drawcanvasN()
    drawcanvasLM()
    pos_display.innerHTML = `You are at: (${saveData.pos.x}, ${saveData.pos.y}).`
    selectedtile_display.innerHTML = `Selected tile type to place: ${tileData[saveData.selectedtile].name}. You have ${saveData.inventory[saveData.selectedtile]}.`
    selectedrecipe_display.innerHTML = `Selected recipe: ${recipeData[saveData.selectedrecipe].name}.`
}; window.setInterval(updateDisplay, 200)
function updateDisplaySLOW() {
    drawcanvasW()
}; window.setInterval(updateDisplaySLOW, 2500)
updateDisplaySLOW()


document.addEventListener('keydown', function (event) {
    if (move_cooldown == false) {
        if (event.key == 'w') {
            move(0, -1)
            move_cooldown = true
            window.setTimeout(function () { move_cooldown = false }, 200)
        }

        else if (event.key == 's') {
            move(0, 1)
            move_cooldown = true
            window.setTimeout(function () { move_cooldown = false }, 200)
        }

        else if (event.key == 'a') {
            move(-1, 0)
            move_cooldown = true
            window.setTimeout(function () { move_cooldown = false }, 200)
        }

        else if (event.key == 'd') {
            move(1, 0)
            move_cooldown = true
            window.setTimeout(function () { move_cooldown = false }, 200)
        }

        else if (event.key == 'q') {
            rotate(-1)
            move_cooldown = true
            window.setTimeout(function () { move_cooldown = false }, 150)
        }

        else if (event.key == 'e') {
            rotate(1)
            move_cooldown = true
            window.setTimeout(function () { move_cooldown = false }, 150)
        }

        else if (event.key == '1') {
            let previous = placeabletiles[placeabletiles.findIndex(function (v) { return v == saveData.selectedtile }) - 1]
            if (previous != undefined) {
                saveData.selectedtile = previous
            }
        }

        else if (event.key == '2') {
            let next = placeabletiles[placeabletiles.findIndex(function (v) { return v == saveData.selectedtile }) + 1]
            if (next != undefined) {
                saveData.selectedtile = next
            }
        }

        else if (event.key == '3') {
            let previous = recipes[recipes.findIndex(function (v) { return v == saveData.selectedrecipe }) - 1]
            if (previous != undefined) {
                saveData.selectedrecipe = previous
            }
        }

        else if (event.key == '4') {
            let next = recipes[recipes.findIndex(function (v) { return v == saveData.selectedrecipe }) + 1]
            if (next != undefined) {
                saveData.selectedrecipe = next
            }
        }

        else if (event.key == 'f') {
            let x = 0
            let y = 0

            if (saveData.turning == 1) { y += -1 }
            if (saveData.turning == 2) { x += -1 }
            if (saveData.turning == 3) { y += 1 }
            if (saveData.turning == 4) { x += 1 }

            placeTile(x, y, saveData.selectedtile)
            place_cooldown = true
            window.setTimeout(function () { place_cooldown = false }, 200)
        }

        else if (event.key == 'g') {
            let x = 0
            let y = 0

            if (saveData.turning == 1) { y += -1 }
            if (saveData.turning == 2) { x += -1 }
            if (saveData.turning == 3) { y += 1 }
            if (saveData.turning == 4) { x += 1 }

            breakTile(x, y)
            place_cooldown = true
            window.setTimeout(function () { place_cooldown = false }, 200)
        }
    }
})


function deleteSave() {
    localStorage.removeItem("Explorer-Save")
    localStorage.removeItem("Explorer-World")
    location.reload()
}