let num_words = 0

const generate_puzzle = (size) => {
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

$("#puzzle_size").click(() => {
    generate_puzzle($("#puzzle_size").val())
})

$("#process").click(async () => {
    let btn = $("#process")
    let start = Date.now()
    btn.prop("disabled", true)

    let res = await fetch(`/api/solve?size=${$("#puzzle_size").val()}&grid=${get_puzzle()}`)
    res = await res.json()

    $("#results").html("")
    btn.prop("disabled", false)

    if (res["error"]){
        return $("#results").html(`<strong style="color: var(--theme)">ERROR: ${res["error"]}</strong>`)
    }

    num_words = 0

    for (size in res){
        let width = 70
        let word_list = [...new Set(res[size])]
        word_list.sort()


        $("#results").append(`<h4>${size} letters</h4><ul></ul>`)
        for (word of word_list){
            num_words += 1
            $("#results ul:last-of-type").append(`<li style="width: fit-content;width: -moz-fit-content;">${word}</li>`)
            width = Math.max(width, $("#results ul:last-of-type li:last-of-type").width())
        }
        $("#results ul:last-of-type li").css("width", "initial")
        $("#results ul:last-of-type").css("grid-template-columns", `repeat(auto-fill, minmax(${Math.ceil(width) + 10}px, 1fr))`)
    }

    $("#time_numwords").html(`${num_words} result${num_words !== 1 ? "s": ""} in ${((Date.now() - start) / 1000).toFixed(2)} seconds`)

})

$("#exportDscd").click(() => {
    let index = 0;
    let size = $("#puzzle_size").val();
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


generate_puzzle(3)
