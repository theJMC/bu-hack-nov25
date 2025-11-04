import json

from fastapi import WebSocket

player_colours: list[str] = [
    "Blue",
    "BlueViolet",
    "Crimson",
    "DarkGoldenRod"
]

class ConnectionManager:
    def __init__(self):
        # tuple(name, websocket, is_host)
        # self.active_connections: list[tuple[str, WebSocket, bool]] = []
        self.players: list[WebSocket] = []
        self.host: WebSocket | None = None

    async def connect(self, websocket: WebSocket, is_host: bool):
        await websocket.accept()
        if is_host:
            self.host = websocket
            return 0
        else:
            self.players.append(websocket)
            playerNum = len(self.players)
            await self.send_personal_message({"code": 201, "playerNum": playerNum,
                                              "colour": player_colours[playerNum]}, websocket)
            return len(self.players)

    def disconnect_player(self, websocket: WebSocket):
        for player in self.players:
            if player == websocket:
                self.players.remove(player)
                return

    async def disconnect_host(self):
        self.host = None
        await self.broadcast({"code": 200, "content": "Host disconnected. The Game is now over"})
        self.players.clear()


    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)

    async def send_host_message(self, message: dict):
        await self.host.send_json(message)

    async def broadcast(self, message: dict):
        for player in self.players:
            await player.send_json(message)
        if self.host is not None:
            await self.host.send_json(message)
