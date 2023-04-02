let tries = []

const solver_init = async () => {
    Utils.const.corpus = new Trie()

    if ('caches' in window){
        Utils.const.cache = await caches.open("squaredle")
        Utils.const.freq = await Utils.const.cache.match("data/words.json")
        if (!Utils.const.freq){
            Utils.const.cache.add("data/words.json")
            Utils.const.freq = await Utils.const.cache.match("data/words.json")
        }
        Utils.const.freq = await Utils.const.freq.json()
    }else{
        Utils.const.freq = await fetch("data/words.json")
        Utils.const.freq = await Utils.const.freq.json()
    }

    for (let word in Utils.const.freq){
        Utils.const.corpus.insert(word)
    }
    $("#process").prop("disabled", false).html("Solve!")
}

class Word{
    constructor(word="", path=[]) {
        this.word = word
        this.path = path
        this.flags = []

        this.frequency = undefined
        this.awkward = undefined
        this.html = undefined
    }

    add_word(word){
        this.word += word
    }

    add_path(path){
        this.path.push(path)
    }

    pop(){
        this.word = this.word.substring(0, this.word.length - 1)
        this.path.pop()
        this.flags = []
    }

    activate(){
        this.frequency = Utils.const.freq[this.word];
        this.awkward = (BannedGuesses.has(this.word) || InappropriateWords.has(this.word))
        if (this.awkward){
            this.flags.push("awkward")
        }
        this.html = `<li class="result_word ${"word_" + this.word.length} ${this.flags.join(' ')}" data-word="${this.word}">${this.word}</li>`
    }
}

class Solver {
    constructor(puzzle, cutoff) {
        this.puzzle = puzzle
        this.size = puzzle.size
        this.cutoff = cutoff
        this.result = {"BONUS": []}
        this.seen = []
        this.analysis = {
            awkward: 0,
            words: 0
        }
        this.start = 0

        for (let i = 0; i < this.size; i++) {
            this.seen.push([])
            for (let j = 0; j < this.size; j++) {
                this.seen[i].push(false)
            }
        }

        this.grid = this.puzzle.repr().match(new RegExp(".{" + this.puzzle.size + "}", "g")).map(x => Array.from(x.toLowerCase()))
    }

    solve(){
        $("#results_notice").hide()
        this.start = Date.now()
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                this.dfs(i, j, new Word("", [[j, i]]))
            }
        }
        return this.result
    }

    dfs(row, col, cur) {
        if (row < 0 || col < 0 || row >= this.size || col >= this.size || this.seen[col][row] || (!(/[a-zA-Z]+/).test(cur.word) && cur.word !== "")) {
            cur.add_word(" ")
            return
        }
        cur.add_word(this.grid[col][row])
        if (cur.word.length >= 4 && Utils.const.corpus.contains(cur.word)) {
            if (!Object.keys(this.result).includes(cur.word.length.toString())) {
                this.result[cur.word.length] = []
            }
            let obj = Object.assign(Object.create(Object.getPrototypeOf(cur)), cur)
            obj.activate()

            // Analytical stuff
            if (obj.awkward){
                this.analysis.awkward += 1
            }

            if (obj.frequency < this.cutoff){
                this.result["BONUS"].push(obj)
            }else{
                this.result[cur.word.length].push(obj)
            }
        }
        let matches = Utils.const.corpus.find(cur.word)
        if (matches.length) {
            this.seen[col][row] = true
            for (let [cRow, cCol] of [[0, 1], [0, -1], [1, 1], [1, 0], [1, -1], [-1, 1], [-1, 0], [-1, -1]]) {
                cur.add_path( [col + cCol, row + cRow])
                this.dfs(
                    row + cRow,
                    col + cCol,
                    cur,
                )
                cur.pop()
            }
            this.seen[col][row] = false
        }
    }
    display(element){
        element = $(element)
        element.html("")

        for (let category in this.result) {
            let width = 70
            let word_list = Utils.remove_duplicates(this.result[category])
            if (!word_list.length){
                continue
            }
            word_list.sort((a, b)=>{
                if (b.word > a.word){
                    return -1
                }else if (a.word > b.word){
                    return 1
                }else{
                    return 0
                }
            })

            $("#results").append(`<h4>${category} ${category === "BONUS" ? "words" : "letters"}</h4><ul></ul>`)

            for (let word of word_list) {
                this.analysis.words += 1
                $("#results ul:last-of-type").append(word.html)
                width = Math.max(width, $("#results ul:last-of-type li:last-of-type").width())
            }

            $("#results ul:last-of-type li").css("width", "initial")
            $("#results ul:last-of-type").css("grid-template-columns", `repeat(auto-fill, minmax(${Math.ceil(width) + 10}px, 1fr))`)
            $("#results h4:last-of-type").append(` (${word_list.length} word${word_list.length !== 1 ? 's': ''})`)
        }
        $("#results ul li").click(async (e) => {
            let element = $(e.currentTarget)
            let popupData = element.data("data")
            let popupWord = element.html()

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

        $("#time_numwords").html(`${this.analysis.words} result${this.analysis.words !== 1 ? "s" : ""} in ${((Date.now() - this.start) / 1000).toFixed(2)} seconds<br>
        ${this.analysis.awkward} awkward word${this.analysis.awkward !== 1 ? "s" : ""}`)
    }

}