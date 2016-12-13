const socket = io();
let nickname = '';

const JoinForm = Vue.component('join-form', {
    created() {
        fetch('/name')
            .then(resp => resp.json())
            .then(({ name }) => {
                this.name = name;
                this.disabled = false;
            })
            .catch(_ => this.disabled = false);
    },

    template: `
        <div class="container">
            <div class="row">
                <div class="span5 offset2">
                    <form
                        class="form-inline"
                        @submit.prevent>

                        <input
                            type="text"
                            class="input-small"
                            placeholder="Your name"
                            v-model="name"
                            :disabled="disabled"
                            @keyup.enter="join">
                        <input
                            type="button"
                            class="btn btn-primary"
                            name="join"
                            value="Join"
                            :disabled="disabled"
                            @click="join">
                    </form>
                </div>
            </div>
        </div>
    `,

    data() {
        return {
            name: '',
            disabled: true
        }
    },

    methods: {
        join() {
            let name = this.name;
            if (!name) return;

            nickname = name;
            socket.emit('join', name);
            this.$router.push({ path: '/chat' });
        }
    }
});

Vue.component('user-list', {
    created() {
        socket.on('update-people', sessions => this.updateUsers(sessions));
    },

    template: `
        <div class="row">
            <div>People</div>
		    <div class="span2">
		    	<ul id="people">
                    <li v-for="user in users">{{ user.nick }}</li>
                </ul>
		    </div>
        </div>
    `,

    data() {
        return { users: [] }
    },

    methods: {
        updateUsers(sessions) {
            this.users = Object.keys(sessions).map(sessionId => {
                let nick = sessions[sessionId];
                return { nick, sessionId };
            });
        }
    }
});

Vue.component('message-list', {
    created() {
        socket.on('update', msg => this.onSystemMessage(msg));
        socket.on('send', (author, msg) => this.onMessage(author, msg));
    },

    template: `
        <div class="row">
            <div>Chat</div>
            <div class="span4">
                <ul id="messages">
                    <li v-for="message in messages">{{ message }}</li>
                </ul>
            </div>
        </div>
    `,

    data() {
        return { messages: [] }
    },

    methods: {
        onSystemMessage(msg) {
            this.messages.push(msg);
        },

        onMessage(author, msg) {
            this.messages.push(`${ author } says: ${ msg }`);
        }
    }
});

const ChatBox = Vue.component('chat-box', {
    template: `
        <div class="container">
            <user-list></user-list>
            <message-list></message-list>

            <div class="row">
                <div class="span5 offset2">
                    <form
                        class="form-inline"
                        @submit.prevent>

                        <input
                            type="text"
                            class="input"
                            placeholder="Your message"
                            v-model="message"
                            @keyup.enter="sendMessage">
                        <input
                            type="button"
                            name="send"
                            value="Send"
                            class="btn btn-success"
                            @click="sendMessage">
                        <input
                            type="button"
                            name="leave"
                            value="Leave"
                            class="btn btn-default"
                            @click="leaveChat">
                    </form>
                </div>
            </div>
        </div>
    `,

    data() {
        return { message: '' }
    },

    methods: {
        sendMessage() {
            let message = this.message;
            if (!message) return;

            socket.emit("send", message);
            this.message = '';
        },

        leaveChat() {
            socket.disconnect();
            socket.connect();
            this.$router.push({ path: '/join' });
        }
    }
});

const router = new VueRouter({
  routes: [
    { path: '/join', component: JoinForm },
    {
        path: '/chat',
        component: ChatBox,
        beforeEnter: (from, to, next) => {
            if (!nickname) next({ path: '/join' });
            next();
        }
    },
    { path: '/*', redirect: '/join' }
  ]
});

new Vue({
    router,
    el: '#app'
});
