/* Educatunify — DESIGN SWITCHER (demo only, safe to delete).
   The template ships two designs on the same markup: "Timetable" (timetable) and "Wayfinding" (wayfind).
   This file adds the floating "View" control on the right edge of the screen so visitors can compare them. It brings its own
   markup and styles; nothing else depends on it.

   To ship ONE design:
     1. delete the <script src="js/view-switch.js"> line from every page (and this file),
     2. set the design on the <html> tag of every page, e.g. <html lang="en" data-theme="wayfind">,
     3. delete the <script src="js/theme.js"> line too, so a choice remembered from the demo cannot override it. */
(function () {
    var root = document.documentElement;
    var VIEWS = [["timetable", "Timetable", "Timetable"], ["wayfind", "Wayfinding", "Wayfinding"]];

    var css = ""
        + ".ed-vs{position:fixed;right:0;top:50%;transform:translateY(-50%);z-index:1045;display:flex;flex-direction:column;gap:4px;padding:10px 8px;background:#0b2545;color:#fff;border-radius:10px 0 0 10px;box-shadow:0 14px 34px -14px rgba(0,0,0,.55);font:600 12px/1.2 system-ui,-apple-system,'Segoe UI',sans-serif}"
        + ".ed-vs__lbl{font-size:10px;letter-spacing:.16em;text-transform:uppercase;opacity:.7;text-align:center;padding:0 0 4px}"
        + ".ed-vs button{display:flex;align-items:center;gap:8px;border:0;background:none;color:inherit;font:inherit;padding:8px 10px;border-radius:6px;cursor:pointer;text-align:left;white-space:nowrap}"
        + ".ed-vs button:hover{background:rgba(255,255,255,.1)}"
        + ".ed-vs button[aria-pressed=true]{background:#fff;color:#0b2545}"
        + ".ed-vs button:focus-visible{outline:2px solid #ffd84d;outline-offset:2px}"
        + ".ed-vs__dot{width:14px;height:14px;flex:none;border-radius:3px;box-shadow:0 0 0 1px rgba(255,255,255,.35)}"
        + ".ed-vs [data-v=timetable] .ed-vs__dot{background:linear-gradient(90deg,#1098f7 50%,#ffd84d 50%)}"
        + ".ed-vs [data-v=wayfind] .ed-vs__dot{background:linear-gradient(180deg,#0b78d1 55%,#0f5c4a 55%)}"
        + "@media (max-width:991.98px){.ed-vs{top:auto;bottom:76px;transform:none;padding:8px 5px;gap:2px}.ed-vs__lbl{font-size:9px;letter-spacing:.1em}.ed-vs__name{display:none}.ed-vs button{padding:9px}}"
        + "@media print{.ed-vs{display:none}}";
    var style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);

    var box = document.createElement("div");
    box.className = "ed-vs";
    box.setAttribute("role", "group");
    box.setAttribute("aria-label", "Design view");
    box.innerHTML = '<span class="ed-vs__lbl">View</span>' + VIEWS.map(function (v) {
        return '<button type="button" data-v="' + v[0] + '" title="' + v[1] + ' design" aria-label="' + v[1] + ' design"><i class="ed-vs__dot" aria-hidden="true"></i><span class="ed-vs__name">' + v[2] + '</span></button>';
    }).join("");
    document.body.appendChild(box);

    var mark = function () {
        var cur = root.getAttribute("data-theme") || "timetable";
        box.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-v") === cur ? "true" : "false"); });
    };
    mark();
    box.addEventListener("click", function (e) {
        var b = e.target.closest("button[data-v]");
        if (!b) return;
        var v = b.getAttribute("data-v");
        root.setAttribute("data-theme", v);
        try { localStorage.setItem("ed-view", v); } catch (err) {}
        mark();
        window.dispatchEvent(new Event("resize"));
    });
})();
