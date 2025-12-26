const Utils = {
    newPuzzle: (base, size, puzzle="                ")=>{
        base = base.trim()
        let existing_names = JSON.parse(localStorage.puzzles ?? "[]").map(e => e.name)
        let name;
        if (!existing_names.includes(base)) {
            name = base;
        } else {
            name = base+" (1)"
            let i = 1;
            while (existing_names.includes(name)) {
                name = base+` (${i})`
                i += 1;
            }
        }
        let puzzles = JSON.parse(localStorage.puzzles ?? "[]")
        puzzles.push({
            name: name,
            puzzle: puzzle,
            size: size,
        })
        localStorage.puzzles = JSON.stringify(puzzles)
        return puzzles.length - 1
    },

    array_intersection: (array1, array2) => {
        return array1.filter(value => array2.includes(value))
    },

    remove_duplicates: (arr) => {
        let res = []
        let words = {}
        let index = 0;
        for (let x of arr){
            if (words.hasOwnProperty(x.word)){
                res[words[x.word]].add_alternate_path(structuredClone(x.path))
                continue;
            }
            words[x.word] = index
            res.push(x.clone())
            index++
        }
        return res;
    },

    const: {
        corpus: undefined,
        freq: undefined,
        cache: undefined
    },

    show_word: async (popupWord)=>{

        let word = Utils.const.results.result[popupWord.length].filter(x => x.word === popupWord).concat(
            Utils.const.results.result["Bonus"].filter(x => x.word === popupWord))[0]

        Utils.const.active = word


        $("#wordDef .header").mousedown((e) => {
            let coordinates = document.getElementById("wordDef").getBoundingClientRect()

            word_definition_box_offset = [coordinates.left - e.clientX, coordinates.top - e.clientY]

        })
        $("#wordDef").mousemove((e) => {
            if (!word_definition_box_offset){
                return
            }

            let newX = word_definition_box_offset[0] + e.clientX
            let newY = word_definition_box_offset[1] + e.clientY

            $("#wordDef").css({
                transform: "none",
                right: "auto",
                left: newX + "px",
                top: newY + "px"
            })

        }).mouseup(() => {
            word_definition_box_offset = null
        })

        $("#altPaths").html("")
        $("#altPaths_wrapper .analysis_invoke span").html(word.alternate_paths.length)
        for (let i = 0; i < word.alternate_paths.length; i++){
            $("#altPaths").append(`<button class="smallCoolBtn path" data-id="${i}">Show Alternate Path ${i + 1}</button>`)
        }

        $("#altPaths .path").click(async (e) => {
            let path = Number(e.currentTarget.getAttribute("data-id"));

            console.log(path, Utils.const.active)

            await game.puzzle.show_path(Utils.const.active.alternate_paths[path])

            $("#hidePath").show()
        })

        $("#wordDef").show()
        $("#definition").html("Fetching definition...")
        let wordData = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${popupWord}`)
        wordData = await wordData.json()
        $("#word__def").html(popupWord)
        $("#definition").html("")

        //$("#wordDef > #manualCateg").html(element.hasClass("word_Bonus") ? "Add to Required" : "Add to Bonus")

        if (wordData.title === "No Definitions Found") {
            return $("#wordDef #definition").append(`<div class="word__form">Sorry, no definitions were found</div>`)
        }
        for (let meaning of wordData[0].meanings) {
            let url = (wordData[0].phonetics[wordData[0].phonetics.length - 1] ?? {}).audio
            $("#wordDef #definition").append(`<div class="word__form">
                <p class="word__desc">
                    <strong>${popupWord}</strong>
                    <i class="fas ${url ? 'fa-volume-up hear-word' : 'fa-volume-xmark'}" data-source="${url}"></i>
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
    }

}