/* Educatunify — pick the design before the page paints (the floating View control is js/view-switch.js; to ship one design, see the note there).
   Two designs of one site: "Timetable" (data-theme="timetable", the default) and "Wayfinding" (data-theme="wayfind").
   ?view=… in the URL wins and is remembered; otherwise the visitor's last choice. */
(function () {
    var t = null;
    try { var q = /[?&]view=(timetable|wayfind)\b/.exec(location.search); if (q) { t = q[1]; localStorage.setItem("ed-view", t); } else t = localStorage.getItem("ed-view"); } catch (e) {}
    if (t === "timetable" || t === "wayfind") document.documentElement.setAttribute("data-theme", t);
})();
