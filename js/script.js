class Game{
    constructor() {
        this.puzzle = undefined
        this.url = new URLSearchParams(window.location.search)
        this.misc = {
            puzzles: JSON.parse(localStorage.puzzles)
        }

        // Load Puzzle
        if (this.url.get("puzzle")) {
            if (0 <= Number(this.url.get("puzzle")) && Number(this.url.get("puzzle")) < this.misc.puzzles.length) {
                localStorage.current = Number(this.url.get("puzzle"))
                let puzzle_raw = this.misc.puzzles[Number(this.url.get("puzzle"))]
                this.puzzle = new Puzzle(puzzle_raw.name, puzzle_raw.size, puzzle_raw.puzzle)
            }
        }else{
            location.pathname = location.pathname.replace("puzzle", "home")
            return;
        }

        this.puzzle.load($("#puzzle"))

        // Load Solver
        solver_init()
    }

    resize(size){
        if (typeof(size) !== "number"){
            size = Number(size)
        }

        if (size < this.puzzle.size){
            if (!confirm("Are you sure you want to reduce the puzzle size?")){
                return
            }
        }
    }
}

class Puzzle{
    constructor (name, size, puzzle) {
        if (puzzle.size > size * size){
            throw TypeError("Puzzle is too big for size " + size)
        }
        if (typeof(size) !== "number"){
            size = Number(size)
        }
        this.name = name
        this.size = size
        this.puzzle = []
        this.display = undefined

        let augmented_puzzle = puzzle + " ".repeat(size * size - puzzle.length)
        for (let i = 0; i < size; i++){
            this.puzzle.push([])
            for (let j = 0; j < size; j++) {
                let letter = augmented_puzzle[i * size + j]
                if (letter === "\0"){ // Disabled
                    this.puzzle[i].push(new Square("", true))
                }else{
                    this.puzzle[i].push(new Square(letter))
                }
            }
        }
    }

    load(element){
        this.display = jQuery(element)
        this.display.empty()

        let i = 0;
        for (let row of this.puzzle){
            this.display.append("<tr></tr>")
            let j = 0;
            for (let square of row){
                let name = `square${i}-${j}`;
                $(this.display.children()[i]).append(`<td id="${name}" class='square${square.disabled ? " hide": ""}'>
                    <div class='squareCircle'></div>
                    <input maxlength='1' value="${square.letter}"">
                </td>`)
                let a = i;
                let b = j;
                $("#" + name).on("input", ()=>{
                    this.puzzle[a][b].letter = $("#" + name + " input").val() || " "
                })
                j++;
            }
            i++;
        }

        this.display.find(".square").css("--size", this.size)
    }

    repr(){
        let res = ""
        for (let row of this.puzzle){
            for (let col of row){
                res += col.repr()
            }
        }
        return res
    }
}

class Square{
    constructor (letter, disabled=false) {
        this.disabled = Boolean(disabled)
        this.letter = letter
        if (letter.length > 1){
            throw TypeError("Square must only contain at most 1 character.")
        }
    }

    repr(){
        if (this.disabled){
            return "\0"
        }
        return this.letter
    }
}

$("#puzzle_size").on("change keyup input", () => {
    let size = Number($("#puzzle_size").val())
    if (size && 3 <= size && size <= 10) {
        p_size = size
        generate_puzzle(p_size)
    }
    pdata.size = $("#puzzle_size").val()
})

$("#process").click(async () => {
    let btn = $("#process")
    let start = Date.now()
    btn.prop("disabled", true)

    let results = new Solver(game.puzzle, Number($("#settings__freq_cutoff").val()))
    results.solve()
    results.display($("#results"))

    btn.prop("disabled", false)

    $("#results__analysis").show()


    //if (resu["error"]) {
    //    return $("#results").html(`<strong style="color: var(--theme)">ERROR: ${res["error"]}</strong>`)
    //}
})


$("#exportDscd").click(() => {
    // Get Emojis
    let index = 0;
    let size = p_size;
    let res = ""
    for (let letter of get_puzzle()) {
        res += `:squaredle${letter.toUpperCase()}: `
        if (index % size === size - 1) {
            res += "\n"
        }
        index += 1
    }
    $("#shareEmojis").val(res)
    $("#download").show()

    $("#download__copyEmoji").click(() => {
        navigator.clipboard.writeText(res)
        alert("Copied to clipboard")
    })

})

$("#printResults").click(() => {
    let frame = window.open()
    frame.document.head.innerHTML += `<link rel="stylesheet" href="${location.origin + "/results.css"}">`
    frame.document.body.innerHTML = `
<h1 id="puzzle_name">${$("#name_input").val()}</h1>
<span id="numwords">${num_words} result${num_words !== 1 ? "s" : ""}</span>
${$("#results").prop("outerHTML")}
`
})


$("#word__close").click(() => {
    $("#wordDef").hide()
})

$("#name_input").keyup((e) => {
    pdata.name = $("#name_input").val()
    if (e.code === "Enter"){
        document.activeElement.blur()
        save()
    }
})

$("#results__analysis").click(()=>{
    $("#solvingModal").show()
})


$("#curPuzzle").html("")

const save = () => {
    let puzzles = JSON.parse(localStorage.puzzles)
    puzzles[Number(localStorage.current)] = pdata
    localStorage.puzzles = JSON.stringify(puzzles)
    original_data = {...pdata}
    $(`#curPuzzle option:nth-of-type(${Number(localStorage.current) + 1})`).html(pdata.name)
}


