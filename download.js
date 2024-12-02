function download(exportObj={save: saveData, world: world}, exportName="Explorer-Save") {
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj))
    var downloadAnchorNode = document.createElement('a')
    downloadAnchorNode.setAttribute("href",     dataStr)
    downloadAnchorNode.setAttribute("download", exportName + ".json")
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
}

const savefile_load = document.getElementById("savefile_load")
function upload() {
    var fr = new FileReader()
    fr.onload = function (e) {
        console.log(e)
        var result = JSON.parse(e.target.result)

        for (let i in result.save) {
            saveData[i] = result.save[i]
        }
        for (let i in result.world) {
            world[i] = result.world[i]
        }

        localStorage.setItem("Explorer-Save", JSON.stringify(saveData))
        localStorage.setItem("Explorer-World", JSON.stringify(world))
        location.reload()
    }
    fr.readAsText(savefile_load.files[0])
}