let tries = []

const solver_init = async () => {
    console.time()
    Utils.const.corpus = new Trie()

    let words
    if ('caches' in window){
        Utils.const.cache = await caches.open("squaredle")
        words = await Utils.const.cache.match("data/words.txt")
        if (!words){
            await Utils.const.cache.add("data/words.txt")
            words = await Utils.const.cache.match("data/words.txt")
            location.reload()
        }else{
            words = await words.text()
        }
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
        this.alternate_paths = []

        this.frequency = undefined
        this.awkward = undefined
        this.html = undefined
        this.bonus = false
    }

    add_word(word){
        this.word += word
    }

    add_path(path){
        this.path.push(path)
    }

    add_alternate_path(path) {
        this.alternate_paths.push(path)
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
        this.html = `<li class="result_word ${"word_" + this.word.length} ${this.flags.join(' ')}" data-word='${JSON.stringify(this.json())}'>${this.word}</li>`
    }

    json(){
        return {
            word: this.word,
            path: this.path,
            flags: this.flags,
            frequency: this.frequency,
            awkward: this.awkward,
            bonus: this.bonus
        }
    }

    clone() {
        let clone = Object.assign(Object.create(Object.getPrototypeOf(this)), this)

        // Manually deep copy specific nested arrays/objects
        this.path = [...this.path]
        this.alternate_paths = [...this.alternate_paths]
        this.flags = [...this.flags]

        return clone;
    }
}

class Solver {
    constructor(puzzle, cutoff) {
        this.puzzle = puzzle
        this.size = puzzle.size
        this.cutoff = cutoff
        this.result = {"Bonus": []}
        this.seen = []
        this.analysis = {
            awkward: 0,
            awkward_list: [],
            words: 0,
            wps: {}, // words per square
        }
        this.start = 0
        this.bonus_count = 0
        this.letters = new Set("abcdefghijklmnopqrstuvwxyz")

        for (let i = 0; i < this.size; i++) {
            this.seen.push([])
            for (let j = 0; j < this.size; j++) {
                this.seen[i].push(false)
            }
        }
        this.grid = this.puzzle.get_puzzle.match(new RegExp(".{" + this.puzzle.size + "}", "g")).map(x => Array.from(x.toLowerCase()))
    }

