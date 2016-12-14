debugger
self.addEventListener("push", event => {
    let payload = event.data ? event.data.text() : {};

    event.waitUntil(
        self.registration.showNotifications("Socket Playground", {
            body: payload
        })
    );
});
