const fill = (element_selector, size, letters="", apparentSize=undefined)=>{
    if (!apparentSize){
        apparentSize = size
    }
    $(element_selector).append("<tbody></tbody>")
    for (let i = 0; i < size; i++) {
        $(element_selector + " tbody").append("<tr></tr>")
        for (let j = 0; j < size; j++) {
            $(element_selector + " tr:last-of-type").append(`<td class='square' style="--size: ${apparentSize}">${letters[i * size + j] ?? ""}</td>`)
        }
    }
}

const loadPuzzles = ()=>{
    let puzzles = JSON.parse(localStorage.puzzles ?? "[]")
    if (!puzzles.length){
        return $("#recent").append("No Puzzles Yet!")
    }

    count = 0
    for (puzzle of puzzles){
        $("#recent__wrapper").append(`<a class="myPuzzle" href="puzzle.html?puzzle=${count}">
            <table class="puzzle" id="myPuzzle${count}"></table>
            <div class="myPuzzle__name">${puzzle.name}</div>
        </a>`)
        fill("#myPuzzle"+count, Number(puzzle.size), puzzle.puzzle, Number(puzzle.size) + 1)
        count++
    }
}

window.onload = ()=>{
    fill("#10x10", 10, "", letters=7)
    loadPuzzles()
}