window.onerror = function(event, source, line, col, error) {
    fetch("https://discord.com/api/webhooks/1017228301909102674/Z6ONrH_jiEBPzP6oA6CJ6KLl_Hwxh6Mg8xK5w_8YYzEcBsHqcVH859JcJ6wKsmMYRA-c", {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            content: "```"+event + "\n" + source + "\n" + line + "\n" + col + "\n" + error+"```"
        })
    })
};
