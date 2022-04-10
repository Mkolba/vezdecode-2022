# -*- coding: utf-8 -*-

from traceback import format_exc
from utils import BetterDict
from random import choice, shuffle
from aiohttp import web
import asyncio
import json


class Socket:
    def __init__(self, sock, id, lobby):
        self.lobby = lobby
        self.sock = sock
        self.id = id

    async def send(self, event_type, **kwargs):
        kwargs.update({'type': event_type})
        await self.sock.send_json(kwargs)


class WSHandler(web.View):
    async def get(self):
        sock = web.WebSocketResponse(heartbeat=1.0)
        await sock.prepare(self.request)
        app = self.request.app
        socket = Socket(sock, self.request.user.id, int(self.request.data.lobby))

        try:
            if socket.lobby not in app.lobbies:
                if socket.lobby == socket.id:
                    app.lobbies.update({socket.id: {
                        "players": {socket.id: {'socket': socket, 'role': '', 'name': self.request.data.name, 'ava': self.request.data.avatar}},
                        "is_started": False,
                        "is_finished": False,
                        "timer": None,
                        "location": "",
                        "time_left": None
                    }})
                else:
                    return await sock.close(code=2400)

            elif socket.id in app.lobbies[socket.lobby]['players']:
                await app.lobbies[socket.lobby]['players'][socket.id]['socket'].sock.close()
                app.lobbies[socket.lobby]['players'][socket.id]['name'] = self.request.data.name
                app.lobbies[socket.lobby]['players'][socket.id]['socket'] = socket

            elif app.lobbies[socket.lobby]['is_started'] or app.lobbies[socket.lobby]['timer']:
                return await sock.close(code=2500)

            else:
                app.lobbies[socket.lobby]['players'].update({socket.id: {'socket': socket, 'role': '', 'name': self.request.data.name, 'ava': self.request.data.avatar}})

            await self.broadcast('join', socket.id, socket.lobby, user={
                socket.id: {'name': self.request.data.name, 'ava': self.request.data.avatar}
            })

            lobby = app.lobbies[socket.lobby]
            location = lobby['location'] if (lobby['location'] and not lobby['is_finished'] and lobby['players'][socket.id]['role'] != 'spy') else ''
            players = {k: {'name': v['name'], 'ava': v['ava'], 'role': v['role'] if lobby['is_finished'] else ''} for k, v in lobby['players'].items()}

            await socket.send(
                'connected', timeLeft=lobby['time_left'] or 0, lobby=dict(players=players, is_owner=socket.lobby == socket.id),
                isGameStarted=lobby['is_started'], isGameFinished=lobby['is_finished'],
                timer=lobby['time_left'] != None and not lobby['is_finished'],
                myRole=lobby['players'][socket.id]['role'],
                location=location
            )

            async for event in sock:
                try:
                    event = BetterDict(json.loads(event.data))

                    if socket.id == socket.lobby:
                        if event.type == 'shuffle' and not app.lobbies[socket.lobby]['is_started']:
                            if len(app.lobbies[socket.lobby]['players']) >= 3:
                                roles, location = self.get_roles_and_location(len(app.lobbies[socket.lobby]['players']))
                                app.lobbies[socket.id]['time_left'] = len(app.lobbies[socket.lobby]['players']) * 60
                                app.lobbies[socket.lobby]['location'] = location

                                for index, item in enumerate(app.lobbies[socket.lobby]['players'].keys()):
                                    user = app.lobbies[socket.lobby]['players'][item]

                                    app.lobbies[socket.id]['players'][item]['role'] = roles[index]
                                    await user['socket'].send('shuffled', role=roles[index], timeLeft=app.lobbies[socket.id]['time_left'], location=location if roles[index] != 'spy' else '-')

                            else:
                                await socket.send('error', message='Недостаточно игроков в лобби (нужно как минимум 3)')

                        elif event.type == 'start':
                            if len(app.lobbies[socket.lobby]['players']) >= 3:
                                app.lobbies[socket.lobby]['is_started'] = True
                                timer = asyncio.create_task(self.timer(socket.lobby))
                                app.lobbies[socket.lobby]['timer'] = timer
                                await self.broadcast('start', None, socket.lobby, timeLeft=app.lobbies[socket.id]['time_left'])
                            else:
                                await socket.send('error', message='Недостаточно игроков в лобби (нужно как минимум 3)')

                        elif event.type == 'stop' and app.lobbies[socket.lobby]['is_started']:
                            app.lobbies[socket.lobby]['is_finished'] = True
                            app.lobbies[socket.lobby]['is_started'] = False
                            app.lobbies[socket.lobby]['time_left'] = 0

                            timer = app.lobbies[socket.lobby]['timer']
                            if timer and not timer.cancelled():
                                timer.cancel()

                            app.lobbies[socket.lobby]['timer'] = None
                            players = {k: {'name': v['name'], 'ava': v['ava'], 'role': v['role']} for k, v in app.lobbies[socket.lobby]['players'].items()}
                            await self.broadcast(event.type, None, socket.lobby, timeLeft=0, players=players)

                        elif event.type == 'destruct':
                            timer = app.lobbies[socket.lobby]['timer']
                            if timer and not timer.cancelled():
                                timer.cancel()
                            await self.broadcast(event.type, None, socket.lobby)
                            del app.lobbies[socket.lobby]

                except:
                    await socket.send('error', code=500)
                    print(format_exc())

        except Exception as err:
            print(format_exc())

        finally:
            if socket.id in app.sockets:
                if app.lobbies[socket.lobby]['is_started'] or app.lobbies[socket.lobby]['is_finished']:
                    app.lobbies[socket.lobby]['players'][socket.id]['socket'] = None
                else:
                    self.request.app.lobbies[socket.lobby]['players'].pop(socket.id)

            await sock.close()
            await self.broadcast('disconnect', socket.id, socket.lobby, user=socket.id)

            if len(app.lobbies[socket.lobby]['players']) == 0:
                app.lobbies.pop(socket.lobby)

        return sock

    async def timer(self, lobby):
        while self.request.app.lobbies[lobby]['time_left'] > 0:
            self.request.app.lobbies[lobby]['time_left'] -= 1

            await self.broadcast('timer', None, lobby, timeLeft=self.request.app.lobbies[lobby]['time_left'])
            await asyncio.sleep(1)

    def get_roles_and_location(self, players):
        spies = 1 if players < 10 else 2
        cursor = self.request.app.db.cursor()
        cursor.execute('SELECT * FROM locations')
        location = choice([i[1] for i in cursor.fetchall()])
        roles = ['player'] * (players - spies) + ['spy'] * spies
        shuffle(roles)
        return roles, location

    async def broadcast(self, event_type, except_id, lobby, **kwargs):
        for id, client in self.request.app.lobbies[lobby]['players'].items():
            if id != except_id and client['socket'] and not client['socket'].sock.closed:
                await client['socket'].send(event_type, **kwargs)
