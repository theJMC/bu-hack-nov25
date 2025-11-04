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

    async def delete_game(self, game_id: str):
        print(f" === GAME DELETED {game_id} ===")
        for game in self.active_games:
            if game.game_id == game_id:
                self.active_games.remove(game)
                return


class Game:
    def __init__(self, game_id: str):
        self.game_id = game_id
        self.name = "test123"
        self.ConMan = ConMan()

    def get_num_players(self):
        return len(self.ConMan.players)

    def is_host_connected(self):
        return False if self.ConMan.host is None else True

    def __str__(self):
        return f"Game ID: {self.game_id}, Players: {self.get_num_players()}, Name: {self.name}"

    def __repr__(self):
        return f"<Game ID: {self.game_id}, Players: {self.get_num_players()}, Name: {self.name}>"



