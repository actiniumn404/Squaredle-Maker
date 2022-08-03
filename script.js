const urlParams = new URLSearchParams(window.location.search)
let data = {}
let num_words = 0

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
        pdata.puzzle = get_puzzle()
    })
}

const get_puzzle = () => {
    let res = ""
    document.querySelectorAll("#puzzle td input").forEach((e) => {
        res += e.value ? e.value : " "
    })

    return res
}
const array_intersection = (array1, array2) => {
    return array1.filter(value => array2.includes(value))
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
    let squares = $(".square");
    for (let i = 0; i < squares.length; i++){
        squares[i].children[0].value = puzzle[i].trim() ? puzzle[i] : ""
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
        let word_list = words[size]
        if (pdata.revBonus[size]){
            word_list.push(...pdata.revBonus[size])
        }
        word_list = data_setify(word_list)
        word_list.sort()


        $("#results").append(`<h4>${size} letters</h4><ul></ul>`)
        for ([word, freq] of word_list){
            if ((pdata.revReq[size] ?? []).includes(word) || (freq < cutoff && size !== "Bonus")){
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
    pdata.size = $("#puzzle_size").val()
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

$("#word__close").click(() => {
    $("#wordDef").hide()
})

$("#name_input").keyup(() => {
    pdata.name = $("#name_input").val()
})

if (urlParams.get("puzzle")){
    if (0 <= Number(urlParams.get("puzzle")) && Number(urlParams.get("puzzle")) < JSON.parse(localStorage.puzzles).length){
        localStorage.current = Number(urlParams.get("puzzle"))
    }
}
if (!localStorage.puzzles){
    localStorage.puzzles = "[]"
}if (JSON.parse(localStorage.puzzles).length === 0){
    let puzzles = JSON.parse(localStorage.puzzles)
    puzzles.push({
        name: "Untitled Squaredle",
        puzzle: "                ",
        size: 4,
        revBonus: {}, // Bonus words that have been changed to Required
        revReq: {}, // Required words that have been changed to Bonus
    })
    localStorage.puzzles = JSON.stringify(puzzles)
}if (!localStorage.current){
    localStorage.current = 0
}

$("#curPuzzle").html("")
let pdata;
let original_data;
let p_size;
for ([index, puzzle] of JSON.parse(localStorage.puzzles).entries()) {
    let selected = index === Number(localStorage.current)
    if (selected) {
        original_data = puzzle
        pdata = {...original_data}
        p_size = Number(puzzle.size)
        $("#puzzle_size").val(p_size)
        $("#name_input").val(puzzle.name)
        generate_puzzle(p_size)
        load_puzzle(puzzle.puzzle)
    }
    $("#curPuzzle").append(`<option value="${index}" ${selected ? "selected" : ""}>${puzzle.name}</option>`)
}

const save = () => {
    let puzzles = JSON.parse(localStorage.puzzles)
    puzzles[Number(localStorage.current)] = pdata
    localStorage.puzzles = JSON.stringify(puzzles)
    original_data = {...pdata}
    $(`#curPuzzle option:nth-of-type(${Number(localStorage.current) + 1})`).html(pdata.name)
}


$('#savePuzzle').click(() => save())

window.onbeforeunload = () => {
    if (JSON.stringify(original_data) !== JSON.stringify(pdata)){
        return () => {}
    }
}

$("#newPuzzle").click(() => {
    let existing_names = JSON.parse(localStorage.puzzles).map(e => e.name)
    let name;
    if (!existing_names.includes("Untitled Squaredle")){
        name = "Untitled Squaredle";
    }else{
        name = "Untitled Squaredle (1)"
        let i = 1;
        while (existing_names.includes(name)){
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

$("#curPuzzle").change(() => {
    urlParams.set("puzzle", $("#curPuzzle").val())
    location.search = "?" + urlParams.toString()
})

document.onkeydown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        save()
    }
}