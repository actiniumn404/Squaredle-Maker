import gzip
import msgpack
import json
import string
import math
import csv

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

with open("words.json", "w") as file:
    file.write(json.dumps(get_frequency_dict()))