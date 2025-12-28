import {
    html,
    css,
    LitElement
} from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

class Puzzle extends LitElement {
    static get properties(){
        return {
            size: {type: Number, reflect: true},
            puzzle: {type: String, reflect: true},
            read_only: {type: Boolean, reflect: true},
            name: {type: String, reflect: true}
        }
    }

    constructor(){
        super()
        this.size = 4
        this.puzzle = ""
        this.read_only = false
        this.name = ""
    }

    get container(){
        return this.renderRoot.querySelector("#puzzle")
    }

    get get_puzzle(){
        if (!this.container){
            return
        }
        return Array.from(this.container.children).map(e=>!e.disabled ? e.content || " " : "\0").join("").replaceAll("\t", "\0")
    }

    static get styles() {
        return css`
            *, *::before, *::after{
                box-sizing: border-box;
            }
            div#puzzle {
                display: grid;
                grid-template-columns: none;
                width: 100%;
                gap: 2%;
                aspect-ratio: 1;
            }
          
            squaredle-square{
                aspect-ratio: 1;
            }
            
            squaredle-square[disabled="true"]{
                opacity: 0.1;
            }
          
            #puzzle:is(.required, .bonus, .all){
                background: white;
                border-radius: 5px;
            }
          
            #puzzle.required squaredle-square{
                opacity: var(--required);
            }
          
            #puzzle.bonus squaredle-square{
                opacity: var(--bonus);
            }
          
            #puzzle.all squaredle-square{
                opacity: var(--all);
            }
        `
    }

    render() {
        return html`
            <div id="puzzle"
                 style="grid-template-columns: ${"minmax(0, 1fr) ".repeat(this.size)}; grid-template-rows: ${"minmax(0, 1fr) ".repeat(this.size)}"
            >
                ${[...(this.puzzle)].map((e, i)=>{return html`<squaredle-square @modification=${this.square_content_modification} content="${e}" style="width:100%;" ?read_only=${this.read_only} disabled=${e==="\x09" || e==="\0" ? "true" : "false"} data-x=${i % this.size} data-y=${Math.floor(i / this.size)}></squaredle-square>`})}
            </div>
        `
    }

    square_content_modification() {
        this.puzzle = this.get_puzzle
        console.log("Square Content Successfully Modified")
    }

    get json(){
        return {
            name: this.name,
            puzzle: this.get_puzzle,
            size: this.size
        }
    }

    get puzzle_array(){
        let res = []
        for (let i = 0; i < this.size; i++){
            res.push([])
            for (let j = 0; j < this.size; j++){
                res.at(-1).push(this.get_puzzle[i * this.size + j])
            }
        }
        return res;
    }

    async rotateRight(time){
        document.getElementById("puzzle").style.transition = time + "ms"
        document.getElementById("puzzle").style.transform = "rotate(90deg)"

        for (let child of this.container.children){
            child.style.transition = time + "ms"
            child.style.transform = "rotate(-90deg)"
        }

        await timeout(1000)

        document.getElementById("puzzle").style.transition = "none"
        document.getElementById("puzzle").style.transform = "none"

        this.puzzle = this.puzzle_array.map((val, index) => this.puzzle_array.map(row => row[index]).reverse().join("")).join("")

        for (let child of this.container.children){
            child.style.transition = "none"
            child.style.transform = "none"
        }

        this.render()

    }

    async rotateLeft(time){
        document.getElementById("puzzle").style.transition = time + "ms"
        document.getElementById("puzzle").style.transform = "rotate(-90deg)"

        for (let child of this.container.children){
            child.style.transition = time + "ms"
            child.style.transform = "rotate(90deg)"
        }

        await timeout(1000)

        document.getElementById("puzzle").style.transition = "none"
        document.getElementById("puzzle").style.transform = "none"


        this.puzzle = this.puzzle_array.map((val, index) => this.puzzle_array.map(row => row[row.length-1-index]).join("")).join("")

        for (let child of this.container.children){
            child.style.transition = "none"
            child.style.transform = "none"
        }

        this.render()

    }

    request_resize(){
        for (let child of this.container.children){
            child.update_font()
        }
    }

