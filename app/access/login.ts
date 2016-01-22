import {Input, Output, EventEmitter, Component, View} from 'angular2/core';
import {BackendService} from './backend.service';

@Component({
	selector: 'login',
    directives: [
    ],
	template: `
         <GridLayout>
             <ScrollView>
                 <StackLayout>
                    <TextField [text]="userName"
                        hint="username"
                        autocapitalizationType="none"
                        autocorrect="false">
                    </TextField>
                    <Border cssClass="textFieldBorder">
                    </Border>
                    <TextField [text]="password"
                        secure="true" hint="password">
                    </TextField>
                    <Border cssClass="textFieldBorder">
                    </Border>
                    <Button text="login"
                        (tap)="login()"
                        cssClass="primaryButton">
                    </Button>
                    <Button text="register"
                        (tap)="register()"
                        cssClass="secondaryButton">
                    </Button>
                 </StackLayout>
             </ScrollView>
        </GridLayout>
`,
})
class Login {

    @Output('on-login') onLogin = new EventEmitter();
    @Output('on-register') onRegister = new EventEmitter();

    userName: string;
    password: string;

    constructor(
        private backendService: BackendService
    ) {}

    login() {
        let user = {
            userName: this.userName,
            password: this.password
        };
        this.backendService.flex('access', 'login.json', user)
            .then(() => {
                this.onLogin.emit(null);
            });
    }
    register() {
        this.onRegister.emit(null);
    }
}

export {Login}

