# -*- coding: utf-8 -*-

from .base import BaseHandler
from aiohttp import web


class APIHandler(web.View, BaseHandler):
    async def post(self):
        if self.request.data.method:
            method = self.request.data.method
            if method == 'locations.get':
                cursor = self.request.app.db.cursor()
                cursor.execute('SELECT * FROM locations')
                return self.response(locations=[{'id': i[0], 'name': i[1]} for i in cursor.fetchall()])

            elif method == 'locations.create':
                cursor = self.request.app.db.cursor()
                cursor.execute('INSERT INTO locations (name) VALUES (?)', [self.request.data.name])
                self.request.app.db.commit()
                return self.response(location={'name': self.request.data.name, 'id': cursor.lastrowid})

            elif method == 'locations.remove':
                cursor = self.request.app.db.cursor()
                cursor.execute('DELETE FROM locations WHERE id=?', [self.request.data.id])
                self.request.app.db.commit()
                return self.response()

        else:
            return self.reject('Method is not passed', 404, log_data=self.request.data.method or ' ')

