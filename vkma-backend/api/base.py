# -*- coding: utf-8 -*-
from aiohttp import web
from utils import Logger
import json

logger = Logger("API")


class BaseHandler:
    def __init__(self, request):
        self.database = request.app.database
        self.method = request.data.method
        self.data = request.data
        self.user = request.user
        self.request = request
        self.logger = logger

    @staticmethod
    def _response(data, jsonify=True):
        resp = web.Response(body=(json.dumps(data)) if jsonify else data)
        resp.headers['Access-Control-Allow-Origin'] = '*'
        resp.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        resp.headers['Content-Type'] = 'application/json'
        return resp

    def response(self, message=None, jsonify=True, **kwargs):
        kwargs.update({'success': True})
        if message:
            kwargs.update({"message": message})
        return self._response(kwargs) if jsonify else self._response(message, False)

    def reject(self, message=None, code=0, **kwargs):
        response = {'success': False, 'code': code}
        response.update(kwargs)
        if message:
            response.update({'message': message})
        return self._response(response)

    def unknown_method(self):
        return self.reject('Unknown Method Passed', 404)
