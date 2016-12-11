$(document).ready(() => {
    const socket = io();

    const $chat = $("#chat");
    const $name = $("#name");
    const $form = $("form");
    const $login = $("#login");
    const $msg = $("#msg");
    const $join = $("#join");
    const $msgs = $("#msgs");
    const $people = $("#people");
    const $send = $("#send");

    let ready = false;

    $chat.hide();
    $name.focus();
    $form.submit(event => event.preventDefault());

    const join = () => {
        var name = $name.val();
        if (name != "") {
            socket.emit("join", name);
            $login.detach();
            $chat.show();
            $msg.focus();
            ready = true;
        }
    };

    const appendMessage = (msg) => {
        if (ready)
            $msgs.append($("<li>").text(msg));
    };

    const appendPeople = (people) => {
        if (ready) {
            $people.empty();
            $.each(people, (clientId, name) => {
                $people.append($("<li>").text(name));
            });
        }
    }

    const sendMessage = () => {
        var msg = $msg.val();
        socket.emit("send", msg);
        $msg.val("");
        $msg.focus();
    };

    $join.click(join);

    $name.keypress((e) => {
        if (e.which == 13)
            join();
    });

    socket.on("update", appendMessage);

    socket.on("update-people", appendPeople);

    socket.on("send", (who, msg) => appendMessage(who + " says: " + msg));

    socket.on("disconnect", () => {
        appendMessage("The server is not available");
        $msgs.attr("disabled", "disabled");
        $send.attr("disabled", "disabled");
    });

    $send.click(sendMessage);

    $msg.keypress((e) => {
        if (e.which == 13)
            sendMessage();
    });

});