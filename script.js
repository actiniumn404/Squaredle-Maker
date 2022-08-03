const urlParams = new URLSearchParams(window.location.search)
let data = {}
let num_words = 0
let p_size = 3

const generate_puzzle = (size) => {
    $("#puzzle_size").val(size)
    let puzzle = $("#puzzle")
    puzzle.html("")
    for (let i = 0; i < size; i++){
        puzzle.append("<tr></tr>")
        for (let i = 0; i < size; i++){
            $("#puzzle tr:last-of-type").append("<td class='square'><input maxlength='1'></td>")
        }
    }
    $(".square").css("--size", size)

    $(".square input").keyup(() => {
        data.puzzle = get_puzzle()
    })
}

const get_puzzle = () => {
    let res = ""
    document.querySelectorAll("#puzzle td input").forEach((e) => {
        res += e.value ? e.value : " "
    })

    return res
}

const data_setify = (data) => {
    let res = []
    let res_set = new Set();
    data.forEach((e) => {
        if (!res_set.has(e[0])){
            res_set.add(e[0])
            res.push(e)
        }
    })
    return res
}

const load_puzzle = (puzzle) => {
    generate_puzzle(Math.sqrt(puzzle.length))
    let squares = $(".square");
    for (let i = 0; i < squares.length; i++){
        squares[i].children[0].value = puzzle[i]
    }
}

const get_results = (words, cutoff, start = Date.now()) => {
    $("#results").html("")
    num_words = 0
    let num_awkward = 0;
    words["Bonus"] = []

    for (size in words){
        let width = 70
        let mywords = 0
        let word_list = data_setify(words[size])
        word_list.sort()


        $("#results").append(`<h4>${size} letters</h4><ul></ul>`)
        for ([word, freq] of word_list){
            if (freq < cutoff && size !== "Bonus"){
                words["Bonus"].push([word, freq])
                continue
            }
            if (awkward_words.has(word)){
                num_awkward += 1;
            }
            mywords += 1
            num_words += 1
            $("#results ul:last-of-type").append(`<li style="width: fit-content;width: -moz-fit-content;${awkward_words.has(word) ? "color: mediumpurple": ""}">${word}</li>`)
            width = Math.max(width, $("#results ul:last-of-type li:last-of-type").width())
        }
        if (mywords){
            $("#results ul:last-of-type li").css("width", "initial")
            $("#results ul:last-of-type").css("grid-template-columns", `repeat(auto-fill, minmax(${Math.ceil(width) + 10}px, 1fr))`)
            $("#results h4:last-of-type").append(` (${mywords} words)`)
        }else{
            $("#results :is(h4, ul):last-of-type").remove()
        }
    }
    $("#results ul li").click(async (e) => {
        let word = e.currentTarget.innerHTML
        $("#wordDef").show()
        $(".word__form").remove()
        let wordData = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
        wordData = await wordData.json()
        $("#word__def").html(word)

        if (wordData.title === "No Definitions Found"){
            return $("#wordDef").append(`<div class="word__form">Sorry, no definitions were found</div>`)
        }
        console.log(wordData)
        for (let meaning of wordData[0].meanings) {
            $("#wordDef").append(`<div class="word__form">
                <p class="word__desc">
                    <strong>${word}</strong>
                    <i class="fas fa-volume-up hear-word" data-source="${wordData[0].phonetics[wordData[0].phonetics.length - 1].audio}"></i>
                    <i>${meaning.partOfSpeech}</i>
                    <ol></ol>
                </p>`)
            for (let def of meaning.definitions){
                $("#wordDef ol:last-of-type").append(`<li>${def.definition}</li>`)
            }

        }
        $(".hear-word").click((e) => {
            let source = $(e.currentTarget).data('source')
            if (source){
                new Audio(source).play();
            }
        })
    })

    $("#time_numwords").html(`${num_words} result${num_words !== 1 ? "s": ""} in ${((Date.now() - start) / 1000).toFixed(2)} seconds<br>
    ${num_awkward} awkward word${num_awkward !== 1 ? "s": ""}`)
}

$("#puzzle_size").on("change keyup input", () => {
    let size = Number($("#puzzle_size").val())
    if (size && 3 <= size && size <= 10) {
        p_size = size
        generate_puzzle(p_size)
    }
    data.size = $("#puzzle_size").val()
})

$("#process").click(async () => {
    let btn = $("#process")
    let start = Date.now()
    btn.prop("disabled", true)

    let res = await fetch(`/api/solve?size=${p_size}&grid=${get_puzzle()}`)
    res = await res.json()
    data = res

    btn.prop("disabled", false)

    if (res["error"]){
        return $("#results").html(`<strong style="color: var(--theme)">ERROR: ${res["error"]}</strong>`)
    }

    get_results(res, $("#freq_cutoff").val(), start)
})

