debugger
self.addEventListener("push", event => {
    let payload = event.data ? event.data.json() : {};

    event.waitUntil(
        self.registration.showNotifications("Socket Playground", {
            body: payload
        })
    );
});
