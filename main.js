/* Renders news, publications and collaborators from data.js. */
(function () {
  "use strict";

  var ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return ESC[c]; }); }

  // [text](url) becomes a link and **text** becomes bold; everything else stays plain text.
  function inline(text) {
    return esc(text)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
  }

  function joinNames(parts) {
    if (parts.length < 3) return parts.join(" and ");
    return parts.slice(0, -1).join(", ") + ", and " + parts[parts.length - 1];
  }

  // The address is put together here, so simple scrapers that don't run scripts never see it.
  function setupEmail() {
    document.querySelectorAll(".js-mail").forEach(function (a) {
      var addr = a.dataset.user + "@" + a.dataset.domain;
      a.href = "mailto:" + addr;
      a.title = addr;
    });
  }

  function renderExperience() {
    var list = document.getElementById("exp-list");
    if (!list || typeof EXPERIENCE === "undefined") return;
    list.classList.toggle("with-logos", EXPERIENCE.some(function (e) { return e.logo; }));
    list.innerHTML = EXPERIENCE.map(function (e) {
      var org = e.url ? '<a href="' + esc(e.url) + '">' + esc(e.org) + "</a>" : esc(e.org);
      var cls = [e.now ? "now" : "", e.logo ? "has-logo" : ""].filter(Boolean).join(" ");
      return "<li" + (cls ? ' class="' + cls + '"' : "") + ">" +
        (e.logo ? '<img class="exp-mark" src="' + esc(e.logo) + '" alt="">' : "") +
        '<p class="exp-head"><span><strong>' + esc(e.role) + "</strong>, " + org + '</span><span class="exp-when">' + esc(e.when) + "</span></p>" +
        (e.text ? '<div class="exp-more"><div><p class="exp-text">' + inline(e.text) + "</p></div></div>" : "") +
        "</li>";
    }).join("");

    // One toggle next to the heading opens or closes all details at once.
    var btn = document.getElementById("exp-toggle");
    if (!btn) return;
    var label = btn.querySelector(".disclose-label");
    function setOpen(open) {
      list.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", String(open));
      label.textContent = open ? "Hide details" : "Show details";
    }
    setOpen(!!SITE.experienceOpen);
    btn.addEventListener("click", function () { setOpen(!list.classList.contains("open")); });
  }

  function renderNews() {
    var list = document.getElementById("news-list");
    if (!list || typeof NEWS === "undefined") return;
    var visible = SITE.newsVisible || NEWS.length;
    list.innerHTML = NEWS.map(function (item, i) {
      return "<li" + (i >= visible ? " hidden" : "") + "><time>" + esc(item.date) + "</time><span>" + inline(item.text) + "</span></li>";
    }).join("");
    var older = NEWS.length - visible;
    var btn = document.getElementById("news-more");
    if (btn && older > 0) {
      btn.hidden = false;
      btn.textContent = "Show older news (" + older + ")";
      btn.addEventListener("click", function () {
        list.querySelectorAll("li[hidden]").forEach(function (li) { li.hidden = false; });
        btn.hidden = true;
      });
    }
  }

  var LINK_LABELS = { project: "project page", paper: "paper", arxiv: "arXiv", code: "code", demo: "demo", video: "video", data: "data", slides: "slides", poster: "poster" };

  function authorList(authors) {
    return authors.map(function (a) {
      return SITE.me.indexOf(a) >= 0 ? '<strong class="me">' + esc(a) + "</strong>" : esc(a);
    }).join(", ");
  }

  function teaserHTML(t) {
    if (!t || !t.image) return '<div class="teaser" aria-hidden="true"></div>';
    return '<div class="teaser' + (t.hover ? " has-alt" : "") + '" data-effect="' + esc(t.effect || "swap") + '" data-interval="' + esc(t.interval || 250) + '">' +
      '<img src="' + esc(t.image) + '" alt="' + esc(t.alt || "") + '" width="480" height="360" loading="lazy" decoding="async">' +
      (t.hover ? '<img class="alt" src="' + esc(t.hover) + '" alt="" width="480" height="360" loading="lazy" decoding="async">' : "") +
      (t.caption ? '<span class="cap">' + esc(t.caption) + "</span>" : "") +
      "</div>";
  }

  function renderPublications() {
    var root = document.getElementById("pub-list");
    if (!root || typeof PUBLICATIONS === "undefined") return;
    root.innerHTML = PUBLICATIONS.map(function (p) {
      var links = p.links || {};
      var main = links.project || links.paper || links.arxiv;
      var title = main ? '<a href="' + esc(main) + '">' + esc(p.title) + "</a>" : esc(p.title);
      var row = Object.keys(links).filter(function (k) { return links[k]; }).map(function (k) {
        return '<a href="' + esc(links[k]) + '">' + esc(LINK_LABELS[k] || k) + "</a>";
      }).join("");
      return '<article class="pub" id="' + esc(p.id) + '">' + teaserHTML(p.teaser) +
        '<div class="pub-text"><h3>' + title + "</h3>" +
        '<p class="authors">' + authorList(p.authors) + "</p>" +
        '<p class="venue">' + esc(p.venue) + "</p>" +
        (row ? '<p class="pub-links">' + row + "</p>" : "") +
        (p.tldr ? '<p class="tldr">' + inline(p.tldr) + "</p>" : "") +
        "</div></article>";
    }).join("");
    root.querySelectorAll(".teaser.has-alt").forEach(setupTeaser);
  }

  // Hovering (or tapping, on touch screens) shows the second image.
  // "wiggle" flips between both images, so a stereo pair shows its depth.
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  function setupTeaser(el) {
    var timer = null, lastPointer = "mouse";
    function on() {
      el.classList.add("is-on", "flip");
      if (el.dataset.effect === "wiggle" && !reduceMotion.matches && !timer) {
        timer = setInterval(function () { el.classList.toggle("flip"); }, parseInt(el.dataset.interval, 10) || 250);
      }
    }
    function off() {
      clearInterval(timer);
      timer = null;
      el.classList.remove("is-on", "flip");
    }
    el.addEventListener("pointerdown", function (e) { lastPointer = e.pointerType; });
    el.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") on(); });
    el.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") off(); });
    el.addEventListener("click", function () {
      if (lastPointer !== "mouse") (el.classList.contains("is-on") ? off : on)();
    });
  }

  function renderCollaborators() {
    var el = document.getElementById("collab-list");
    if (!el || typeof PUBLICATIONS === "undefined") return;
    var C = typeof COLLABORATORS !== "undefined" ? COLLABORATORS : {};
    var homepages = typeof PEOPLE !== "undefined" ? PEOPLE : {};
    var hide = C.hide || [];
    var shared = {};
    PUBLICATIONS.forEach(function (p) {
      p.authors.forEach(function (a) {
        if (SITE.me.indexOf(a) < 0) (shared[a] = shared[a] || []).push(p.short || p.title);
      });
    });
    var notes = {};
    (C.extra || []).forEach(function (x) { notes[x.name] = x.note || ""; });
    var pinned = (C.pinned || []).filter(function (n) { return hide.indexOf(n) < 0; });
    var others = Object.keys(shared).concat(Object.keys(notes)).filter(function (n, i, all) {
      return all.indexOf(n) === i && pinned.indexOf(n) < 0 && hide.indexOf(n) < 0;
    });
    function surname(n) { return n.split(" ").pop(); }
    others.sort(function (a, b) {
      return ((shared[b] || []).length - (shared[a] || []).length) || surname(a).localeCompare(surname(b));
    });
    var names = pinned.concat(others).map(function (n) {
      var tip = notes[n] || (shared[n] || []).join(", ");
      var label = homepages[n] ? '<a href="' + esc(homepages[n]) + '">' + esc(n) + "</a>" : esc(n);
      return '<span class="who"' + (tip ? ' title="' + esc(tip) + '"' : "") + ">" + label + "</span>";
    });
    var intro = "A shout-out to the people I’ve had the pleasure of working with: ";
    var limit = C.visible || names.length;
    if (names.length <= limit) { el.innerHTML = intro + joinNames(names) + "."; return; }
    el.innerHTML = intro + names.slice(0, limit).join(", ") + ', and <button class="more" type="button">' + (names.length - limit) + " more</button>.";
    el.querySelector("button").addEventListener("click", function () { el.innerHTML = intro + joinNames(names) + "."; });
  }

  setupEmail();
  renderExperience();
  renderNews();
  renderPublications();
  renderCollaborators();

  // A link like …/#stereospace points at content that only exists now, so scroll to it.
  if (location.hash.length > 1) {
    var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target) target.scrollIntoView();
  }
})();
