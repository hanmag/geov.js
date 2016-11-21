var open;

function buildGUI() {
    var docHeight = $(document).height();

    $("#options").css({
        "visibility": "visible",
        "top": docHeight / 2,
        "bottom": docHeight / 2
    }).animate({
        "top": 0,
        "bottom": 0,
        "padding-top": 46
    }, 800, function complete() {
        $("#thumbprint").animate({ opacity: 1 });
        $("#thumbprint").click(function () {
            if (!open) {
                open = true;
                openOptions();
            } else {
                open = false;
                closeOptions();
            }
        });

        setTimeout(function () {
            open = true;
            openOptions();
        }, 500);
    });

    $('input[name="mapStyle"]:radio').change(function () {
        options.mapStyle = this.value;
    });
    $('input[name="viewMode"]:radio').change(function () {
        options.viewMode = this.value;
    });
}

function openOptions() {
    $("#options").data("left", $("#options").css("left"));
    $("#thumbprint").data("left", $("#thumbprint").css("left"));
    $("#geovContainer").data("marginLeft", $("#geovContainer").css("marginLeft"));
    $("#options").animate({ left: 0 }, 500);
    $("#thumbprint").animate({ left: 215 }, 500);
    $("#geovContainer").animate({ marginLeft: 150 }, 500);
    $("#options-content").delay(1500).animate({ opacity: 1 }, 500);
}

function closeOptions() {
    $("#options").animate({ left: $("#options").data("left") }, 500);
    $("#thumbprint").animate({ left: $("#thumbprint").data("left") }, 500);
    $("#geovContainer").animate({ marginLeft: $("#geovContainer").data("marginLeft") }, 500);
    $("#options-content").animate({ opacity: 0 }, 500);
}