export const apiEndpoint = 'websocket.adawhite.ru/';
const url = 'https://' + apiEndpoint + 'api';

async function apiCall(method, params) {
    params['auth'] = window.location.search;
    let headers = {'Content-Type': 'application/json'};
    return fetch(`${url}?method=${method}`, { method: 'POST', body: JSON.stringify(params), headers: headers }).then(response => {
        if ([200, 503].includes(response.status)) {
            const contentType = response.headers.get('Content-Type') || '';
            if (contentType.includes('application/json')) {
                return response.json().catch(error => {
                    return Promise.reject('500');
                });
            }
        }
    }).catch(error => {
        return Promise.reject('404');
    });
}

export default apiCall;
