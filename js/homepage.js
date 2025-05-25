const fill = (element_selector, size, letters="", apparentSize=undefined)=>{
    if (!apparentSize){
        apparentSize = size
    }
    $(element_selector).append("<tbody></tbody>")
    for (let i = 0; i < size; i++) {
        $(element_selector + " tbody").append("<tr></tr>")
        for (let j = 0; j < size; j++) {
            $(element_selector + " tr:last-of-type").append(`<td class='square${letters[i * size + j] === "\0" ? " hide" : ""}' style="--size: ${apparentSize}">${(letters[i * size + j] ?? "").replace("\0", "")}</td>`)
        }
    }
}

const loadPuzzles = ()=>{
    let puzzles = JSON.parse(localStorage.puzzles ?? "[]")
    if (!puzzles.length){
        return $("#recent").append("No Puzzles Yet!")
    }

    let count = 0
    for (let puzzle of puzzles){
        $("#recent__wrapper").append(`<a class="myPuzzle" href="puzzle.html?puzzle=${count}">
            <div class="puzzle" id="myPuzzle${count}">
                <squaredle-puzzle size="${puzzle.size}" puzzle="${puzzle.puzzle.replaceAll("\0", "\x09")}" style="width: 100%;" read_only>Loading...</squaredle-puzzle>
            </div>
            <div class="myPuzzle__name">${puzzle.name.replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</div>
        </a>`)
        //fill("#myPuzzle"+count, Number(puzzle.size), puzzle.puzzle, Number(puzzle.size) + 1)
        count++
    }
}

$("#addSquare").click(()=>{
    location.href = "puzzle.html?puzzle=" + Utils.newPuzzle("Untitled Squaredle", 4, " ".repeat(16))
})

$("#addWaffle").click(()=>{
    location.href = "puzzle.html?puzzle=" + Utils.newPuzzle("Untitled Waffle", 5, "      \0 \0       \0 \0      ")
})

$("#add10x10").click(()=>{
    location.href = "puzzle.html?puzzle=" + Utils.newPuzzle("Untitled 10x10", 10, " ".repeat(100))
})

$("#aboutSite").click(()=>{
    $("#info").show()
})

$("#backup").click(() => {
    let json = {
        puzzles: JSON.parse(localStorage.puzzles ?? {}),
        manualSort: JSON.parse(localStorage.manualSort ?? {})
    }

    let format = JSON.stringify(json)

    console.log(format)

    $("#backup_textarea").val(format)

    $("#backup_download").attr("download", `Squaredle_Maker_Backup_
    ${new Intl.DateTimeFormat('en-US', {
    "hour": "numeric",
    "minute": "numeric",
    "day": "numeric",
    "year": "numeric",
    "month": "long"
  }).format(new Date()).replaceAll(" ", "_").replaceAll(",","").replaceAll(":", "")}.json
    `).attr("href", "data:text/json;charset=utf-8," + encodeURIComponent(format))
    $("#backupModal").show()
})

loadPuzzles()

window.onload = async () => {
    let information = await fetch("info.html")
    information = await information.text()
    $("#info .modal-content").html(information)

    $(".BigModal .close").click((e)=>{
        $(e.currentTarget).parent().parent().parent().hide()
    })

    for (let c of document.querySelectorAll("squaredle-puzzle")){
        c.request_resize()
    }

    if (top != self){
        $("#notice").show()
    }
}