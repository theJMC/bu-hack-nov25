function newMsg(msgContent) {
    const messages = document.getElementById('messages');
    const message = document.createElement('li');
    const content = document.createTextNode(msgContent);
    message.appendChild(content)
    messages.appendChild(message)
}
function jump(playerNum) {
    console.log(`${playerNum} - Jump`)
}
function slide(playerNum) {
    console.log(`${playerNum} - Slide`)
}
function shake(playerNum) {
    console.log(`${playerNum} - Shake`)
}

window.onload = () => {
    const hostname = 'nov.bedbugz.uk';
    var req = new XMLHttpRequest();
    req.open("GET", `https://${hostname}/game/new`, true);
    req.send();
    req.onreadystatechange = function () {
        if (req.readyState == 4 && req.status == 200) {
            var game = JSON.parse(req.responseText);
            localStorage.setItem("game_code", game["game_id"]);
            document.getElementById("game-code").innerHTML = game["game_id"]
            var game_code = localStorage.getItem("game_code");
            console.log(game_code)
            var ws = new WebSocket(`wss://${hostname}/ws/${game_code}/host`);
            ws.onmessage = (e) => {
                const event = JSON.parse(e.data);
                // status code change
                switch (event["code"]) {
                    case 201: // Game Start
                        document.getElementById('player-number').innerText = msg["playerNum"]
                        break;
                    case 202: // Remote Event
                        switch (event.action) {
                            case "jump":
                                jump(event["playerNum"])
                                break;
                            case "slide":
                                slide(event["playerNum"])
                                break;
                            case "shake":
                                shake(event["playerNum"])
                                break;
                        }
                        break;
                    default:
                        newMsg(event["content"])
                }
            }
        }
    }

}