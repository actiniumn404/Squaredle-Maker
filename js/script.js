class Game{
    constructor() {
        this.puzzle = undefined
        this.url = new URLSearchParams(window.location.search)
        this.misc = {
            puzzles: JSON.parse(localStorage.puzzles)
        }

        // Load Puzzle
        if (this.url.get("puzzle")) {
            if (0 <= Number(this.url.get("puzzle")) && Number(this.url.get("puzzle")) < this.misc.puzzles.length && !isNaN(Number(this.url.get("puzzle")))) {
                localStorage.current = Number(this.url.get("puzzle"))
                let puzzle_raw = this.misc.puzzles[Number(this.url.get("puzzle"))]
                $("#name_input").val(puzzle_raw.name)
                $("#settings__size").val(Number(puzzle_raw.size))
                this.puzzle = document.getElementById("puzzle")
                this.puzzle.size = puzzle_raw.size
                this.puzzle.puzzle = puzzle_raw.puzzle.replaceAll("\0", "\x09")
                this.puzzle.name = puzzle_raw.name

                Utils.const.original_data = this.puzzle.json
            }else{
                location.href = "index.html"
                return;
            }
        }else{
            location.href = "index.html"
            return;
        }

        // Load Solver
        solver_init()
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

    load(element, prefix=""){
        this.display = jQuery(element)
        this.display.empty()

        let i = 0;
        for (let row of this.puzzle){
            this.display.append("<tr></tr>")
            let j = 0;
            for (let square of row){
                let name = `square${i}-${j}`;
                $(this.display.children()[i]).append(`<td id="${prefix}${name}" class='square${square.disabled ? " hide": ""}'>
                    <div class='squareCircle'></div>
                    <input maxlength='1' ${square.disabled ? "disabled": `value="${square.letter !== " " ? square.letter : ""}"`}>
                </td>`)
                let a = i;
                let b = j;
                $("#" + name).on("input", ()=>{
                    this.puzzle[a][b].letter = $("#" + name + " input").val() || " "
                }).keydown((e)=>{
                    let coords = name.match(/square(\d+)-(\d+)/)
                    let size = game.puzzle.size
                    if (e.key === "ArrowRight"){
                        $(`#square${coords[1]}-${Math.min(Number(coords[2]) + 1, size)} input`).focus()
                    }else if (e.key === "ArrowLeft"){
                        $(`#square${coords[1]}-${Math.max(Number(coords[2]) - 1, 0)} input`).focus()
                    }else if (e.key === "ArrowUp"){
                        $(`#square${Math.max(Number(coords[1]) - 1, 0)}-${coords[2]} input`).focus()
                    }else if (e.key === "ArrowDown"){
                        $(`#square${Math.min(Number(coords[1]) + 1, size)}-${coords[2]} input`).focus()
                    }
                }).contextmenu((e)=>{
                    Utils.const.active = [Number(a), Number(b)]
                    e.preventDefault()
                    $("#squareContextMenu").css({
                        left: e.pageX,
                        top: e.pageY
                    }).show()

                    $("#squareCtxHide").html(`${game.puzzle.puzzle[Number(a)][Number(b)].disabled ? "Show" : "Hide"} Square`)
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

    json(){
        return {
            name: this.name,
            puzzle: this.repr(),
            size: this.size
        }
    }

    compare(a){
        return JSON.stringify(this.json()) === JSON.stringify(a.json())
    }

    resize(size){
        if (typeof(size) !== "number"){
            size = Number(size)
        }
        if (isNaN(size)){
            return;
        }
        if (size < 3 || size > 10){
            return;
        }

        if (size < this.size){
            if (!confirm("Are you sure you want to reduce the puzzle size? This will remove some of your squares.")){
                return
            }
            for (let i = 0; i < this.size; i++){
                this.puzzle[i].length = size;
            }
            this.puzzle.length = size;

        }else{
            for (let i = 0; i < this.size; i++){
                for (let j = 0; j < size - this.size; j++){
                    this.puzzle[i].push(new Square(" "))
                }
            }
            for (let i = this.size; i < size; i++){
                this.puzzle.push([])
                for (let j = 0; j < size; j++){
                    this.puzzle[i].push(new Square(" "))
                }
            }
        }
        this.size = size
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

class ManualWordSort{
    constructor(data) {
        data = this.load()
        this.required = new Set(data.words)
        this.bonus = new Set(data.bonus)

        Utils.const.original_sort = this.json()
        this.display()
    }

    isRequired(word){
        return this.required.has(word)
    }

    isBonus(word){
        return this.bonus.has(word)
    }

    addRequired(word){
        this.required.add(word)
        this.display()
    }

    removeRequired(word){
        this.required.delete(word)
        this.display()
    }

    addBonus(word){
        this.bonus.add(word)
        this.display()
    }

    removeBonus(word){
        this.bonus.delete(word)
        this.display()
    }

    load(){
        return JSON.parse(localStorage.manualSort ?? `{"words": [], "bonus": []}`)
    }

    json(){
        return JSON.stringify({"words": Array.from(this.required), "bonus": Array.from(this.bonus)})
    }

    save(){
        localStorage.manualSort = this.json()
    }

    display(){
        $("#reqWords, #bonusWords").html("")
        for (let word of this.required){
            $("#reqWords").append(`<div class="manualSortedWord" data-word="${word}" data-type="required"><span class="word">${word}</span> <span class="cancel">&times;</span></div>`)
        }

        for (let word of this.bonus){
            $("#bonusWords").append(`<div class="manualSortedWord" data-word="${word}" data-type="bonus"><span class="word">${word}</span> <span class="cancel">&times;</span></div>`)
        }

        $("#reqWords").append(`<div class="manualSortedWord special"><i class="fas fa-pencil"></i> Add</div>`)
        $("#bonusWords").append(`<div class="manualSortedWord special"><i class="fas fa-pencil"></i> Add</div>`)

        $("#reqWords .special").click(()=>{
            let word = prompt("What word would you like to add?")
            if (!word){
                return;
            }
            this.removeBonus(word)
            this.addRequired(word)
        })

        $("#bonusWords .special").click(()=>{
            let word = prompt("What word would you like to add?")
            if (!word){
                return;
            }
            this.removeRequired(word)
            this.addBonus(word)
        })

        $(".manualSortedWord .cancel").click((e)=>{
            e = $(e.currentTarget)
            let word = e.parent().data("word")
            let type = e.parent().data("type")

            if (type === "required"){
                this.removeRequired(word)
            }else{
                this.removeBonus(word)
            }

            this.display()
        })

        $(".manualSortedWord:not(.special)").click((e)=>{
            Utils.show_word($(e.currentTarget).data("word"))
        })
    }
}

$(document).on("click", (e)=>{
    if (!$.contains(document.getElementById("squareContextMenu"), e.target) && e.target.id !== "squareContextMenu"){
        $("#squareContextMenu").hide()
    }
})


$("#process").click(async () => {
    let btn = $("#process")
    let start = Date.now()
    btn.prop("disabled", true)

    Utils.const.results = new Solver(game.puzzle, Number($("#settings__freq_cutoff").val()))
    Utils.const.results.solve()
    Utils.const.results.display($("#results"))

    btn.prop("disabled", false)

    $("#results__analysis").show()


    //if (resu["error"]) {
    //    return $("#results").html(`<strong style="color: var(--theme)">ERROR: ${res["error"]}</strong>`)
    //}
})


$("#exportDscd").click(() => {
    // Get Emojis
    let res = ""
    for (let row of game.puzzle.puzzle_array){
        for (let col of row){
            if (col === "\0" || col === " "){
                res += ":squaredleBlank: "
            }else if (col.letter === "!"){
                res += ":squaredleBang: "
            }else{
                res += `:squaredle${col.toUpperCase()}: `
            }
        }
        res += "\n"
    }
    $("#shareEmojis").val(res)
    $("#download").show()

    $("#download__copyEmoji").click(() => {
        navigator.clipboard.writeText(res)
        alert("Copied to clipboard")
    })

})

$("#printResults").click(async () => {
    let frame = window.open()
    let css = await fetch("css/results.css")
    css = await css.text()
    /*(let js = await fetch("./js/components.js")
    js = await js.text()
    frame.document.head.innerHTML += `<script defer>${js}\nalert("running!!!")</script>`
    frame.document.head.innerHTML += `<style>${css}</style>`
    frame.document.body.innerHTML += `<h1>${game.puzzle.name}</h1>`
    frame.document.body.classList.add("print")
    frame.document.body.innerHTML += game.puzzle.outerHTML*/
    frame.document.body.innerHTML += `<style>${css}</style>`
    frame.document.body.innerHTML += `<h1>${game.puzzle.name}</h1>`
    frame.document.body.classList.add("print")
    frame.document.body.innerHTML += `<table id="puzzle"></table>`
    new Puzzle(this.puzzle.name, this.puzzle.size, this.puzzle.get_puzzle).load(frame.document.getElementById("puzzle"))
    if (!Utils.const.results){
        return
    }
    frame.document.body.innerHTML += `${Utils.const.results.analysis.words} Total Words<br>${Utils.const.results.analysis.awkward_list.length} Awkward Words ${Utils.const.results.analysis.awkward_list.length ? "(In <span class='awkward'>Wavy Underline</span>)": ""}`

    // convoluted mess of code

    $("body").append(`<div id='results_2'>${$("#results").html()}</div>`)
    $("#results_2 i.fa-solid").remove()
    $("#results_2 ul").show()

    frame.document.body.innerHTML += `${$("#results_2").prop("outerHTML")}`
    frame.document.getElementById("results_2").id = "results"
    $("#results_2").remove()
})


$("#word__close").click(() => {
    $("#wordDef").hide()
})

$("#name_input").keyup((e) => {
    game.puzzle.name = $("#name_input").val()
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
    puzzles[Number(localStorage.current)] = game.puzzle.json
    Utils.const.manualSort.save()
    localStorage.puzzles = JSON.stringify(puzzles)
    Utils.const.original_data = game.puzzle.json
    Utils.const.original_sort = Utils.const.manualSort.json()
}


$('#savePuzzle').click(() => {
    save()
    alert("Saved!")
})

window.onbeforeunload = () => {
    /*if (JSON.stringify(Utils.const.original_data) !== JSON.stringify(game.puzzle.json)) {
        return () => {}
    }
    if (Utils.const.manualSort.json() !== Utils.const.original_sort) {
        return () => {}
    }*/
}

document.onkeydown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        save()
        alert("Puzzle Saved")
    }else if (e.key === "Enter"){
        $("#process").click()
    }
}

$("#freq_cutoff").on("change keyup input click", () => {
    if (JSON.stringify(data) !== "{}" && $("#freq_cutoff").val()) {
        get_results(data, $("#freq_cutoff").val(), Date.now())
    }
})

$("#deletePuzzle").click(() => {
    $("#deletePopup .deletename").html(game.puzzle.name)
    $("#deleteDelete").prop("disabled", true)
    $("#deleteInput").attr("placeholder", game.puzzle.name)
    $("#deletePopup").show()
})

$("#deletePopup .close").click(() => {
    $("#deletePopup").hide()
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

$("#info_popup .close").click(() => {
    $("#info_popup").hide()
})

$("#aboutSite").click(()=>{
    $("#info_popup").show()
})

$("#deleteInput").keyup(() => {
    $("#deleteDelete").prop("disabled", !(game.puzzle.name === $("#deleteInput").val()))
})

$("#deleteDelete").click(() => {
    let puzzles = JSON.parse(localStorage.puzzles)
    puzzles.splice(localStorage.current, 1)
    localStorage.puzzles = JSON.stringify(puzzles)

    location.href = "index.html"
})

function timeout(ms) { // Awesome function
    return new Promise(resolve => setTimeout(resolve, ms));
}

$("#wordPath").click(async () => {
    $("#wordDef").hide()
    let path = Utils.const.active.path;
    let i = 0;
    let items = [...game.puzzle.container.children].map(e=>$(e.container).find(".squareCircle"))

    items.forEach(e=>e.css("background", `none`).hide())

    for ([col, row] of path){
        let item = items[col * game.puzzle.size + row]
        item
            .css("background", `hsl(${280 / path.length * i}, 100%, 50%)`)
            .css("width", `calc(${item.parent().width()}px * (1 - ${0.5 / path.length * i}))`)
            .css("height", `calc(${item.parent().height()}px * (1 - ${0.5 / path.length * i}))`)
            .show()
        i++;
        await timeout(400);
    }
    $("#hidePath").show()
})

$("#changeSettings").click(()=>{$("#settingsModal").show()})

$("#squareCtxHide").click(()=>{
    $("#squareContextMenu").hide()
    let active_element = game.puzzle.container.children[Utils.const.active[1] * game.puzzle.size + Utils.const.active[0]]
    active_element.setAttribute("disabled", !active_element.disabled ? "true" : "false")
    active_element.handle_change()
})

$("#settings__size").on("input", ()=>{
    if (!$("#settings__size").val() || Number($("#settings__size").val()) < 3 || Number($("#settings__size").val()) > 10){
        return
    }

    if (Number($("#settings__size").val()) < game.puzzle.size){
        if (!confirm("Are you sure you want to downsize your puzzle? You will permanently lose some squares this way")){
            return;
        }
    }

    game.puzzle.puzzle_resize(Number($("#settings__size").val()))
})

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

$("#rotateLeft").click(async ()=>{
    $("#rotateLeft, #rotateRight").prop("disabled", true)

    await game.puzzle.rotateLeft(1000)

    $("#rotateLeft, #rotateRight").prop("disabled", false)
})

$("#rotateRight").click(async ()=>{
    $("#rotateLeft, #rotateRight").prop("disabled", true)

    await game.puzzle.rotateRight(1000)

    $("#rotateLeft, #rotateRight").prop("disabled", false)
})

$("#hidePath").click(()=>{
    [...game.puzzle.container.children].map(e=>$(e.container).find(".squareCircle")).forEach(e=>e.css("background", `none`).hide())
    $("#hidePath").hide()
})

$("#aboutSite").click(()=>{
    $("#info").show()
})

$("#wordSort").click(()=>{
    $("#wordSortModal").show()
})

$("#addRequired").click(()=>{
    let word = Utils.const.active.word
    Utils.const.manualSort.addRequired(word)
    Utils.const.manualSort.removeBonus(word)
})

$("#addBonus").click(()=>{
    let word = Utils.const.active.word
    Utils.const.manualSort.addBonus(word)
    Utils.const.manualSort.removeRequired(word)
})

$("#submitPuzzle").click(()=>{
    open("https://squaredle.app/puzzle-idea")
    $("#exportDscd").click()
})

$("#toggleFullscreen").click(()=>{
    $(document.body).toggleClass("fullscreen")
    $("#toggleFullscreen i").toggleClass("fa-maximize").toggleClass("fa-minimize")
    let i = setInterval(()=>{window.dispatchEvent(new Event("resize"))}, 1)
    setTimeout(()=>{clearInterval(i)}, 600)
})


if (window.innerWidth <= 850){
    if (!$(document.body).hasClass("fullscreen")){
        $("#toggleFullscreen").click()
    }
}else{
    if ($(document.body).hasClass("fullscreen")){
        $("#toggleFullscreen").click()
    }
}

window.dispatchEvent(new Event("resize"))

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

let game;

window.onload = async () => {
    game = new Game()
    Utils.const.manualSort = new ManualWordSort()

    let information = await fetch("info.html")
    information = await information.text()
    $("#info .modal-content").html(information)

    $(".BigModal .close").click((e)=>{
        $(e.currentTarget).parent().parent().parent().hide()
    })
}

let resize_loop = setInterval(()=>{
    for (let c of document.querySelectorAll("squaredle-puzzle")){
        c.request_resize()
    }
}, 100)