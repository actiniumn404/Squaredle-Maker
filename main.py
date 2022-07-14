import logging
from flask import Flask, send_file

app = Flask("Squaredle Solver")
logging.getLogger("werkzeug").setLevel(40)


@app.route("/")
def page_home():
    return open("index.html", "r").read()


@app.route('/<path:path>')
def page_any(path):
    return open(path, "r").read(), 200, {'Content-Type': f'text/{path.split(".")[-1]}; charset=utf-8'}


@app.route('/assets/<path:path>')
def page_asset(path):
    return send_file(f"assets/{path}")

app.run("0.0.0.0", port=8080)