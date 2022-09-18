// Base 64 encoding
const awkward_words = new Set([
    "YW51cw==",
    "YXNzaG9sZQ==",
    "YmFsbHNhY2s=",
    "Ymxvd2pvYg==",
    "Ym9uZXI=",
    "YnV0dG11bmNo",
    "YnV0dHBsdWc=",
    "Y2xpdA==",
    "Y29jaw==",
    "Y29uZG9t",
    "Y3VtbWVy",
    "Y3VtbWluZw==",
    "Y3Vtcw==",
    "Y3Vtc2hvdA==",
    "Y3VuaWxpbmd1cw==",
    "Y3VuaWxsaW5ndXM=",
    "Y3VubmlsaW5ndXM=",
    "Y3VudA==",
    "ZGljaw==",
    "ZGlsZG8=",
    "ZG91Y2hl",
    "ZWphY3VsYXRl",
    "ZWphY3VsYXRpbmcg",
    "ZWphY3VsYXRpb24=",
    "ZXJvdGlj",
    "ZmFnZ2luZw==",
    "ZmFnZ290",
    "ZmFncw==",
    "ZmVsbGF0ZQ==",
    "ZmVsbGF0aW8=",
    "ZnJvdA==",
    "ZnVjaw==",
    "ZnVkZ2VwYWNrZXI=",
    "Z2FuZ2Jhbmc=",
    "Z2F5bG9yZA==",
    "Z2F5c2V4",
    "aGFyZWxpcA==",
    "aG9ybmllc3Q=",
    "aG9ybnk=",
    "amFja29mZg==",
    "amVya29mZiA=",
    "amlzbQ==",
    "aml6bSA=",
    "aml6eg==",
    "a25vYmhlYWQ=",
    "a25vYmpvY2t5",
    "bHluY2g=",
    "bWFzdHVyYmF0ZQ==",
    "bWFzdHVyYmF0aW9u",
    "bmlnZ2E=",
    "bmlnZ2Vy",
    "b3JnYXNt",
    "cGVuaXM=",
    "cGlzcw==",
    "cG9ybg==",
    "cHVzc2llcw==",
    "cHVzc3k=",
    "cmFwZQ==",
    "c2VtZW4=",
    "c2xhdmU=",
    "c2x1dA==",
    "c21lZ21h",
    "c3Blcm0=",
    "dGVzdGljbGU=",
    "dGl0dGllZnVja2Vy",
    "dGl0dGllcw==",
    "dmFnaW5h",
    "dmlhZ3Jh",
    "dnVsdmE=",
    "d2FuZw==",
    "d2VuY2g=",
    "d2hvcmU=",
    "d2lsbHk=",
    "eHJhdGVk"
])

function TrieNode(key) {
    // the "key" value will be the character in sequence
    this.key = key;

    // we keep a reference to parent
    this.parent = null;

    // we have hash of children
    this.children = {};

    // check to see if the node is at the end
    this.end = false;
}

// iterates through the parents to get the word.
// time complexity: O(k), k = word length
TrieNode.prototype.getWord = function () {
    var output = [];
    var node = this;

    while (node !== null) {
        output.unshift(node.key);
        node = node.parent;
    }

    return output.join('');
};

// Trie.js - super simple JS implementation
// Credit to tpae
// https://gist.github.com/tpae/72e1c54471e88b689f85ad2b3940a8f0
// -----------------------------------------

// we implement Trie with just a simple root with null value.
function Trie() {
    this.root = new TrieNode(null);
}

// inserts a word into the trie.
// time complexity: O(k), k = word length
Trie.prototype.insert = function (word) {
    var node = this.root; // we start at the root 😬

    // for every character in the word
    for (var i = 0; i < word.length; i++) {
        // check to see if character node exists in children.
        if (!node.children[word[i]]) {
            // if it doesn't exist, we then create it.
            node.children[word[i]] = new TrieNode(word[i]);

            // we also assign the parent to the child node.
            node.children[word[i]].parent = node;
        }

        // proceed to the next depth in the trie.
        node = node.children[word[i]];

        // finally, we check to see if it's the last word.
        if (i == word.length - 1) {
            // if it is, we set the end flag to true.
            node.end = true;
        }
    }
};

// check if it contains a whole word.
// time complexity: O(k), k = word length
Trie.prototype.contains = function (word) {
    var node = this.root;

    // for every character in the word
    for (var i = 0; i < word.length; i++) {
        // check to see if character node exists in children.
        if (node.children[word[i]]) {
            // if it exists, proceed to the next depth of the trie.
            node = node.children[word[i]];
        } else {
            // doesn't exist, return false since it's not a valid word.
            return false;
        }
    }

    // we finished going through all the words, but is it a whole word?
    return node.end;
};

// returns every word with given prefix
// time complexity: O(p + n), p = prefix length, n = number of child paths
Trie.prototype.find = function (prefix) {
    var node = this.root;
    var output = [];

    // for every character in the prefix
    for (var i = 0; i < prefix.length; i++) {
        // make sure prefix actually has words
        if (node.children[prefix[i]]) {
            node = node.children[prefix[i]];
        } else {
            // there's none. just return it.
            return output;
        }
    }

    // recursively find all words in the node
    findAllWords(node, output);

    return output;
};

// recursive function to find all words in the given node.
function findAllWords(node, arr) {
    // base case, if node is at a word, push to output
    if (node.end) {
        arr.unshift(node.getWord());
    }

    // iterate through each children, call recursive findAllWords
    for (var child in node.children) {
        findAllWords(node.children[child], arr);
    }
}