$("#exportDscd").click(() => {
    let index = 0;
    let size = p_size;
    let res = ""
    for (let letter of get_puzzle()){
        res += `:squaredle${letter.toUpperCase()}: `
        if (index % size === size - 1){
            res += "\n"
        }
        index += 1
    }

    navigation.clipboard.writeText(res)
    alert("Copied data to clipboard!")
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

generate_puzzle(4)

if (!urlParams.get("quickReload")){
    window.onbeforeunload = function() {
        return function () {
            return true
        };
    }
}if (urlParams.get("dev")){
    generate_puzzle(3)
    load_puzzle("anyantsss")
    get_results({"4":[["anan",2.15,[[0,0],[0,1],[1,0],[1,1]]],["anan",2.15,[[1,0],[0,1],[0,0],[1,1]]],["anas",2.7,[[0,0],[0,1],[1,0],[2,1]]],["anna",4.37,[[0,0],[0,1],[1,1],[1,0]]],["anna",4.37,[[1,0],[0,1],[1,1],[0,0]]],["ansa",2.16,[[0,0],[1,1],[2,0],[1,0]]],["ants",3.72,[[0,0],[0,1],[1,2],[2,1]]],["ants",3.72,[[1,0],[0,1],[1,2],[2,1]]],["assn",3.03,[[1,0],[2,1],[2,0],[1,1]]],["asst",2.78,[[1,0],[2,1],[2,2],[1,2]]],["nana",3.54,[[0,1],[1,0],[1,1],[0,0]]],["nana",3.54,[[1,1],[1,0],[0,1],[0,0]]],["nant",2.13,[[0,1],[1,0],[1,1],[1,2]]],["nant",2.13,[[1,1],[1,0],[0,1],[1,2]]],["nast",2.75,[[0,1],[1,0],[2,1],[1,2]]],["nast",2.75,[[1,1],[1,0],[2,1],[1,2]]],["saan",1.87,[[2,0],[1,0],[0,0],[0,1]]],["saan",1.87,[[2,1],[1,0],[0,0],[0,1]]],["sans",3.58,[[2,0],[1,0],[1,1],[2,2]]],["sans",3.58,[[2,1],[1,0],[1,1],[2,0]]],["sant",2.93,[[2,0],[1,0],[0,1],[1,2]]],["sant",2.93,[[2,1],[1,0],[0,1],[1,2]]],["sass",2.98,[[2,0],[1,0],[2,1],[2,2]]]],"5":[["annas",2.19,[[0,0],[0,1],[1,1],[1,0],[2,1]]],["nanas",1.84,[[0,1],[0,0],[1,1],[1,0],[2,1]]],["nanas",1.84,[[1,1],[0,0],[0,1],[1,0],[2,1]]],["nants",1.14,[[0,1],[1,0],[1,1],[1,2],[2,1]]],["nants",1.14,[[1,1],[1,0],[0,1],[1,2],[2,1]]],["nasty",4.22,[[0,1],[1,0],[2,1],[1,2],[0,2]]],["nasty",4.22,[[1,1],[1,0],[2,1],[1,2],[0,2]]],["santy",1.59,[[2,0],[1,0],[0,1],[1,2],[0,2]]],["santy",1.59,[[2,1],[1,0],[0,1],[1,2],[0,2]]],["snast",0.0,[[2,0],[1,1],[1,0],[2,1],[1,2]]],["snast",0.0,[[2,2],[1,1],[1,0],[2,1],[1,2]]]],"6":[["snasty",0.0,[[2,0],[1,1],[1,0],[2,1],[1,2],[0,2]]],["snasty",0.0,[[2,2],[1,1],[1,0],[2,1],[1,2],[0,2]]]]}, $("#freq_cutoff").val(), Date.now())
}

$("#word__close").click(() => {
    $("#wordDef").hide()
})

$("#name_input").keyup(() => {
    data.name = $("#name_input").val()
})


if (!localStorage.puzzles){
    localStorage.puzzles = "[]"
}if (JSON.parse(localStorage.puzzles).length === 0){
    let puzzles = JSON.parse(localStorage.puzzles)
    puzzles.push({
        name: "Untitled Squaredle",
        puzzle: "                ",
        size: 4,
        revBonus: [],
        revReq: [],
    })
    localStorage.puzzles = JSON.stringify(puzzles)
}if (!localStorage.current){
    localStorage.current = 0
}

$("#curPuzzle").html("")
for ([index, puzzle] of JSON.parse(localStorage.puzzles).entries()){
    let selected = index === Number(localStorage.current)
    if (selected){
        data = puzzle

        $("#puzzle_size").val(puzzle.size)
        $("#name_input").val(puzzle.name)
        load_puzzle(puzzle.puzzle)
    }
    $("#curPuzzle").append(`<option value="${index}" ${selected ? "selected": ""}>${puzzle.name}</option>`)
}

$('#savePuzzle').click(() => {
    puzzles = JSON.parse(localStorage.puzzles)
    puzzles[Number(localStorage.current)] = data
    localStorage.puzzles = JSON.stringify(puzzles)
})