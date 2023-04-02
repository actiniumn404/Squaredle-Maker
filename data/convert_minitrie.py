import gzip
import msgpack
import json
import string
import math
import csv

class Trie:
    def __init__(self, key: str, parent=None, end=False, freq=0):
        self.key = key
        self.parent = parent
        self.children = {}
        self.end = end
        self.freq = freq

    def repr(self, tab=1):
        res = self.key

        for child in self.children:
            res += "\n" + "\t" * tab + self.children[child].repr(tab+1)
        return res


def insert(word: str, cur: Trie, index=0):
    if index >= len(word):
        cur.end = True
        cur.freq = freq.get(word, 0)
        return
    char = word[index]
    if char not in cur.children:
        cur.children[char] = Trie(char, cur)
    insert(word, cur.children[char], index+1)


root = Trie("")

def get_frequency_list():
    with gzip.open("large_en.msgpack.gz", "rb") as infile:
        data = msgpack.load(infile, raw=False)
    header = data[0]
    if (
            not isinstance(header, dict)
            or header.get("format") != "cB"
            or header.get("version") != 1
    ):
        raise ValueError("Unexpected header: %r" % header)
    return data

def cB_to_freq(cB):
    return 10 ** (cB / 100)

allowed_characters = set(string.ascii_lowercase)
words = set(open("words_alpha.txt", "r").read().split("\n"))
names = set(next(csv.reader(open("names-short.csv"))))

def get_frequency_dict():
    freqs = {}
    pack = get_frequency_list()
    for index, bucket in enumerate(pack):
        freq = cB_to_freq(-index)
        for word in bucket:
            if len(word) <= 3 or any([char not in allowed_characters for char in word]):
                continue
            freqs[word] = round(math.log(freq, 10) + 9, 2)
    res = {}
    for word in words:
        if len(word) <= 3 or any([char not in allowed_characters for char in word]) or word in names:
            continue
        res[word] = freqs.get(word, 0)
    return res

freq = get_frequency_dict()

for word in freq:
    insert(word, root)

# Condense
res = ""
def condense(cur: Trie):
    global res

    res += cur.key
    if cur.end:
        res += str(cur.freq)
    if not cur.children:
        return 1
    seen = 0
    for child in cur.children:
        seen += 1
        up = condense(cur.children[child])
        if seen == len(cur.children):
            return up + 1
        else:
            res += "-" + str(up)

condense(root)

with open("words.txt", "w") as file:
    file.write(res)