$('#savePuzzle').click(() => save())

window.onbeforeunload = () => {
    if (JSON.stringify(original_data) !== JSON.stringify(pdata)) {
        return () => {
        }
    }
}

$("#newPuzzle").click(() => {
    let existing_names = JSON.parse(localStorage.puzzles).map(e => e.name)
    let name;
    if (!existing_names.includes("Untitled Squaredle")) {
        name = "Untitled Squaredle";
    } else {
        name = "Untitled Squaredle (1)"
        let i = 1;
        while (existing_names.includes(name)) {
            name = `Untitled Squaredle (${i})`
            i += 1;
        }
    }
    let puzzles = JSON.parse(localStorage.puzzles)
    puzzles.push({
        name: name,
        puzzle: "                ",
        size: 4,
        revBonus: {},
        revReq: {},
    })
    localStorage.puzzles = JSON.stringify(puzzles)

    urlParams.set("puzzle", puzzles.length - 1)
    location.search = "?" + urlParams.toString()
})

document.onkeydown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        save()
    }
}

$("#freq_cutoff").on("change keyup input click", () => {
    if (JSON.stringify(data) !== "{}" && $("#freq_cutoff").val()) {
        get_results(data, $("#freq_cutoff").val(), Date.now())
    }
})

$("#deletePuzzle").click(() => {
    $("#deletePopup .deletename").html(pdata.name)
    $("#deleteDelete").prop("disabled", true)
    $("#deleteInput").attr("placeholder", pdata.name)
    $("#deletePopup").show()
})

$("#deletePopup .close").click(() => {
    $("#deletePopup").hide()
})

$(".BigModal .close").click((e)=>{
    $(e.currentTarget).parent().parent().parent().hide()
})

$(".analysis_invoke").click((e)=>{
    let element = $(e.currentTarget)
    if (element.data("open") === "no"){
        element.data("open", "yes").find("i").removeClass("fa-caret-right").addClass("fa-caret-down")
        $(element.data("invoke")).show()
    }else{
        $(element.data("invoke")).hide()
        element.data("open", "no").find("i").removeClass("fa-caret-down").addClass("fa-caret-right")
    }
})

$("#deleteInput").keyup(() => {
    $("#deleteDelete").prop("disabled", !(pdata.name === $("#deleteInput").val()))
})

$("#deleteDelete").click(() => {
    let puzzles = JSON.parse(localStorage.puzzles)
    puzzles.splice(localStorage.current, 1)
    localStorage.puzzles = JSON.stringify(puzzles)
    urlParams.delete("puzzle")
    localStorage.current = 0

    location.search = "?" + urlParams.toString()
})

$("#wordDef > #manualCateg").click(() => {
    if (!pdata.revReq[popupWord.length]) {
        pdata.revReq[popupWord.length] = []
    }
    if (!pdata.revBonus[popupWord.length]) {
        pdata.revBonus[popupWord.length] = []
    }
    if ($("#wordDef > #manualCateg").html() === "Add to Bonus") {
        let index = pdata.revBonus[popupWord.length].indexOf(popupData)
        if (index !== -1) {
            pdata.revBonus.splice(index, 1)
        } else {
            pdata.revReq[popupWord.length].push(popupData)
        }
    } else {
        let index = pdata.revReq[popupWord.length].indexOf(popupData)
        if (index !== -1) {
            pdata.revReq.splice(index, 1)
        } else {
            pdata.revBonus[popupWord.length].push(popupData)
        }
    }
    $("#wordDef").hide()
    get_results(data, $("#freq_cutoff").val(), Date.now())
})

function timeout(ms) { // Awesome function
    return new Promise(resolve => setTimeout(resolve, ms));
}

$("#wordPath").click(async () => {
    $("#wordDef").hide()
    let path = popupData[2];
    let i = 0;
    $(`.squareCircle`).css("background", `none`).hide()
    for ([col, row] of path){
        $(`#theSquare${col}-${row} .squareCircle`)
            .css("background", `hsl(${280 / path.length * i}, 100%, 50%)`)
            .css("width", `calc(var(--s) * (1 - ${0.5 / path.length * i}))`)
            .css("height", `calc(var(--s) * (1 - ${0.5 / path.length * i}))`)
            .show()
        i++;
        await timeout(400);
    }
})

$("#squareFreq").click((e) => {
    $(".smallbtn:not(#squareFreq)").removeClass("selected")
    if ($("#squareFreq").hasClass("selected")){
        $("#squareFreq").removeClass("selected")
        $("#sfreqPopup").hide()
    }else{
        $("#squareFreq").addClass("selected")
        $("#sfreqPopup").show().css({
            left: e.pageX,
            top: e.pageY
        })
    }
})

$("#changeSettings").click(()=>{$("#settingsModal").show()})

$(document).mousemove(function(e) {
    if ($("#squareFreq").hasClass("selected")){
        $("#sfreqPopup").css({
            left: e.pageX,
            top: e.pageY
        }).show()
    }
})

const alert = (text) => {
    let el = document.createElement("DIV")
    el.classList.add("alert")
    el.innerHTML = text

    document.body.appendChild(el)

    el.onclick = () => {el.remove()}

    setTimeout(() => {
        el.remove()
    }, 5000)
}

let game = new Game()