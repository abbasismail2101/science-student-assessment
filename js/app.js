(function (global) {
  const viewEl = document.getElementById("view");

  // Tiny helpers exposed to views
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === "class") node.className = v;
        else if (k === "html") node.innerHTML = v;
        else if (k === "text") node.textContent = v;
        else if (k.startsWith("on") && typeof v === "function") {
          node.addEventListener(k.slice(2).toLowerCase(), v);
        } else if (k === "value") {
          node.value = v;
        } else {
          node.setAttribute(k, v);
        }
      }
    }
    if (children) {
      const arr = Array.isArray(children) ? children : [children];
      for (const child of arr) {
        if (child == null || child === false) continue;
        if (typeof child === "string" || typeof child === "number") {
          node.appendChild(document.createTextNode(String(child)));
        } else {
          node.appendChild(child);
        }
      }
    }
    return node;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function navigate(hash) {
    if (location.hash === hash) {
      route();
    } else {
      location.hash = hash;
    }
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function debounce(fn, ms) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  function formatDate(s) {
    if (!s) return "";
    try {
      return new Date(s).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    } catch (e) {
      return s;
    }
  }

  function setActiveNav(hash) {
    const links = document.querySelectorAll(".nav a[data-link]");
    links.forEach((a) => {
      const href = a.getAttribute("href");
      a.classList.toggle("active", hash === href || (href === "#/" && hash.startsWith("#/class")));
    });
  }

  function route() {
    const hash = location.hash || "#/";
    setActiveNav(hash);
    clear(viewEl);

    if (hash === "#/" || hash === "") {
      global.SSAViews.classes(viewEl);
      return;
    }
    if (hash === "#/settings") {
      global.SSAViews.settings(viewEl);
      return;
    }

    let m;
    if ((m = hash.match(/^#\/class\/([^/]+)$/))) {
      global.SSAViews.classView(viewEl, m[1]);
      return;
    }
    if ((m = hash.match(/^#\/class\/([^/]+)\/assessment\/([^/]+)$/))) {
      global.SSAViews.assessment(viewEl, m[1], m[2]);
      return;
    }
    if ((m = hash.match(/^#\/class\/([^/]+)\/student\/([^/]+)$/))) {
      global.SSAViews.student(viewEl, m[1], m[2]);
      return;
    }

    viewEl.appendChild(el("div", { class: "card" }, [
      el("h2", null, "Page not found"),
      el("p", null, [
        "We couldn't find that view. ",
        el("a", { href: "#/" }, "Go to Classes"),
      ]),
    ]));
  }

  global.SSAApp = { el, clear, navigate, escapeHtml, debounce, formatDate, route };
  global.SSAViews = global.SSAViews || {};

  window.addEventListener("hashchange", route);
  window.addEventListener("DOMContentLoaded", route);
})(window);
