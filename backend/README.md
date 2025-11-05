# NovHack Backend

## Endpoints
### `/` - Index
Does the stuff

### `/chat` - Game Page
is the game controller

### `/ws` - WebSocket Route
`/ws/{game_id}/{mode}`
Mode is either `player` or `host`

The first time you connect, you will recieve a dict with `code: 201`, the number of players, and the colour that your player is.