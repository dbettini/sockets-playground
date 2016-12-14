
function getPushNotificationConfig() {
    return navigator.serviceWorker.register("dist/serviceWorker.js")
        .then(registration => {
            return registration.pushManager.getSubscription()
                .then(subscription => {
                    if (subscription)
                        return subscription;
                    return registration.pushManager.subscribe({ userVisibleOnly: true });
                });
        })
        .then(subscription => {
            let rawKey = subscription.getKey ? subscription.getKey('p256dh') : '';
            let key = rawKey ? btoa(String.fromCharCode.apply(null, new Uint8Array(rawKey))) : '';
            let rawAuthSecret = subscription.getKey ? subscription.getKey('auth') : '';
            let authSecret = rawAuthSecret ?
                btoa(String.fromCharCode.apply(null, new Uint8Array(rawAuthSecret))) : '';

            let endpoint = subscription.endpoint;
            return { endpoint, key, authSecret };
        });
};

// vue app

let socket = null;
let nickname = '';

const JoinForm = Vue.component('join-form', {
    created() {
        fetch('/api/name')
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
                            @click="$event.target.select()"
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

            localStorage.setItem('nickname', name);
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
                    <li v-for="user in users" :class="{ me: isMe(user) }">{{ user.nick }}</li>
                </ul>
		    </div>
        </div>
    `,

    data() {
        return { users: [] }
    },

    methods: {
        isMe(user) {
            return user.nick === nickname;
        },

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
                    <li v-for="message in messages" class="message"
                        :class="[ message.type, { own: isOwnMessage(message) }]">

                        <span class="timestamp">{{ timestamp }}</span>
                        <span v-show="message.author" class="author">#{{ message.author }}: </span>
                        <span class="contents">{{ message.contents }}</span>
                    </li>
                </ul>
            </div>
        </div>
    `,

    data() {
        return { messages: [] }
    },

    computed: {
        timestamp() {
            return fecha.format(new Date(), "shortTime");
        }
    },

    methods: {
        isOwnMessage(message) {
            return message.author === nickname;
        },

        onSystemMessage(contents) {
            this.messages.push({
                type: 'system',
                contents
            });
        },

        onMessage(author, contents) {
            this.messages.push({
                type: 'user',
                author, contents
            });
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
                            ref="message"
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
            this.$refs.message.focus();
        },

        leaveChat() {
            localStorage.removeItem('nickname');
            nickname = null;

            socket.disconnect();
            socket = null;

            this.$router.push({ path: '/join' });
        }
    }
});

const router = new VueRouter({
    routes: [
        {
            path: '/join',
            component: JoinForm,
            beforeEnter: (from, to, next) => {
                nickname = localStorage.getItem('nickname');
                if (nickname) {
                    next({ path: '/chat' });
                    return;
                }

                next();
            }
        },
        {
            path: '/chat',
            component: ChatBox,
            beforeEnter: (from, to, next) => {
                nickname = localStorage.getItem('nickname');
                if (!nickname) {
                    next({ path: '/join' });
                    return;
                }

                getPushNotificationConfig()
                    .then(({ endpoint, key, authSecret }) => {
                        socket = io();
                        socket.emit('join', JSON.stringify({
                            name: nickname,
                            endpoint,
                            key,
                            authSecret
                        }));
                        next();
                    })
                    .catch(_ => next({ path: '/join' }));
            }
        },
        { path: '/*', redirect: '/join' }
    ]
});

new Vue({
    router,
    el: '#app'
});
