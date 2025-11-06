function newMsg(msgContent) {
    const messages = document.getElementById('messages');
    const message = document.createElement('li');
    const content = document.createTextNode(msgContent);
    message.appendChild(content)
    messages.appendChild(message)
}

window.onload = () => {
    //const hostname = 'james-mbp-16.atlas-scoville.ts.net';
    const hostname = window.location.hostname;
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
                        switch (event.action.toLowerCase()) {
                            case "jump":
                                jumpPlayer(event["playerNum"])
                                break;
                            case "slide":
                                slidePlayer(event["playerNum"])
                                break;
                            case "shake":
                                clamberPlayer(event["playerNum"])
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