function newMsg(msgContent) {
    const messages = document.getElementById('messages');
    const message = document.createElement('li');
    const content = document.createTextNode(msgContent);
    message.appendChild(content)
    messages.appendChild(message)
}

window.onload = () => {
    // Select Backend Server
    switch (window.location.hostname) {
        case "localhost":
            var hostname = localStorage.getItem("api-server") || `dash.bedbugz.uk`;
            break;
        case "dash.bedbugz.uk":
        case "remote.dash.bedbugz.uk":
        case "host.dash.bedbugz.uk":
            var hostname = `dash.bedbugz.uk`;
            break;
        default:
            var hostname = `${window.location.hostname}`;
    }

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
                console.log(event)
                // status code change
                switch (event["code"]) {
                    case 205: // Player Join
                        addPlayer(event["newPlayerNum"])
                        console.log(`Player ${event["newPlayerNum"]} joined the game.`)
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