let result = {}
let tries = []

const cInit = async () => {
    corpus = new Trie()
    let raw_words = await fetch("https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt")
    raw_words = await raw_words.text()
    raw_words = raw_words.split("\r\n")

    for (let word of raw_words){
        corpus.insert(word)
    }
    $("#process").prop("disabled", false)
}

const solve = (size, grid) => {
    let words = {}
    grid = grid.match(new RegExp(".{"+size+"}", "g")).map(x => Array.from(x.toLowerCase()))

    let seen = []
    result = {}

    for (let i = 0; i < size; i++) {
        seen.push([])
        for (let j = 0; j < size; j++) {
            seen[seen.length - 1].push(0)
        }
    }


    for (let i = 0; i < size; i++){
        for (let j = 0; j < size; j++){
            dfs(i, j, seen, grid, size, "", [[i, j]])
        }
    }
    return result
}

const dfs = (row, col, seen, grid, gSize, curWord, path) => {
    if (row < 0 || col < 0 || row >= gSize || col >= gSize || seen[col][row] || (!(/[a-zA-Z]+/).test(curWord) && curWord !== "")){
        return
    }
    curWord += grid[col][row]
    if (curWord.length >= 4 && corpus.contains(curWord) ){
        if (!Object.keys(result).includes(curWord.length.toString())){
            result[curWord.length] = []
        }
        result[curWord.length].push([curWord, 10, [...path]])
    }
    let matches = corpus.find(curWord)
    if (matches.length){
        seen[col][row] = 1
        for ([cRow, cCol] of [[0, 1], [0, -1], [1, 1], [1, 0], [1, -1], [-1, 1], [-1, 0], [-1, -1]]){
            path.push([col + cCol, row + cRow])
            dfs(
                row + cRow,
                col + cCol,
                seen,
                grid,
                gSize,
                curWord,
                path
            )
            path.pop()
        }
        seen[col][row] = 0
    }
}

window.onload = () => {cInit()}
