(function () {
  "use strict";

  const ROLE_LABELS = { Jr: "Junior", Mid: "Mid", Sr: "Senior" };

  const ALL_TOPIC_FILES = [
    { id: "catia-caa", file: "qna/catia_caa.json" },
    { id: "solidworks", file: "qna/solidworks_automation.json" },
    { id: "creo-proe", file: "qna/creo_proe_automation.json" },
    { id: "autocad", file: "qna/autocad_automation.json" },
    { id: "cam", file: "qna/cam.json" },
    { id: "cae", file: "qna/cae.json" },
    { id: "Algorithms-and-data-structures", file: "qna/dsa_interview_questions.json" },
    { id: "computational-geometry-interview-questions", file: "qna/computational_geometry_interview_questions.json" },
    { id: "cpp-interview-questions", file: "qna/cpp_interview_qa.json" },
    { id: "csharp-interview-questions", file: "qna/csharp_interview_questions_with_roles.json" }
  ];

  const html = document.documentElement;
  const qaContainer = document.getElementById("qaContainer");
  const qaSearch = document.getElementById("qaSearch");
  const qaCount = document.getElementById("qaCount");
  const filterBtn = document.getElementById("filterBtn");
  const filterModal = document.getElementById("filterModal");
  const filterRole = document.getElementById("filterRole");
  const filterCompany = document.getElementById("filterCompany");
  const filterTag = document.getElementById("filterTag");

  const jsonSource = document.body.dataset.json || "all";
  const pageTopicId = document.body.dataset.topicId || "all";

  let allQuestions = [];

  function escapeHtml(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function languageLabel(lang) {
    if (lang === "cpp") return "C++";
    if (lang === "csharp") return "C#";
    return lang.charAt(0).toUpperCase() + lang.slice(1);
  }

  function renderCodeSection(snippets, index) {
    const langs = Object.keys(snippets);
    if (!langs.length) return "";

    const tabs = langs.map((lang, i) => {
      const active = i === 0 ? " is-active" : "";
      return `<button type="button" class="code-tab${active}" data-code-tab="${index}:${lang}">${languageLabel(lang)}</button>`;
    }).join("");

    const panes = langs.map((lang, i) => {
      const hidden = i === 0 ? "" : " hidden";
      return `
        <div class="code-pane" data-code-pane="${index}:${lang}"${hidden}>
          <button type="button" class="copy-btn" data-copy>Copy</button>
          <pre><code class="language-${escapeHtml(lang)}">${escapeHtml(snippets[lang])}</code></pre>
        </div>
      `;
    }).join("");

    return `
      <div class="code-block">
        <div class="code-tabs">${tabs}</div>
        ${panes}
      </div>
    `;
  }

  function renderQA(questions) {
    if (!qaContainer) return;
    if (qaCount) {
      qaCount.textContent = questions.length
        ? questions.length + " question" + (questions.length === 1 ? "" : "s")
        : "";
    }

    if (!questions.length) {
      qaContainer.innerHTML = '<div class="empty-state">No matching questions found.</div>';
      return;
    }

    qaContainer.innerHTML = questions.map((q, index) => {
      const tags = (q.tags || [])
        .map((t) => `<span class="tag tag-neutral">${escapeHtml(t)}</span>`)
        .join("");
      const companies = (q.companies || [])
        .map((c) => `<span class="tag tag-amber">${escapeHtml(c)}</span>`)
        .join("");
      const code = q.code_snippets ? renderCodeSection(q.code_snippets, index) : "";
      const roleLabel = ROLE_LABELS[q.role_level] || q.role_level || "General";

      return `
        <article class="qa-card">
          <button type="button" class="qa-card__trigger" data-accordion="${index}" aria-expanded="false">
            <div>
              <div class="qa-card__meta">
                <span class="tag tag-blue">Q${escapeHtml(q.number)}</span>
                <span class="tag tag-purple">${escapeHtml(roleLabel)}</span>
                ${tags}
              </div>
              <h3>${escapeHtml(q.question)}</h3>
            </div>
            <span class="qa-card__icon" aria-hidden="true">+</span>
          </button>
          <div class="qa-card__body" id="answer-${index}" hidden>
            ${q.answer}
            ${code}
            ${companies ? `<div class="qa-card__meta" style="margin-top:0.75rem;"><span class="tag tag-neutral">Asked by</span>${companies}</div>` : ""}
          </div>
        </article>
      `;
    }).join("");

    if (window.Prism) {
      window.Prism.highlightAll();
    }
  }

  function fillSelect(select, values) {
    if (!select) return;
    const current = select.value;
    select.querySelectorAll("option:not([value='all'])").forEach((opt) => opt.remove());
    values.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = ROLE_LABELS[value] || value;
      select.appendChild(option);
    });
    select.value = [...select.options].some((opt) => opt.value === current) ? current : "all";
  }

  function initializeFilters(data) {
    const companies = new Set();
    const tags = new Set();
    const roles = new Set();

    data.forEach((item) => {
      (item.companies || []).forEach((c) => companies.add(c));
      (item.tags || []).forEach((t) => tags.add(t));
      if (item.role_level) roles.add(item.role_level);
    });

    fillSelect(filterRole, [...roles].sort());
    fillSelect(filterCompany, [...companies].sort());
    fillSelect(filterTag, [...tags].sort());
  }

  function filterQA() {
    const query = (qaSearch?.value || "").trim().toLowerCase();
    const role = filterRole?.value || "all";
    const company = filterCompany?.value || "all";
    const tag = filterTag?.value || "all";

    const filtered = allQuestions.filter((q) => {
      const haystack = [
        q.question,
        q.answer,
        ...(q.tags || []),
        ...(q.companies || [])
      ].join(" ").toLowerCase();

      const matchesSearch = !query || haystack.includes(query);
      const matchesRole = role === "all" || q.role_level === role;
      const matchesCompany = company === "all" || (q.companies || []).includes(company);
      const matchesTag = tag === "all" || (q.tags || []).includes(tag);

      return matchesSearch && matchesRole && matchesCompany && matchesTag;
    });

    renderQA(filtered);
  }

  function loadQuestions() {
    if (jsonSource !== "all") {
      // Load specific JSON file for this dedicated page
      fetch(jsonSource)
        .then((res) => {
          if (!res.ok) throw new Error("Could not load " + jsonSource);
          return res.json();
        })
        .then((data) => {
          allQuestions = Array.isArray(data) ? data : [];
          initializeFilters(allQuestions);
          filterQA();
        })
        .catch((err) => {
          if (qaContainer) {
            qaContainer.innerHTML = `<div class="error-state">Could not load question file (${escapeHtml(jsonSource)}). Please serve over HTTP.</div>`;
          }
        });
    } else {
      // Load all questions from all JSON files
      const fetches = ALL_TOPIC_FILES.map((t) =>
        fetch(t.file)
          .then((res) => (res.ok ? res.json() : []))
          .then((items) => items.map((item) => ({ ...item, topicId: t.id })))
          .catch(() => [])
      );

      Promise.all(fetches).then((results) => {
        allQuestions = results
          .flat()
          .map((q, index) => ({
            ...q,
            number: index + 1 // Replaces the original answer with 1, 2, 3...
          }));

        initializeFilters(allQuestions);
        filterQA();
      });
    }
  }

  function toggleTheme() {
    const isDark = html.getAttribute("data-theme") === "dark";
    if (isDark) {
      html.removeAttribute("data-theme");
      localStorage.setItem("CAx_theme", "light");
    } else {
      html.setAttribute("data-theme", "dark");
      localStorage.setItem("CAx_theme", "dark");
    }
  }

  document.addEventListener("click", (event) => {
    const accordionBtn = event.target.closest("[data-accordion]");
    if (accordionBtn) {
      const body = accordionBtn.nextElementSibling;
      const open = body.hasAttribute("hidden");
      body.toggleAttribute("hidden", !open);
      accordionBtn.setAttribute("aria-expanded", String(open));
      accordionBtn.querySelector(".qa-card__icon").textContent = open ? "−" : "+";
      return;
    }

    const codeTab = event.target.closest("[data-code-tab]");
    if (codeTab) {
      const [index, lang] = codeTab.dataset.codeTab.split(":");
      const card = codeTab.closest(".qa-card");
      card.querySelectorAll(".code-tab").forEach((tab) => {
        tab.classList.toggle("is-active", tab === codeTab);
      });
      card.querySelectorAll("[data-code-pane]").forEach((pane) => {
        pane.hidden = pane.dataset.codePane !== index + ":" + lang;
      });
      if (window.Prism) window.Prism.highlightAll();
      return;
    }

    const copyBtn = event.target.closest("[data-copy]");
    if (copyBtn) {
      const code = copyBtn.closest(".code-pane").querySelector("code").textContent;
      navigator.clipboard.writeText(code).then(() => {
        copyBtn.textContent = "Copied";
        setTimeout(() => { copyBtn.textContent = "Copy"; }, 1600);
      });
      return;
    }

    if (filterBtn && filterBtn.contains(event.target)) {
      const willOpen = filterModal.hidden;
      filterModal.hidden = !willOpen;
      filterBtn.setAttribute("aria-expanded", String(willOpen));
      return;
    }

    if (filterModal && !filterModal.contains(event.target)) {
      filterModal.hidden = true;
      if (filterBtn) filterBtn.setAttribute("aria-expanded", "false");
    }
  });

  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) themeToggle.addEventListener("click", toggleTheme);

  if (qaSearch) qaSearch.addEventListener("input", filterQA);
  if (filterRole) filterRole.addEventListener("change", filterQA);
  if (filterCompany) filterCompany.addEventListener("change", filterQA);
  if (filterTag) filterTag.addEventListener("change", filterQA);

  const resetFiltersBtn = document.getElementById("resetFilters");
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener("click", () => {
      if (filterRole) filterRole.value = "all";
      if (filterCompany) filterCompany.value = "all";
      if (filterTag) filterTag.value = "all";
      if (qaSearch) qaSearch.value = "";
      filterQA();
      if (filterModal) filterModal.hidden = true;
      if (filterBtn) filterBtn.setAttribute("aria-expanded", "false");
    });
  }

  loadQuestions();
})();