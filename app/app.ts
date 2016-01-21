import 'reflect-metadata';
import 'rxjs/add/operator/map';
import {nativeScriptBootstrap} from 'nativescript-angular/application';
import {TextView} from 'ui/text-view';
import {topmost} from 'ui/frame';
import {ScrollView} from 'ui/scroll-view';
import {Inject, Component, View, provide, OnInit} from 'angular2/core';
import {NgIf, NgFor} from 'angular2/common';
import {Http, HTTP_PROVIDERS} from 'angular2/http';
import {Login} from './access/login';
import {BackendService} from './access/backend.service';

@Component({
    selector: 'app',
    providers: [
        HTTP_PROVIDERS,
        BackendService
    ],
    directives: [
        NgIf,
        NgFor,
        Login
    ],
    template: `
        <ScrollView>
        <StackLayout orientation='vertical'>
            <login *ngIf="route === 'login'"
                (on-login)="list()">
            </login>
        </StackLayout>
        </ScrollView>
    `
})
class App implements OnInit {

    route: string;

    constructor(
        private backendService: BackendService
    ) {
        this.route = 'login';
    }

    ngOnInit() {
        this.backendService.serverAddress = 'http://localhost:8080';
    }
    list() {
        console.log('list');
    }
}

export function pageLoaded(args) {
    var page = args.object;
    page.bindingContext = "";

    nativeScriptBootstrap(App, []).then((appRef) => {
    }, (err) =>{
        let errorMessage = err.message + "\n\n" + err.stack;
        console.error(errorMessage);

        let view = new TextView();
        view.text = errorMessage;
        topmost().currentPage.content = view;
    });
}
