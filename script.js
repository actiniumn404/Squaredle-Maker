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

$("#puzzle_size").click(() => {
    generate_puzzle($("#puzzle_size").val())
})


generate_puzzle(3)
