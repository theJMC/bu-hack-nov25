import string
import random
from handlers.ws_con import ConnectionManager as ConMan


class GameManager:
    def __init__(self):
        self.active_games: list[Game] = []

    async def create_game(self):
        # pick a random game id
        game_id = ''.join(random.choice(string.ascii_lowercase) for _ in range(4))
        new_game = Game(game_id)
        self.active_games.append(new_game)
        return new_game.game_id

    async def get_game(self, game_id: str):
        for game in self.active_games:
            if game.game_id == game_id:
                return game
        return None

    async def list_games(self):
        return self.active_games


class Game:
    def __init__(self, game_id: str):
        self.game_id = game_id
        self.name = "test123"
        self.ConMan = ConMan()

    def get_players(self):
        return self.ConMan.active_connections

    def __str__(self):
        return f"Game ID: {self.game_id}, Players: {self.players}, Name: {self.name}"

    def __repr__(self):
        return f"<Game ID: {self.game_id}, Players: {self.players}, Name: {self.name}>"



