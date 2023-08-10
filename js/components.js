import {
    html,
    css,
    LitElement
} from "https://unpkg.com/lit@2.0.0-rc.2/index.js?module";

class Puzzle extends LitElement {
    static get properties(){
        return {
            size: {type: Number},
            puzzle: {type: String},
            read_only: {type: Boolean},
            name: {type: String}
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
        return Array.from(this.container.children).map(e=>!e.disabled ? e.content : "\0").join("").replaceAll("\t", "\0")
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
        `
    }

    render() {
        return html`
            <div id="puzzle" style="grid-template-columns: ${"1fr ".repeat(this.size)}">
                ${[...this.puzzle].map((e, i)=>{return html`<squaredle-square content="${e}" style="width:100%;" ?read_only=${this.read_only} disabled=${e==="\x09" ? "true" : "false"} data-x=${i % this.size} data-y=${Math.floor(i / this.size)}></squaredle-square>`})}
            </div>
        `
    }

    clickEvent(e) {
        alert("clicked")
        this.element.parentElement.dispatchEvent(new SubmitEvent());
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
}

class PuzzleSquare extends LitElement{
    static get properties(){
        return {
            content: {type: String},
            disabled: {type: Boolean},
            read_only: {type: Boolean},
            marked: {type: Boolean}
        }
    }

    constructor(){
        super()
        this.content = " "
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
        this.disabled = this.getAttribute("disabled") === "true"
        this.oncontextmenu = (e)=>{this._handle_contextmenu(e)}
        return html`<div id="container" disabled=${this.disabled ? "true" : "false"}><div class="squareCircle"></div><input maxlength="1" value=${this.content.trim()} ?disabled=${this.read_only} @change=${this.handle_change} @keyup=${this.handle_change}></div>`
    }

    handle_change(e){
        this.content = this.input.value
        this.disabled = this.getAttribute("disabled") === "true"
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

