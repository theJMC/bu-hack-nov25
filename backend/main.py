import json

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from handlers.game import GameManager, Game

app = FastAPI()
GameMan = GameManager()


@app.get("/")
async def get():
    """ Send the pure HTML to the client """
    with open("templates/index.html") as f:
        return HTMLResponse(f.read())


@app.get("/chat")
async def get_chat():
    """ Send the pure HTML to the client """
    with open("templates/game.html") as f:
        return HTMLResponse(f.read())


@app.get("/host")
async def host_page():
    with open("templates/host.html") as f:
        return HTMLResponse(f.read())


@app.get("/admin")
async def admin_page():
    """ Send the pure HTML to the client """
    with open("templates/admin.html") as f:
        return HTMLResponse(f.read())


@app.websocket("/ws/{game_id}/{mode}")
async def websocket_endpoint(websocket: WebSocket, game_id: str, mode: str | None = None):
    curr_game = await GameMan.get_game(game_id)
    if mode == "host":
        if curr_game.is_host_connected():
            await websocket.accept()
            await websocket.send_json({"code": 400, "content": "Host already connected"})
            await websocket.close()
            print("=== HOST ALREADY CONNECTED ===")
            return
        is_host = True
    else:
        # Therefore is Player
        is_host = False
    try:
        ConMan = curr_game.ConMan
    except AttributeError:
        await websocket.accept()
        await websocket.send_json({"code": 404, "content": "Game not found"})
        await websocket.close()
        print("=== GAME NOT FOUND ===")
        return
    playerNum = await ConMan.connect(websocket, is_host)
    if playerNum is None:
        await ConMan.broadcast({"code": 200, "content": "A player tried to join this full game"})
        return
    if is_host:
        await ConMan.broadcast({"code": 200, "content": "Host joined the game"})
    else:
        await ConMan.broadcast({"code": 200, "content": f"Player {playerNum} joined the game"})
    try:
        while True:
            data = json.loads(await websocket.receive_text())
            # data["code"] = 202
            data["playerNum"] = playerNum
            print(data)
            await ConMan.broadcast(data)
    except WebSocketDisconnect:
        if is_host:
            await ConMan.disconnect_host()
            await GameMan.delete_game(game_id)
        else:
            ConMan.disconnect_player(websocket)
            await ConMan.broadcast({"code": 200, "content": f"Player {playerNum} left the chat"})


## Games
@app.get("/game/new")
async def new_game():
    game_id = await GameMan.create_game()
    return {"game_id": game_id}


@app.get("/game/{game_id}")
async def get_game(game_id: str):
    game = await GameMan.get_game(game_id)
    return {"game_id": game.game_id, "name": game.name}


@app.delete("/game/{game_id}")
async def delete_game(game_id: str):
    game = await GameMan.get_game(game_id)
    await game.ConMan.broadcast({"code": 404, "content": "The Game has been Closed!"})
    await GameMan.delete_game(game_id)
    return {"game_id": game_id}


@app.get("/game")
async def list_games():
    games = await GameMan.list_games()
    return games
