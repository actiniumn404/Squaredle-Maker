import logging
import textwrap

from nltk.corpus import words
from flask import Flask, send_file, request, jsonify

words_list = set(words.words())
app = Flask("Squaredle Solver")
logging.getLogger("werkzeug").setLevel(40)


def dfs(visited, row, col, grid, curWord, res):
    if len(curWord) >= 4 and curWord in words_list:
        res.append(curWord)
        print(curWord)

    visited[col][row] = True

    for plus_row, plus_col in [(-1, 1), (-1, 0), (-1, -1), (0, -1), (1, -1), (1, 0), (1, 1), (0, 1)]:
        new_row = row + plus_row
        new_col = col + plus_col
        if 0 <= new_row < len(grid) and 0 <= new_col < len(grid) and not visited[new_col][new_row]:
            dfs(visited, new_row, new_col, grid, curWord + grid[new_col][new_row], res)

    visited[col][row] = False

    return res


@app.route("/")
def page_home():
    return open("index.html", "r").read()


@app.route('/<path:path>')
def page_any(path):
    return open(path, "r").read(), 200, {'Content-Type': f'text/{path.split(".")[-1]}; charset=utf-8'}


@app.route('/assets/<path:path>')
def page_asset(path):
    return send_file(f"assets/{path}")


@app.route('/api/solve')
def solve():
    size = request.args.get("size")
    grid = request.args.get("grid")

    if not size:
        return jsonify({"error": "Missing required parameter: size"})
    if not grid:
        return jsonify({"error": "Missing required parameter: grid"})
    if not size.isnumeric():
        return jsonify({"error": "Size is not a number"})
    size = int(size)
    if not (3 <= size <= 5):
        return jsonify({"error": "Size must be between 3 and 5"})
    if len(grid) != size * size:
        return jsonify({"error": "Grid is not the declared size"})

    grid = list(map(lambda x: list(x.lower()), textwrap.wrap(grid, size)))
    print(grid)
    res = []

    for r in range(size):
        for c in range(size):
            res.extend(dfs(
                [[False for _ in range(size)] for _ in range(size)],
                r,
                c,
                grid,
                grid[c][r],
                [])
            )
    print(res)

    return jsonify(res)


app.run("0.0.0.0", port=8080)
