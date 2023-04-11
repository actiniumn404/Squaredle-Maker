const Utils = {
    newPuzzle: (base, size, puzzle="                ")=>{
        base = base.trim()
        let existing_names = JSON.parse(localStorage.puzzles).map(e => e.name)
        let name;
        if (!existing_names.includes("Untitled Squaredle")) {
            name = base;
        } else {
            name = base+" (1)"
            let i = 1;
            while (existing_names.includes(name)) {
                name = base+` (${i})`
                i += 1;
            }
        }
        let puzzles = JSON.parse(localStorage.puzzles)
        puzzles.push({
            name: name,
            puzzle: puzzle,
            size: 4,
            revBonus: {},
            revReq: {},
        })
        localStorage.puzzles = JSON.stringify(puzzles)
        return puzzles.length - 1
    },

    array_intersection: (array1, array2) => {
        return array1.filter(value => array2.includes(value))
    },

    remove_duplicates: (arr) => {
        let res = []
        let words = new Set()
        for (let x of arr){
            if (words.has(x.word)){
                continue;
            }
            words.add(x.word)
            res.push(x)
        }
        return res;
    },

    const: {
        corpus: undefined,
        freq: undefined,
        cache: undefined
    },

    show_word: async (popupWord)=>{
        $("#wordDef").show()
        $(".word__form").remove()
        let wordData = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${popupWord}`)
        wordData = await wordData.json()
        $("#word__def").html(popupWord)

        //$("#wordDef > #manualCateg").html(element.hasClass("word_Bonus") ? "Add to Required" : "Add to Bonus")

        if (wordData.title === "No Definitions Found") {
            return $("#wordDef").append(`<div class="word__form">Sorry, no definitions were found</div>`)
        }
        for (let meaning of wordData[0].meanings) {
            let url = (wordData[0].phonetics[wordData[0].phonetics.length - 1] ?? {}).audio
            $("#wordDef").append(`<div class="word__form">
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