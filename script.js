const generate_puzzle = (size) => {
    let puzzle = $("#puzzle")
    puzzle.html("")
    for (let i = 0; i < size; i++){
        puzzle.append("<tr></tr>")
        for (let i = 0; i < size; i++){
            $("#puzzle tr:last-of-type").append("<td class='square'><input maxlength='1'></td>")
        }
    }
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
    btn.prop("disabled", true)

    let res = await fetch(`/api/solve?size=${$("#puzzle_size").val()}&grid=${get_puzzle()}`)
    res = await res.json()
    console.log(res)

    $("#results").html("")
    for (size in res){
        $("#results").append(`<h4>${size} letters</h4><ul></ul>`)
        for (word of res[size]){
            $("#results ul:last-of-type").append(`<li>${word}</li>`)
        }
    }

    btn.prop("disabled", false)
})


generate_puzzle(3)
