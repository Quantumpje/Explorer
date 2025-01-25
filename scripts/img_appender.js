import textures from "../data/textures.json" with { type: "json" };

for (let i in textures) {
    let img = document.createElement("img");
    img.src = `assets/${textures[i]}`;
    img.width = "0px";
    img.height = "0px";
    img.id = textures[i];
    document.getElementById("Images").appendChild(img);
}