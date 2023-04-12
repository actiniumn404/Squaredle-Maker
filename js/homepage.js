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
            <table class="puzzle" id="myPuzzle${count}"></table>
            <div class="myPuzzle__name">${puzzle.name}</div>
        </a>`)
        fill("#myPuzzle"+count, Number(puzzle.size), puzzle.puzzle, Number(puzzle.size) + 1)
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

$(".BigModal .close").click((e)=>{
    $(e.currentTarget).parent().parent().parent().hide()
})

$("#aboutSite").click(()=>{
    $("#info").show()
})

window.onload = ()=>{
    fill("#10x10", 10, "", letters=7)
    loadPuzzles()
}