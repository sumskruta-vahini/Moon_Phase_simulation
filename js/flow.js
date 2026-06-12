/**
 * js/flow.js — Storyboard flow controller (hub model).
 *
 * Onboarding (linear, once):  intro → controls → Simulation View
 * Simulation Hub (non-linear): the explorer is the permanent centre. A mode
 * state sits on top of it:
 *
 *     mode ∈ { explore (default), observation, quiz, results }
 *
 * Observation and Quiz are INDEPENDENT, optional modes launched from a floating
 * mode dock. Neither gates the other; closing either returns to Explore.
 *
 * The engine (script.js) is never modified and #app is never display:none'd
 * (that would break canvas sizing) — overlays simply stack above it.
 */
(function () {
  "use strict";

  if (typeof bus === "undefined" || typeof CONSTELLATIONS === "undefined") {
    console.warn("[flow] engine globals not found; flow disabled.");
    return;
  }

  var $ = function (sel) { return document.querySelector(sel); };
  var nameOf = function (id) {
    var c = CONSTELLATIONS.find(function (x) { return x.id === id; });
    return c ? c.name : null;
  };

  // ── Observation activity (Screen 4) ──────────────────────────────
  var ACTIVITY = [
    { prompt: "Find Orion, the Hunter.",
      hint: "Look for the three bright stars of the belt in a row.",
      targets: ["ori"] },
    { prompt: "Find Cassiopeia, the vain queen.",
      hint: "Five bright stars forming a distinctive W (or M) shape.",
      targets: ["cas"] },
    { prompt: "Find the constellation that contains Sirius, the brightest star in the night sky.",
      hint: 'Sirius is nicknamed the "Dog Star".',
      targets: ["cma"], reveal: "Canis Major" },
    { prompt: "Find the North Star's constellation.",
      hint: "Polaris marks the tip of the Little Dipper's handle.",
      targets: ["umi"], reveal: "Ursa Minor" },
    { prompt: "Identify any constellation of the Summer Triangle.",
      hint: "Its corner stars are Vega, Deneb, and Altair.",
      targets: ["cyg", "lyr", "aql"], reveal: "Cygnus, Lyra, or Aquila" },
  ];

  var act = { idx: 0, done: false, feedback: null, ok: false };
  var quiz = { idx: 0, answers: [] };
  var QUIZ = window.QUIZ || [];

  // ── View routing ─────────────────────────────────────────────────
  // Onboarding + hub overlays that fully cover the screen:
  var OVERLAY = {
    intro: "#screen-intro",
    controls: "#screen-controls",
    quiz: "#screen-quiz",
    results: "#screen-results",
  };
  var current = null;

  function hideAllOverlays() {
    Object.keys(OVERLAY).forEach(function (k) {
      $(OVERLAY[k]).classList.remove("is-active");
    });
  }

  function focusTitle(overlayEl) {
    var h = overlayEl.querySelector('[tabindex="-1"]');
    if (h) { try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); } }
  }

  function setDockActive(view) {
    var btns = document.querySelectorAll("#mode-dock .dock-btn[data-mode]");
    Array.prototype.forEach.call(btns, function (b) {
      b.classList.toggle("is-current", b.dataset.mode === view);
    });
  }

  function configureControls(help) {
    $("#controls-back").style.display = help ? "none" : "";
    $("#controls-enter").textContent = help ? "Back to Explorer" : "Enter Simulation →";
  }

  /**
   * setView — the single navigation primitive.
   * @param {string} view  intro|controls|explore|observation|quiz|results
   * @param {object} [opts] { help: boolean } for the controls view
   */
  function setView(view, opts) {
    opts = opts || {};
    current = view;
    hideAllOverlays();

    // The dock belongs to the hub; show it only when the explorer is visible.
    var dockVisible = (view === "explore" || view === "observation");
    $("#mode-dock").classList.toggle("is-active", dockVisible);
    setDockActive(view);

    // Observation card is the only partial overlay.
    $("#activity-card").classList.toggle("is-active", view === "observation");

    // Reset the run only when returning to the very start.
    if (view === "intro") resetRun();

    if (OVERLAY[view]) {
      var ov = $(OVERLAY[view]);
      ov.classList.add("is-active");
      focusTitle(ov);
    }

    if (view === "controls") configureControls(!!opts.help);
    if (view === "observation") renderActivity();
    if (view === "quiz") startQuiz();
    if (view === "results") renderResults();
  }

  function resetRun() {
    act.idx = 0; act.done = false; act.feedback = null; act.ok = false;
    quiz.idx = 0; quiz.answers = [];
  }

  // ── Screen 4: Observation activity ───────────────────────────────
  function renderActivity() {
    var card = $("#activity-card");
    var close = '<button class="activity-close" data-act="close" aria-label="Close activity">×</button>';

    if (act.done) {
      // Non-blocking completion: congratulate + optional quiz nudge.
      card.innerHTML =
        '<div class="activity-head"><span class="activity-kicker">Observation Activity</span>' +
        '<span class="activity-spacer"></span>' + close + "</div>" +
        '<p class="activity-complete">✓ All 5 targets found — great observing!</p>' +
        '<p class="activity-sub">Want to test what you’ve learned?</p>' +
        '<div class="activity-actions">' +
        '<button class="btn btn-ghost btn-sm" data-act="close">Keep exploring</button>' +
        '<button class="btn btn-primary btn-sm" data-act="quiz">Take the Quiz →</button>' +
        "</div>";
      return;
    }

    var t = ACTIVITY[act.idx];
    var dots = ACTIVITY.map(function (_, i) {
      var cls = i < act.idx ? "done" : (i === act.idx ? "current" : "");
      return '<i class="' + cls + '"></i>';
    }).join("");
    var fb = act.feedback
      ? '<p class="activity-feedback ' + (act.ok ? "ok" : "no") + '">' + act.feedback + "</p>"
      : "";

    card.innerHTML =
      '<div class="activity-head"><span class="activity-kicker">Observation Activity</span>' +
      '<span class="activity-spacer"></span>' +
      '<span class="activity-progress">Task ' + (act.idx + 1) + " / " + ACTIVITY.length + "</span>" +
      close + "</div>" +
      '<p class="activity-prompt">' + t.prompt + "</p>" +
      '<p class="activity-hint">Hint: ' + t.hint + "</p>" +
      fb +
      '<div class="activity-dots" aria-hidden="true">' + dots + "</div>";
  }

  function onSelect(payload) {
    if (current !== "observation" || act.done) return;
    var id = payload && payload.id;
    if (!id) return; // ignore deselection / empty-sky clicks
    var t = ACTIVITY[act.idx];
    if (t.targets.indexOf(id) !== -1) {
      act.ok = true;
      act.feedback = "Correct! " + (t.reveal || nameOf(id)) + ".";
      act.idx += 1;
      if (act.idx >= ACTIVITY.length) act.done = true;
    } else {
      act.ok = false;
      act.feedback = "Not quite — that’s " + (nameOf(id) || "that one") + ". " + t.hint;
    }
    renderActivity();
  }

  bus.on("constellation:select", onSelect);

  // Delegated clicks inside the activity card (close / quiz nudge).
  $("#activity-card").addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("[data-act]") : null;
    if (!t) return;
    if (t.dataset.act === "close") setView("explore");
    else if (t.dataset.act === "quiz") setView("quiz");
  });

  // ── Screen 5: Quiz (independent) ─────────────────────────────────
  function startQuiz() {
    quiz.idx = 0;
    quiz.answers = QUIZ.map(function () { return null; });
    renderQuestion();
  }

  function renderQuestion() {
    var total = QUIZ.length;
    var q = QUIZ[quiz.idx];
    $("#quiz-progress-text").textContent = "Question " + (quiz.idx + 1) + " of " + total;
    $("#quiz-bar-fill").style.width = (quiz.idx / total * 100) + "%";

    var chosen = quiz.answers[quiz.idx];
    var opts = q.options.map(function (opt, i) {
      var sel = chosen === i ? " is-selected" : "";
      return '<button type="button" class="quiz-opt' + sel + '" data-opt="' + i + '">' +
             '<span class="quiz-opt-key">' + String.fromCharCode(65 + i) + "</span>" +
             '<span class="quiz-opt-text">' + opt + "</span></button>";
    }).join("");

    $("#quiz-body").innerHTML =
      '<p class="quiz-question">' + q.q + "</p>" +
      '<div class="quiz-options" role="group" aria-label="Answer options">' + opts + "</div>";

    var next = $("#quiz-next");
    next.textContent = (quiz.idx === total - 1) ? "See Results →" : "Next →";
    next.disabled = chosen === null;
    $("#quiz-back").textContent = (quiz.idx === 0) ? "Exit" : "← Back";

    Array.prototype.forEach.call($("#quiz-body").querySelectorAll(".quiz-opt"), function (b) {
      b.addEventListener("click", function () {
        quiz.answers[quiz.idx] = parseInt(b.dataset.opt, 10);
        renderQuestion();
      });
    });
  }

  function scoreQuiz() {
    var s = 0;
    QUIZ.forEach(function (q, i) { if (quiz.answers[i] === q.answer) s += 1; });
    return s;
  }

  // ── Results ──────────────────────────────────────────────────────
  function renderResults() {
    var total = QUIZ.length;
    var s = scoreQuiz();
    var pct = total ? Math.round((s / total) * 100) : 0;
    $("#results-score").textContent = s + " / " + total;
    $("#results-score").classList.toggle("pass", pct >= 70);
    $("#results-title").textContent = pct >= 70 ? "Well done, stargazer!" : "Keep exploring!";
    $("#results-message").textContent =
      pct >= 70
        ? "You scored " + pct + "%. You can clearly read the night sky. Head back to the explorer or retake the quiz any time."
        : "You scored " + pct + "%. Revisit the explorer to study the patterns, then retake the quiz whenever you like.";
  }

  // ── Wiring ───────────────────────────────────────────────────────
  // Generic view jumps (intro/controls/results buttons).
  Array.prototype.forEach.call(document.querySelectorAll("[data-go]"), function (b) {
    b.addEventListener("click", function () { setView(b.dataset.go); });
  });

  // Mode dock.
  Array.prototype.forEach.call(document.querySelectorAll("#mode-dock .dock-btn[data-mode]"), function (b) {
    b.addEventListener("click", function () { setView(b.dataset.mode); });
  });
  $("#mode-dock [data-help]").addEventListener("click", function () {
    setView("controls", { help: true });
  });

  // Quiz controls.
  $("#quiz-close").addEventListener("click", function () { setView("explore"); });
  $("#quiz-back").addEventListener("click", function () {
    if (quiz.idx > 0) { quiz.idx -= 1; renderQuestion(); }
    else setView("explore");
  });
  $("#quiz-next").addEventListener("click", function () {
    if (quiz.answers[quiz.idx] === null) return;
    if (quiz.idx === QUIZ.length - 1) setView("results");
    else { quiz.idx += 1; renderQuestion(); }
  });

  // ── Start ────────────────────────────────────────────────────────
  setView("intro");
})();
