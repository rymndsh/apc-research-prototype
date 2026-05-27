// ============================================================
// SETTINGS TOKEN — Shared module for GitHub Token management
// Include this script on all admin pages that need GitHub API.
// ============================================================

(function () {
  "use strict";

  const TOKEN_KEY = "apc_github_token";

  // ---------- Public API ----------
  window.APC_Settings = {
    getToken: function () {
      return localStorage.getItem(TOKEN_KEY) || "";
    },
    setToken: function (token) {
      localStorage.setItem(TOKEN_KEY, token.trim());
    },
    clearToken: function () {
      localStorage.removeItem(TOKEN_KEY);
    },
    /** Returns the token, or prompts the user via modal if not set. Returns a Promise<string|null>. */
    requireToken: function () {
      const t = this.getToken();
      if (t) return Promise.resolve(t);
      return new Promise(function (resolve) {
        openSettingsModal(function (newToken) {
          resolve(newToken || null);
        });
      });
    },
    openSettings: function () {
      openSettingsModal();
    },
  };

  // ---------- GitHub config ----------
  window.APC_GITHUB = {
    OWNER: "rymndsh",
    REPO: "apc-research-prototype",
    BRANCH: "main",
  };

  // ---------- Inject CSS ----------
  var style = document.createElement("style");
  style.textContent = `
    /* Settings FAB */
    #apc-settings-fab{position:fixed;bottom:24px;left:24px;z-index:9998;width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,#0ea5e9,#0284c7);color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(14,165,233,.35);transition:transform .2s,box-shadow .2s}
    #apc-settings-fab:hover{transform:scale(1.1);box-shadow:0 6px 20px rgba(14,165,233,.5)}
    #apc-settings-fab svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2}

    /* Overlay */
    #apc-settings-overlay{position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,.45);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity .25s}
    #apc-settings-overlay.open{opacity:1;pointer-events:auto}

    /* Card */
    #apc-settings-card{background:#fff;border-radius:1.25rem;padding:2rem;width:92%;max-width:420px;box-shadow:0 25px 60px -12px rgba(0,0,0,.25);transform:translateY(12px) scale(.97);transition:transform .25s}
    #apc-settings-overlay.open #apc-settings-card{transform:translateY(0) scale(1)}

    #apc-settings-card h3{font-size:1.15rem;font-weight:700;color:#1e293b;margin-bottom:.25rem}
    #apc-settings-card p{font-size:.8rem;color:#64748b;margin-bottom:1.25rem}
    #apc-settings-card label{display:block;font-size:.75rem;font-weight:600;color:#0284c7;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.4rem}
    #apc-settings-card input{width:100%;padding:.55rem 1rem;border:1px solid #e2e8f0;border-radius:9999px;font-family:monospace;font-size:.85rem;outline:none;transition:border-color .2s,box-shadow .2s;background:#f8fafc}
    #apc-settings-card input:focus{border-color:#0ea5e9;box-shadow:0 0 0 3px rgba(14,165,233,.15)}
    .apc-settings-btns{display:flex;gap:.75rem;margin-top:1.5rem}
    .apc-settings-btns button{flex:1;padding:.6rem 0;border-radius:9999px;font-weight:700;font-size:.8rem;cursor:pointer;transition:opacity .2s,background .2s;text-transform:uppercase;letter-spacing:.08em;border:none}
    .apc-btn-cancel{background:#f1f5f9;color:#475569}
    .apc-btn-cancel:hover{background:#e2e8f0}
    .apc-btn-save{background:linear-gradient(90deg,#0ea5e9,#0284c7);color:#fff;box-shadow:0 2px 8px rgba(14,165,233,.3)}
    .apc-btn-save:hover{opacity:.9}
    .apc-token-status{display:inline-flex;align-items:center;gap:6px;font-size:.75rem;padding:4px 10px;border-radius:9999px;margin-bottom:1rem}
    .apc-token-active{background:#dcfce7;color:#16a34a}
    .apc-token-missing{background:#fef2f2;color:#dc2626}
  `;
  document.head.appendChild(style);

  // ---------- Inject FAB ----------
  document.addEventListener("DOMContentLoaded", function () {
    // FAB button
    var fab = document.createElement("button");
    fab.id = "apc-settings-fab";
    fab.title = "Settings";
    fab.innerHTML =
      '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>';
    fab.addEventListener("click", function () {
      openSettingsModal();
    });
    document.body.appendChild(fab);

    // Overlay + card (hidden by default)
    var overlay = document.createElement("div");
    overlay.id = "apc-settings-overlay";
    overlay.innerHTML = `
      <div id="apc-settings-card">
        <h3>⚙️ Pengaturan Admin</h3>
        <p>Masukkan GitHub Personal Access Token untuk mengaktifkan fitur push ke repository.</p>
        <div id="apc-token-badge"></div>
        <label for="apc-token-input">GitHub Token</label>
        <input type="password" id="apc-token-input" placeholder="ghp_xxxxxxxxxxxx" autocomplete="off" />
        <div class="apc-settings-btns">
          <button class="apc-btn-cancel" id="apc-settings-close">Tutup</button>
          <button class="apc-btn-save" id="apc-settings-save">Simpan Token</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Close on overlay click
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeSettingsModal();
    });
    document.getElementById("apc-settings-close").addEventListener("click", closeSettingsModal);
    document.getElementById("apc-settings-save").addEventListener("click", function () {
      var val = document.getElementById("apc-token-input").value.trim();
      if (val) {
        window.APC_Settings.setToken(val);
        updateBadge();
        if (_onSaveCallback) _onSaveCallback(val);
        _onSaveCallback = null;
        closeSettingsModal();
        // SweetAlert if available
        if (typeof Swal !== "undefined") {
          Swal.fire({ title: "Tersimpan!", text: "Token berhasil disimpan.", icon: "success", timer: 1500, showConfirmButton: false });
        }
      }
    });

    // Escape key
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeSettingsModal();
    });
  });

  // ---------- Internal ----------
  var _onSaveCallback = null;

  function openSettingsModal(onSave) {
    _onSaveCallback = onSave || null;
    var overlay = document.getElementById("apc-settings-overlay");
    var input = document.getElementById("apc-token-input");
    if (overlay) {
      input.value = window.APC_Settings.getToken();
      updateBadge();
      overlay.classList.add("open");
      setTimeout(function () { input.focus(); }, 200);
    }
  }

  function closeSettingsModal() {
    var overlay = document.getElementById("apc-settings-overlay");
    if (overlay) overlay.classList.remove("open");
    if (_onSaveCallback) _onSaveCallback(null);
    _onSaveCallback = null;
  }

  function updateBadge() {
    var badge = document.getElementById("apc-token-badge");
    if (!badge) return;
    var t = window.APC_Settings.getToken();
    if (t) {
      badge.innerHTML = '<span class="apc-token-status apc-token-active">✓ Token tersimpan</span>';
    } else {
      badge.innerHTML = '<span class="apc-token-status apc-token-missing">✗ Belum ada token</span>';
    }
  }
})();
