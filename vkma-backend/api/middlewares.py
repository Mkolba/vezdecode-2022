# -*- coding: utf-8 -*-

from urllib.parse import urlparse, parse_qsl, urlencode
from utils import BetterDict, Logger
from collections import OrderedDict
from traceback import format_exc
from base64 import b64encode
from hashlib import sha256
from hmac import HMAC
from aiohttp import web
import config
import json


logger = Logger("API")


async def request_user_middleware(app, handler):
    def get_url_query(url):
        query = dict(parse_qsl(urlparse(url).query, keep_blank_values=True))
        for k, v in query.items():
            if k == '?vk_access_token_settings':
                query.update({'vk_access_token_settings': v})
                break
        auth = OrderedDict(sorted(x for x in query.items() if x[0][:3] == "vk_"))
        for key in query.copy().keys():
            if key[:3] == "vk_":
                query.pop(key)
        data = {'auth': BetterDict({'subset': auth, 'sign': query.get('sign', None)})}
        query.pop('sign', None)
        data.update(query)
        return BetterDict(data)

    def is_valid(auth):
        hash_code = b64encode(HMAC(config.app_secret.encode(), urlencode(auth['subset'], doseq=True).encode(), sha256).digest())
        decoded_hash_code = hash_code.decode('utf-8')[:-1].replace('+', '-').replace('/', '_')
        if auth["sign"] == decoded_hash_code:
            return True
        else:
            return False

    def reject(message=None):
        resp = web.Response(body=json.dumps({'success': False, 'message': message or 'authorization failed'}))
        resp.headers['Access-Control-Allow-Origin'] = '*'
        resp.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        resp.headers['Content-Type'] = 'application/json'
        return resp

    async def middleware(request):
        try:
            if request.method == 'POST':
                content_type = request.headers.get('Content-Type', '')
                if 'application/json' in content_type:
                    request.data = get_url_query(str(request.url))
                    request.data.update(BetterDict.loads(await request.text()))
                    if 'auth' in request.data:
                        try:
                            request.data.update(get_url_query(request.data.auth))
                        except TypeError:
                            return reject('Authorization failed')
                    else:
                        return reject('Authorization failed')
                else:
                    return reject('Unsupported Content-Type')
            elif request.method == 'GET':
                request.data = get_url_query(str(request.url))
            else:
                return reject('Unsupported Method')
        except json.decoder.JSONDecodeError:
            return reject('You`ve passed invalid json data')

        try:
            if is_valid(request.data.auth):
                user_id = int(request.data.auth['subset']['vk_user_id'])
                user = BetterDict({"id": user_id})
                request.user = user
                print(request.data)
                return await handler(request)
            else:
                return reject('Authorization failed')
        except Exception as err:
            if 'Not Found' not in str(err):
                logger.critical(format_exc(), request.url)
            return reject(message='Internal server error')

    return middleware
