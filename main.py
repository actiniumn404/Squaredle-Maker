import logging
import textwrap
import requests

from flask import Flask, send_file, request, jsonify
from wordfreq import zipf_frequency

words_list = requests.get("https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt").text.split("\r\n")
app = Flask("Squaredle Solver")
logging.getLogger("werkzeug").setLevel(40)



def dfs(visited: list, row: int, col: int, target: str, grid: list, curWord: str, res: list):
    if len(curWord) > len(target) or not target.startswith(curWord):
        return False
    if curWord == target:
        return True

    visited[col][row] = True

    for plus_row, plus_col in [(-1, 1), (-1, 0), (-1, -1), (0, -1), (1, -1), (1, 0), (1, 1), (0, 1)]:
        new_row = row + plus_row
        new_col = col + plus_col
        if 0 <= new_row < len(grid) and 0 <= new_col < len(grid) and not visited[new_col][new_row]:
            stop = dfs(visited, new_row, new_col, target, grid, curWord + grid[new_col][new_row], res)
            if stop:
                return True

    visited[col][row] = False

    return False


@app.route("/")
def page_home():
    return open("index.html", "r").read()


@app.route("/favicon.ico")
def favicon():
    return send_file(f"assets/logo.png")


@app.route('/<path:path>')
def page_any(path):
    try:
        return open(path, "r").read(), 200, {'Content-Type': f'text/{path.split(".")[-1]}; charset=utf-8'}
    except FileNotFoundError:
        return jsonify({"error": "FIle not found"})


@app.route('/assets/<path:path>')
def page_asset(path):
    return send_file(f"assets/{path}")


@app.route('/api/solve')
def solve():
    size = request.args.get("size")
    orig_grid = request.args.get("grid")

    if not size:
        return jsonify({"error": "Missing required parameter: size"})
    if not orig_grid:
        return jsonify({"error": "Missing required parameter: grid"})
    if not size.isnumeric():
        return jsonify({"error": "Size is not a number"})
    size = int(size)
    if not (3 <= size <= 10):
        return jsonify({"error": "Size must be between 3 and 5"})
    if len(orig_grid) != size * size:
        return jsonify({"error": "Grid is not the declared size"})

    grid = list(map(lambda x: list(x.lower()), textwrap.wrap(orig_grid, size)))
    res = {}
    coords = {}

    for col in range(size):
        for row in range(size):
            coords[grid[col][row]] = coords.get(grid[col][row], []) + [(col, row)]

    for word in words_list:
        if len(word) <= 3:
            continue
        for c, r in coords.get(word[0], []):
            result = dfs(
                [[False for _ in range(size)] for _ in range(size)],
                r,
                c,
                word,
                grid,
                grid[c][r],
                res)

            if result and result not in res.get(len(word), []):
                res[len(word)] = res.get(len(word), []) + [[word, zipf_frequency(word, lang="en")]]

    return jsonify(res)
