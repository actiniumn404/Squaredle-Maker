const Utils = {
    newPuzzle: (base)=>{
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
            puzzle: "                ",
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
        return Array.from(new Set(arr))
    },

    const: {
        corpus: undefined,
        freq: undefined,
        cache: undefined
    }

}