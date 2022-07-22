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
}

const get_puzzle = () => {
    let res = ""
    document.querySelectorAll("#puzzle td input").forEach((e) => {
        res += e.value
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

    $("#time_numwords").html(`${num_words} result${num_words !== 1 ? "s": ""} in ${((Date.now() - start) / 1000).toFixed(2)} seconds<br>
    ${num_awkward} awkward word${num_awkward !== 1 ? "s": ""}`)
}

$("#puzzle_size").on("change keyup input", () => {
    let size = Number($("#puzzle_size").val())
    if (size && 3 <= size && size <= 10) {
        p_size = size
        generate_puzzle(p_size)
    }
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

window.onbeforeunload = function() {
    return function(){return true};
}


generate_puzzle(3)
