from fastapi import WebSocket


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
            return len(self.players)

    def disconnect_player(self, websocket: WebSocket):
        for player in self.players:
            if player == websocket:
                self.players.remove(player)
                return

    async def disconnect_host(self):
        self.host = None
        await self.broadcast("Host disconnected. The Game is now over")
        self.players.clear()


    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def send_host_message(self, message: str):
        await self.host.send_text(message)

    async def broadcast(self, message: str):
        for player in self.players:
            await player.send_text(message)
        if self.host is not None:
            await self.host.send_text(message)