    puzzle_resize(new_size) {
        let puzzle
        if (new_size > this.size){
            puzzle = this.puzzle_array.map(e=>(e.concat(Array(new_size - this.size).fill(" "))).join("")).join("") + " ".repeat(new_size * (new_size - this.size))
        }else{
            puzzle = this.puzzle_array
            puzzle = puzzle.map((e)=>{e.splice(new_size, this.size - new_size);return e.join("")})
            puzzle.splice(new_size, this.size - new_size)
            puzzle = puzzle.join("")
        }

        [this.puzzle, this.size] = [puzzle, new_size]
    }

    async show_path(path, timeout_duration_ms, hide=true){
        let items = [...this.container.children].map(e=>$(e.container).find(".squareCircle"))

        let i = 0;
        let state = ++show_path_index

        if (hide){
            items.forEach(e=>e.css("background", `none`).hide())
        }

        timeout_duration_ms = timeout_duration_ms ?? Number($("#settings__timeout").val())

        for (let [col, row] of path){

            if (state !== show_path_index && hide){ // abort!
                return
            }

            let item = items[col * game.puzzle.size + row]
            item
                .css("background", `hsl(${360 / path.length * i}, 100%, 50%)`)
                .css("width", `calc(${item.parent().width()}px * (1 - ${0.5 / path.length * i}))`)
                .css("height", `calc(${item.parent().height()}px * (1 - ${0.5 / path.length * i}))`)
                .show()
            i++;
            await timeout(timeout_duration_ms);
        }
    }
}

let show_path_index = 0; // bad practice but...

class PuzzleSquare extends LitElement{
    static get properties(){
        return {
            content: {type: String, reflect: true},
            disabled: {type: Boolean, reflect: true},
            read_only: {type: Boolean, reflect: true},
            marked: {type: Boolean, reflect: true}
        }
    }

    constructor(){
        super()
        this.content = ""
        this.disabled = false
        this.read_only = false
    }

    static get styles(){
        return css`
            *, *::before, *::after{
                box-sizing: border-box;
            }
            #container{
                aspect-ratio: 1;
                background: #202020;
                border: 1px solid gray;
                border-radius: 15%;
                font-weight: bolder;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                width: 100%;
                position: relative;
            }
            input{
                width: 100%;
                background: none;
                border: none;
                text-align: center;
                color: white;
                font-size: 100%;
                font-weight: bolder;
                outline: none;
                text-transform: capitalize;
                z-index: 2;
                height: 100%;
            }
          
            .squareCircle{
                position: absolute;
                display: none;
                border-radius: 100%;
                opacity: 0.8;
                animation: 200ms ease popin;
            }
          
            @keyframes popin{
                0% {
                    transform: scale(0)
                }
                100% {
                    transform: scale(1)
                }
            }
    `
    }

    get container(){
        return this.renderRoot.querySelector("#container")
    }

    get input(){
        return this.renderRoot.querySelector("input")
    }

    update_font(){
        this.input.style.fontSize = 0.5 * this.offsetHeight + "px"
    }

    render(){
        this.normalize()

        if (this.input){
            this.input.value = this.content
        }

        this.disabled = this.getAttribute("disabled") === "true"
        this.oncontextmenu = (e)=>{this._handle_contextmenu(e)}
        return html`
            <div id="container" disabled=${this.disabled ? "true" : "false"}>
                <div class="squareCircle"></div>
                <input id="input" maxlength="1" value=${this.content} ?disabled=${this.read_only} @change=${this.handle_change} @keyup=${this.handle_change} />
            </div>`
    }

    normalize() {
        this.content = this.content.trim().toUpperCase()
        this.disabled = this.getAttribute("disabled") === "true"
    }

    handle_change(e){
        this.content = this.input.value
        this.normalize()
        this.dispatchEvent(new CustomEvent('modification', {}))
    }

    _handle_contextmenu(e){
        Utils.const.active = [Number(this.getAttribute("data-x")), Number(this.getAttribute("data-y"))]
        e.preventDefault()
        $("#squareContextMenu").css({
            left: e.pageX,
            top: e.pageY
        }).show()

        $("#squareCtxHide").html(`${this.disabled ? "Show" : "Hide"} Square`)
    }
}

customElements.define("squaredle-puzzle", Puzzle);
customElements.define("squaredle-square", PuzzleSquare);

