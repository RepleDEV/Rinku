import $ from "jquery";

function navToggle(): void {
    if ($(".link-text").is(":hidden")) {
        $("#navbar").css("width", "10.5rem");
        setTimeout(() => {
            $(".link-text").fadeToggle(150);
        }, 120);
    } else {
        $(".link-text").fadeToggle(150);
        setTimeout(() => {
            $("#navbar").css("width", "5rem");
        }, 120);
    }
}

export { navToggle };
