(function() {
    document.addEventListener("contextmenu", function(e) {
        e.preventDefault();
        return false;
    });

    document.addEventListener("keydown", function(e) {
        if (e.keyCode === 123) { e.preventDefault(); return false; }
        if (e.ctrlKey && e.shiftKey && e.keyCode === 73) { e.preventDefault(); return false; }
        if (e.ctrlKey && e.shiftKey && e.keyCode === 74) { e.preventDefault(); return false; }
        if (e.ctrlKey && e.shiftKey && e.keyCode === 67) { e.preventDefault(); return false; }
        if (e.ctrlKey && e.keyCode === 85) { e.preventDefault(); return false; }
        if (e.ctrlKey && e.keyCode === 83) { e.preventDefault(); return false; }
    });

    document.addEventListener("dragstart", function(e) {
        e.preventDefault();
        return false;
    });

    window.addEventListener("load", function() {
        var images = document.querySelectorAll("img");
        for (var i = 0; i < images.length; i++) {
            images[i].setAttribute("draggable", "false");
            images[i].style.pointerEvents = "none";
        }
    });

    console.log(
        "%cSTOP!",
        "color:red;font-size:50px;font-weight:bold;"
    );
    console.log(
        "%cThis is a browser feature intended for developers only.",
        "font-size:14px;color:#333;"
    );
})();