from nginx:latest
WORKDIR /usr/share/nginx/html
COPY main.js index.html websocket.js /usr/share/nginx/html/
COPY MapGen /usr/share/nginx/html/MapGen
COPY PlayerGen /usr/share/nginx/html/PlayerGen

EXPOSE 80

