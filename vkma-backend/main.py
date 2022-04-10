# -*- coding: utf-8 -*-

from api import request_user_middleware, WSHandler, APIHandler
from aiohttp import web, ClientSession
from utils.logger import Logger
import asyncio
import config
import sqlite3


logger = Logger("SERVER")


def get_database():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()

    try:
        cursor.execute('CREATE TABLE locations (id INTEGER PRIMARY KEY, name TEXT NOT NULL)')
        for item in config.locations:
            cursor.execute('INSERT INTO locations (name) VALUES (?)', [item])
        conn.commit()
    except sqlite3.OperationalError as err:
        pass

    return conn


async def create_app(loop):
    app = web.Application(middlewares=[request_user_middleware])
    app.session = ClientSession()
    app.event_loop = loop
    app.sockets = {}
    app.lobbies = {}

    app.db = get_database()

    app.router.add_route(method='GET', path='/ws', handler=WSHandler)
    app.router.add_route(method='POST', path='/api', handler=APIHandler)

    # Starting server
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, port=config.port, host=config.host)
    return app, site


if __name__ == '__main__':

    loop = asyncio.get_event_loop()
    app, site = loop.run_until_complete(create_app(loop))
    loop.create_task(site.start())

    try:
        logger.ok('Сервер запущен')
        loop.run_forever()
    except KeyboardInterrupt:
        logger.critical('Сервер принудительно остановлен')
