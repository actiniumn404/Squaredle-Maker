const urlParams = new URLSearchParams(window.location.search)
let data = {}
let num_words = 0
let analysis = {
    squareFreq: {}
}

const generate_puzzle = (size) => {
    $("#puzzle_size").val(size)
    let puzzle = $("#puzzle")
    puzzle.html("")
    for (let i = 0; i < size; i++) {
        puzzle.append("<tr></tr>")
        for (let j = 0; j < size; j++) {
            $("#puzzle tr:last-of-type").append(`<td id="theSquare${i}-${j}" class='square'><div class='squareCircle'></div><input maxlength='1'></td>`
        )
        }
    }
    $(".square")
        .css("--size", size)
        .mouseover((e) => {
            let element = $(e.currentTarget)
            let coord = element.prop("id").substring(9)
            if ($("#squareFreq").hasClass("selected")){
                $("#sfreqPopup").html(`Coordinate: ${coord} <br>
                Letter: ${element.children()[1].value.toUpperCase()} <br>
                Number of words that use this square: ${analysis.squareFreq[coord] ?? 0}`)
            }
        })

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
        if (!res_set.has(e[0])) {
            res_set.add(e[0])
            res.push(e)
        }
    })
    return res
}

const load_puzzle = (puzzle) => {
    let squares = $(".square");
    for (let i = 0; i < squares.length; i++) {
        squares[i].children[1].value = puzzle[i].trim() ? puzzle[i] : ""
    }
}

const get_results = (words, cutoff, start = Date.now()) => {
    analysis = {
        squareFreq: {}
    }
    $("#results").html("")
    num_words = 0
    let num_awkward = 0;
    words["Bonus"] = []

    for (size in words) {
        let width = 70
        let mywords = 0
        let word_list = words[size]
        if (pdata.revBonus[size]) {
            word_list.push(...pdata.revBonus[size])
        }
        word_list = data_setify(word_list)
        word_list.sort()

        $("#results").append(`<h4>${size} ${isNaN(size) ? "words" : "letters"}</h4><ul></ul>`)
        for ([word, freq, path] of word_list) {
            if (
                (JSON.stringify(pdata.revReq[size] ?? []).includes(JSON.stringify([word, freq, path]))
                    || (freq < cutoff && size !== "Bonus"))
                && !(JSON.stringify(pdata.revBonus[size] ?? []).includes(JSON.stringify([word, freq, path])))
            ) {
                words["Bonus"].push([word, freq, path])
                continue
            }
            if (BannedGuesses.has(word) || InappropriateWords.has(word)) {
                num_awkward += 1;
            }
            mywords += 1
            num_words += 1
            $("#results ul:last-of-type").append(`
    <li 
    class="${"word_" + size}" 
    data-data='${JSON.stringify([word, freq, path])}'
    style="width: fit-content;width: -moz-fit-content;${BannedGuesses.has(word) || InappropriateWords.has(word) ? "color: mediumpurple" : ""}"
    >${word}</li>`)
            width = Math.max(width, $("#results ul:last-of-type li:last-of-type").width())

            for (let [col, row] of path){
                let square = `${col}-${row}`
                analysis.squareFreq[square] = (analysis.squareFreq[square] ?? 0) + 1
            }
        }
        if (mywords) {
            $("#results ul:last-of-type li").css("width", "initial")
            $("#results ul:last-of-type").css("grid-template-columns", `repeat(auto-fill, minmax(${Math.ceil(width) + 10}px, 1fr))`)
            $("#results h4:last-of-type").append(` (${mywords} word${mywords !== 1 ? 's': ''})`)
        } else {
            $("#results :is(h4, ul):last-of-type").remove()
        }
    }
    $("#results ul li").click(async (e) => {
        let element = $(e.currentTarget)
        popupData = element.data("data")
        popupWord = element.html()

        $("#wordDef").show()
        $(".word__form").remove()
        let wordData = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${popupWord}`)
        wordData = await wordData.json()
        $("#word__def").html(popupWord)

        $("#wordDef > #manualCateg").html(element.hasClass("word_Bonus") ? "Add to Required" : "Add to Bonus")

        if (wordData.title === "No Definitions Found") {
            return $("#wordDef").append(`<div class="word__form">Sorry, no definitions were found</div>`)
        }
        for (let meaning of wordData[0].meanings) {
            $("#wordDef").append(`<div class="word__form">
                <p class="word__desc">
                    <strong>${popupWord}</strong>
                    <i class="fas fa-volume-up hear-word" data-source="${(wordData[0].phonetics[wordData[0].phonetics.length - 1] ?? {}).audio}"></i>
                    <i>${meaning.partOfSpeech}</i>
                    <ol></ol>
                </p>`)
            for (let def of meaning.definitions) {
                $("#wordDef ol:last-of-type").append(`<li>${def.definition}</li>`)
            }

        }
        $(".hear-word").click((e) => {
            let source = $(e.currentTarget).data('source')
            if (source) {
                new Audio(source).play();
            }
        })
    })

    $("#time_numwords").html(`${num_words} result${num_words !== 1 ? "s" : ""} in ${((Date.now() - start) / 1000).toFixed(2)} seconds<br>
    ${num_awkward} awkward word${num_awkward !== 1 ? "s" : ""}`)
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

    data = res = solve(p_size, get_puzzle())

    btn.prop("disabled", false)

    if (res["error"]) {
        return $("#results").html(`<strong style="color: var(--theme)">ERROR: ${res["error"]}</strong>`)
    }

    get_results(res, $("#freq_cutoff").val(), start)
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

generate_puzzle(4)

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

if (urlParams.get("puzzle")) {
    if (0 <= Number(urlParams.get("puzzle")) && Number(urlParams.get("puzzle")) < JSON.parse(localStorage.puzzles).length) {
        localStorage.current = Number(urlParams.get("puzzle"))
    }
}
if (!localStorage.puzzles) {
    localStorage.puzzles = "[]"
}
if (JSON.parse(localStorage.puzzles).length === 0) {
    let puzzles = JSON.parse(localStorage.puzzles)
    puzzles.push({
        name: "Untitled Squaredle",
        puzzle: "                ",
        size: 4,
        revBonus: {}, // Bonus words that have been changed to Required
        revReq: {}, // Required words that have been changed to Bonus
    })
    localStorage.puzzles = JSON.stringify(puzzles)
}
if (!localStorage.current) {
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

$("#download .close").click(() => {
    $("#download").hide()
})

$("#info_popup .close").click(() => {
    $("#info_popup").hide()
})

$("#aboutSite").click(()=>{
    $("#info_popup").show()
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
