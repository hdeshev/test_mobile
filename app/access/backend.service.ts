import {Injectable} from 'angular2/core';
import {Http, Headers} from 'angular2/http';
import {Promise, PromiseWrapper} from 'angular2/src/facade/async';
import {isPresent} from 'angular2/src/facade/lang';

@Injectable()
class BackendService {

    constructor(
        private http: Http
        ) { }

    serverAddress: string;
    token: string;

    public flex<T>(name: string, action: string, args: {}, method?: string, serverAddress?: string): any {

        let methodName: string;

        if (isPresent(method)) {
            methodName = method;
        } else {
            methodName = 'post';
        }

        if (args === undefined || args === null) {
            args = {};
        }

        let deferred = PromiseWrapper.completer();

        let headers = new Headers();
        headers.append('Content-Type', 'application/json;charset=UTF-8');

        if (this.token !== null) {
            headers.append('Authorization', this.token);
        }

        let address: string = (serverAddress ? serverAddress : this.serverAddress) +
            '/api/' + name.toLowerCase() + '/' + action;

        let options: any = {
            headers: headers,
            method: methodName
        };

        switch(methodName) {
            case 'get':
                options.search = '';
            for (let arg in args) {
                options.search = options.search + arg + '=' + args[arg];
            }
            break;
            default:
                options.body = JSON.stringify(args);
        }

        this.http.request(address, options)
            .map(res => res.json())
            .subscribe(
                (data) => {
                    deferred.resolve(data);
                },
                (err) => {
                    deferred.reject(err);
                },
                () => console.log('Data returned')
            );

        return deferred.promise;
    }
}

export { BackendService };

