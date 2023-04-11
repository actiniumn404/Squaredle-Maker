let tries = []

const solver_init = async () => {
    console.time()
    Utils.const.corpus = new Trie()

    let words
    if ('caches' in window){
        Utils.const.cache = await caches.open("squaredle")
        words = await Utils.const.cache.match("data/words.txt")
        if (!words){
            Utils.const.cache.add("data/words.txt")
            words = await Utils.const.cache.match("data/words.txt")
        }
        words = await words.text()
    }else{
        words = await fetch("data/words.txt")
        words = await words.text()
    }

    Utils.const.corpus.fromString(words)

    console.timeEnd()
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
            awkward_list: [],
            words: 0,
            wps: {} // words per square
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
                this.dfs(i, j, new Word("", [[j, i]]), Utils.const.corpus.root)
            }
        }
        return this.result
    }

    dfs(row, col, cur, corpus) {
        if (row < 0 || col < 0 || row >= this.size || col >= this.size || this.seen[col][row]) {
            return
        }
        if (cur.word.length >= 4 && corpus.end) {
            if (!Object.keys(this.result).includes(cur.word.length.toString())) {
                this.result[cur.word.length] = []
            }
            let obj = Object.assign(Object.create(Object.getPrototypeOf(cur)), cur)
            obj.activate()
            obj.frequency = corpus.freq

            // Analytical stuff
            if (obj.awkward){
                this.analysis.awkward += 1
                this.analysis.awkward_list.push(obj)
            }

            if (obj.frequency < this.cutoff){
                this.result["BONUS"].push(obj)
            }else{
                this.result[cur.word.length].push(obj)
            }
        }

        this.seen[col][row] = true
        for (let [cRow, cCol] of [[0, 1], [0, -1], [1, 1], [1, 0], [1, -1], [-1, 1], [-1, 0], [-1, -1]]) {
            if (row+cRow < 0 || col+cCol < 0 || row+cRow >= this.size || col+cCol >= this.size || !corpus.children.hasOwnProperty(this.grid[col+cCol][row+cRow])){
                continue;
            }
            cur.add_word(this.grid[col+cCol][row+cRow])
            cur.add_path( [col + cCol, row + cRow])
            this.dfs(
                row + cRow,
                col + cCol,
                cur,
                corpus.children[this.grid[col+cCol][row+cRow]]
            )
            cur.pop()
        }
        this.seen[col][row] = false

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
        $("#results ul li").click((e)=>{Utils.show_word($(e.currentTarget).html())})

        this.display_analysis()
        this.tally_wps()

        $("#time_numwords").html(`${this.analysis.words} result${this.analysis.words !== 1 ? "s" : ""} in ${((Date.now() - this.start) / 1000).toFixed(2)} seconds`)
    }

    display_analysis(){
        // Preload
        $(".analysis_content").hide()
        $(".analysis_invoke").data("open", "no").find("i").removeClass("fa-caret-down").addClass("fa-caret-right")
        $("#analysis_awkward_list").html("")
        $("#analysis_words_per_square .info").html("For each square, the top and bottom numbers represent the number of required and bonus words that use said square. Click on a square to see which words use it.")

        // Awkward
        let width = 70;
        this.analysis.awkward_list = Utils.remove_duplicates(this.analysis.awkward_list)

        $("#analysis_awkward .num").html(`${this.analysis.awkward_list.length} awkward word${this.analysis.awkward_list.length === 1 ? "" : "s"}`)
        $("#analysis_awkward .msg").html(this.analysis.awkward_list.length === 0 ? "Congrats!" : "Here are said words:")

        for (let word of this.analysis.awkward_list){
            $("#analysis_awkward_list").append(word.html)
            width = Math.max(width, $("#analysis_awkward_list li:last-of-type").width())
        }

        $("#analysis_awkward_list").css("grid-template-columns", `repeat(auto-fill, minmax(${Math.ceil(width) + 10}px, 1fr))`)
        $("#analysis_awkward_list li").click((e)=>{Utils.show_word($(e.currentTarget).html())})
    }

    tally_wps(){
        for (let group in this.result){
            for (let word of this.result[group]){
                for (let path of word.path){
                    if (!this.analysis.wps[path]){
                        this.analysis.wps[path] = []
                    }
                    this.analysis.wps[path].push(word)
                }
            }
        }
        console.log(this.analysis.wps)
    }
}