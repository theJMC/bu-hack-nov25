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
async def get():
    """ Send the pure HTML to the client """
    with open("templates/chat.html") as f:
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

@app.websocket("/ws/{game_id}/{name}")
async def websocket_endpoint(websocket: WebSocket, game_id: str, name: str):
    curr_game = await GameMan.get_game(game_id)
    try:
        ConMan = curr_game.ConMan
    except AttributeError:
        await websocket.accept()
        await websocket.send_text("Game not found")
        await websocket.close()
        return
    await ConMan.connect(websocket, name)
    await ConMan.broadcast(f"Client {name} joined the chat")
    try:
        while True:
            data = await websocket.receive_text()
            await ConMan.send_personal_message(f"You wrote: {data}", websocket)
            await ConMan.broadcast(f"Client {name} says: {data}")
    except WebSocketDisconnect:
        ConMan.disconnect(websocket)
        await ConMan.broadcast(f"Client {name} left the chat")



## Games
@app.get("/game/new")
async def new_game():
    game_id = await GameMan.create_game()
    return {"game_id": game_id}

@app.get("/game/{game_id}")
async def get_game(game_id: str):
    game = await GameMan.get_game(game_id)
    return {"game_id": game.game_id, "name": game.name}

@app.get("/game")
async def list_games():
    games = await GameMan.list_games()
    return games