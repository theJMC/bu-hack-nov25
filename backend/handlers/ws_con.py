from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        # tuple(name, websocket, is_host)
        self.active_connections: list[tuple[str, WebSocket, bool]] = []

    async def connect(self, websocket: WebSocket, name: str):
        await websocket.accept()
        self.active_connections.append((name, websocket, name == "Host"))

    def disconnect(self, websocket: WebSocket):
        for conn in self.active_connections:
            if conn[1] == websocket:
                self.active_connections.remove(conn)
                return

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection[1].send_text(message)