    solve(){
        $("#results_notice").hide()
        this.start = Date.now()
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                this.dfs(j, i, new Word(this.grid[i][j], [[i, j]]), Utils.const.corpus.root.children[this.grid[i][j]])
            }
        }
        return this.result
    }

    dfs(row, col, cur, corpus) {
        if (row < 0 || col < 0 || row >= this.size || col >= this.size || this.seen[col][row] || !this.letters.has(cur.word[cur.word.length - 1])) {
            return
        }
        if (cur.word.length >= 4 && corpus.end) {
            if (!Object.keys(this.result).includes(cur.word.length.toString())) {
                this.result[cur.word.length] = []
            }
            let obj = cur.clone()
            obj.path = [...cur.path]
            obj.frequency = corpus.freq
            obj.bonus = (obj.frequency < this.cutoff || Utils.const.manualSort.isBonus(obj.word)) && !Utils.const.manualSort.isRequired(obj.word)
            obj.activate()

            // Analytical stuff
            if (obj.awkward){
                this.analysis.awkward += 1
                this.analysis.awkward_list.push(obj)
            }

            if (obj.bonus){
                this.result["Bonus"].push(obj)
            }else{
                this.result[cur.word.length].push(obj)
            }
        }

        this.seen[col][row] = true
        // Better DFS that is more accurate to Squaredle
        for (let [cRow, cCol] of [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]) {
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
    display(element, print){
        element = $(element)
        element.html("")

        this.bonus_count = 0

        for (let category in this.result) {
            let width = 70
            this.result[category] = Utils.remove_duplicates(this.result[category])
            let word_list = this.result[category]
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

            element.append(`<h4 id="results_header_${category}" data-category="${category}">
                                ${category} ${category === "Bonus" ? "words" : "letters"}
                            </h4>
                            <ul id="results__content_${category}"></ul>`)

            for (let word of word_list) {
                this.analysis.words += 1
                $("#results ul:last-of-type").append(word.html)
                width = Math.max(width, $("#results ul:last-of-type li:last-of-type").width())

                if (category === "Bonus"){
                    this.bonus_count += 1;
                }
            }

            $("#results ul:last-of-type li").css("width", "initial")
            $("#results ul:last-of-type").css("grid-template-columns", `repeat(auto-fill, minmax(${Math.ceil(width) + 10}px, 1fr))`)
            $("#results h4:last-of-type").append(` (${word_list.length} word${word_list.length !== 1 ? 's': ''}) <i class="fa-solid fa-caret-down"></i>`)

            if (word_list.length >= 100){
                $("#results h4:last-of-type i").toggleClass("fa-caret-down").toggleClass("fa-caret-right")
                $("#results ul:last-of-type").toggle()
            }
        }

        if (!print){
            $("#results ul li").click((e)=>{
                e = $(e.currentTarget)
                Utils.show_word(e.html())
            })

            this.display_analysis()
            this.tally_wps()

            let required = this.analysis.words - this.bonus_count;
            let difficulty = 1;


            if (required <= 25){
                difficulty = 1;
            }else if (required <= 35){
                difficulty = 2
            }else if (required <= 50){
                difficulty = 3
            }else if (required < 70){
                difficulty = 4
            }else if (required >=70){
                difficulty = 5
            }

            console.log(required, difficulty)



            $("#time_numwords").html(`
                ${this.analysis.words} result${this.analysis.words !== 1 ? "s" : ""}
                in ${((Date.now() - this.start) / 1000).toFixed(2)} seconds<br> (${this.analysis.words - this.bonus_count} Required and ${this.bonus_count} Bonus)
                <br><br>
                <div id="estimation">
                    <div>Estimated: ${'<i class="fa-solid fa-star star"></i>'.repeat(difficulty)}</div> 
                    <div id="questionRatings"><i class="fa-regular fa-circle-question"></i></div>
                </div>`)

            if (this.analysis.awkward_list.length){
                $("#warnings").css("display", "flex")
                $("#warnings .desc").html(`Your puzzle has ${this.analysis.awkward_list.length} awkward word${this.analysis.awkward_list.length === 1 ? "" : "s"}!`)
            }else{
                $("#warnings").hide()
            }
        }

        $("#results h4").click((e)=>{
            let cur = $(e.currentTarget)
            let caret = $(cur.find("i"))

            caret.toggleClass("fa-caret-down").toggleClass("fa-caret-right")
            $(`#results__content_${cur.data("category")}`).toggle()
        })
    }

    async display_analysis(){
        // Preload
        $(".analysis_content").hide()
        $(".analysis_invoke").data("open", "no").find("i").removeClass("fa-caret-down").addClass("fa-caret-right")
        $("#analysis_awkward_list").html("")
        $("#analysis_words_per_square .info").html("For each square, the top and bottom numbers represent the number of required and bonus words that use said square. Click on a square to see which words use it.")

        // Awkward
        let width = 70;
        this.analysis.awkward_list = Utils.remove_duplicates(this.analysis.awkward_list)

        $("#analysis_awkward .num").html(`${this.analysis.awkward_list.length} awkward word${this.analysis.awkward_list.length === 1 ? "" : "s"}`)
        $("#analysis_awkward .msg").html(this.analysis.awkward_list.length === 0 ? "." : ":")

        for (let word of this.analysis.awkward_list){
            $("#analysis_awkward_list").append(word.html)
            width = Math.max(width, $("#analysis_awkward_list li:last-of-type").width())
        }

        $("#analysis_awkward_list").css("grid-template-columns", `repeat(auto-fill, minmax(${Math.ceil(width) + 10}px, 1fr))`)
        $("#analysis_awkward_list li").click((e)=>{
            Utils.show_word($(e.currentTarget).html())
        })

        await $(":is(#analysis_words_per_square, #analysis_words_distribution) squaredle-puzzle").attr("puzzle", game.puzzle.puzzle).attr("size", game.puzzle.size)

        this.list_bonus = new Set(Utils.const.results.result["Bonus"].map(e=>e.word))

        let display_stats = (element) => {
            if (Number(element.style.opacity) === 0.5){
                $("#analysis_wps_content").hide()
                element.style.opacity = 1
                return
            }

            let x = $(element).data("x")
            let y = $(element).data("y")
            let results = Utils.const.results.analysis.wps[y+","+x]
            if (!results){
                $("#analysis_wps_required").text("N/A (This square is disabled)")
                $("#analysis_wps_bonus").text("N/A (This square is disabled)")
                $("#analysis_wps_total").text("N/A (This square is disabled)")
                return
            }

            [...$("#analysis_words_per_square squaredle-puzzle").prop("container").children].map(e=>{if (!e.disabled){e.style.opacity=1}})

            element.style.opacity = 0.5
            $("#analysis_wps_content").show()


            let is_bonus = results.filter(e=>Utils.const.results.list_bonus.has(e.word))

            $("#analysis_wps_required").text(results.length - is_bonus.length)
            $("#analysis_wps_bonus").text(is_bonus.length)
            $("#analysis_wps_total").text(results.length)
        }

        $("#solvingModal").css("display", "flex")

        await timeout(200);

        Array.from($("#analysis_words_per_square squaredle-puzzle").prop("container").children).forEach(e=>{
            e.style.cursor = "pointer"
            e.onclick = (a)=>{
                display_stats(a.currentTarget)
            }

            let box = e.container.querySelector("input")
            box.style.pointerEvents = "none"
        })


        let total_words = this.analysis.words
        let num_required = this.analysis.words - this.list_bonus.size
        let num_bonus = this.list_bonus.size

        let squares = Array.from($("#puzzle").prop("container").children).map(e=>$(e))

        let max_required = 0
        let max_bonus = 0
        let max_total = 0

        //console.log("PRELIM", total_words, num_required, num_bonus)
        for (let y = 0; y < this.size; y++){
            for (let x = 0; x < this.size; x++){
                let results = Utils.const.results.analysis.wps[y + "," + x]
                if (!results){
                    squares[y * this.size + x].css("--required", 0)
                    squares[y * this.size + x].css("--bonus", 0)
                    squares[y * this.size + x].css("--all", 0)
                    continue;
                }
                let is_bonus = results.filter(e=>this.list_bonus.has(e.word))

                max_required = Math.max(max_required, (results.length - is_bonus.length) / num_required)
                max_bonus = Math.max(max_bonus, (is_bonus.length) / num_bonus)
                max_total = Math.max(max_total, (results.length) / total_words)


                squares[y * this.size + x].css("--required", (results.length - is_bonus.length) / num_required)
                squares[y * this.size + x].css("--bonus", (is_bonus.length) / num_bonus)
                squares[y * this.size + x].css("--all", (results.length) / total_words)
            }
        }
        for (let y = 0; y < this.size; y++){
            for (let x = 0; x < this.size; x++){
                squares[y * this.size + x].css("--required", Number(squares[y * this.size + x].css("--required"))/max_required)
                squares[y * this.size + x].css("--bonus", Number(squares[y * this.size + x].css("--bonus"))/max_bonus)
                squares[y * this.size + x].css("--all", Number(squares[y * this.size + x].css("--all"))/max_total)
            }
        }

        $(".analysis_distrib_container input").change((e) => {
            let element = e.currentTarget
            let cls = element.classList[0]

            console.log(cls)

            $(`.analysis_distrib_container input:not(.${cls})`).prop("checked", false)

            $($("#puzzle").prop("container")).removeClass("required bonus all")

            if ($(element).is(":checked")){
                $($("#puzzle").prop("container")).addClass(cls)
            }
        })
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
    }
}