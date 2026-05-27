
      // ============================================================
      // PROTEKSI HALAMAN — redirect ke login kalau belum login
      // ============================================================
      if (localStorage.getItem("apc_logged_in") !== "true") {
        window.location.href = "login.html";
      }

      // ============================================================
      // KONFIGURASI GITHUB API — dari shared settings-token.js
      // ============================================================
      const GITHUB_OWNER = APC_GITHUB.OWNER;
      const GITHUB_REPO  = APC_GITHUB.REPO;


      // LOCAL DATA & RENDERING
      // ============================================================
      const STORAGE_KEY = "apc_articles_data";
      let articlesData = [];
      let currentAddImage = null, currentEditImage = null;

      function saveArticles() { localStorage.setItem(STORAGE_KEY, JSON.stringify(articlesData)); }

      function renderArticles() {
        const tbody = document.getElementById("articles-table-body");
        tbody.innerHTML = "";
        
        if (articlesData.length === 0) {
          tbody.innerHTML = '<tr><td colspan="4" class="p-8 text-center text-slate-400">Belum ada artikel. Klik "Upload Artikel Baru" untuk menambahkan.</td></tr>';
          return;
        }

        articlesData.forEach((art) => {
          const tr = document.createElement("tr");
          tr.className = "hover:bg-sky-50/50 transition border-b border-sky-50";
          tr.innerHTML = `
            <td class="p-4 font-medium text-slate-800 max-w-md truncate">${art.title}</td>
            <td class="p-4 text-slate-600">${art.author}</td>
            <td class="p-4 text-slate-500 font-mono text-xs">${art.year}</td>
            <td class="p-4 text-right">
              <button onclick="openEditView('${art.id}')" class="text-sky-600 hover:text-sky-800 font-semibold text-xs bg-sky-100 hover:bg-sky-200 px-3 py-1.5 rounded-full transition-colors">
                <i class="fa-solid fa-pen-to-square"></i> Edit
              </button>
            </td>`;
          tbody.appendChild(tr);
        });
      }

      function showView(viewId) {
        ["list-view", "add-view", "edit-view"].forEach(id => document.getElementById(id).classList.add("hidden"));
        document.getElementById(viewId).classList.remove("hidden");
        if (viewId === "list-view") { resetImage("add"); resetImage("edit"); }
      }

      function openEditView(id) {
        const art = articlesData.find((a) => a.id === id);
        if (art) {
          document.getElementById("edit-id").value = art.id;
          document.getElementById("edit-title").value = art.title;
          document.getElementById("edit-link").value = art.link;
          document.getElementById("edit-doi").value = art.doi || "";
          document.getElementById("edit-author").value = art.author;
          document.getElementById("edit-year").value = art.year;
          currentEditImage = art.imageUrl;
          art.imageUrl ? showPreview("edit", art.imageUrl) : resetImage("edit");
          showView("edit-view");
        }
      }

      function initImageUpload(inputId, prefix) {
        document.getElementById(inputId).addEventListener("change", function (e) {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = function (ev) {
            if (prefix === "add") currentAddImage = ev.target.result;
            else currentEditImage = ev.target.result;
            showPreview(prefix, ev.target.result);
          };
          reader.readAsDataURL(file);
        });
      }

      function showPreview(pfx, src) {
        document.getElementById(`${pfx}-preview`).src = src;
        document.getElementById(`${pfx}-preview`).classList.remove("hidden");
        document.getElementById(`${pfx}-placeholder-icon`).classList.add("hidden");
      }

      function resetImage(pfx) {
        document.getElementById(`${pfx}-preview`).src = "#";
        document.getElementById(`${pfx}-preview`).classList.add("hidden");
        document.getElementById(`${pfx}-placeholder-icon`).classList.remove("hidden");
        document.getElementById(`${pfx}-file`).value = "";
        if (pfx === "add") currentAddImage = null;
        else currentEditImage = null;
      }

      function handleLogout() {
        localStorage.removeItem("apc_logged_in");
        window.location.href = "login.html";
      }

      initImageUpload("add-file", "add");
      initImageUpload("edit-file", "edit");

      // ============================================================
      // GITHUB API HELPERS
      // ============================================================
      async function fetchArticlesFromGitHub() {
        const token = APC_Settings.getToken();
        if (!token) return null;

        const url = `https://api.github.com/repos/${APC_GITHUB.OWNER}/${APC_GITHUB.REPO}/contents/_posts?ref=${APC_GITHUB.BRANCH}&t=${Date.now()}`;
        try {
          const resp = await fetch(url, {
            headers: { Authorization: `token ${token}`, Accept: "application/vnd.github.v3+json" }
          });
          if (resp.status === 404) return []; // No _posts folder yet
          if (!resp.ok) return null;

          const files = await resp.json();
          const mdFiles = files.filter(f => f.name.endsWith(".md"));

          // Fetch all files concurrently
          const articles = await Promise.all(mdFiles.map(async (file) => {
            const fileResp = await fetch(file.url, {
              headers: { Authorization: `token ${token}`, Accept: "application/vnd.github.v3+json" }
            });
            if (!fileResp.ok) return null;
            const fileData = await fileResp.json();
            const content = decodeURIComponent(escape(atob(fileData.content.replace(/\n/g, ""))));
            
            // Parse frontmatter
            let title = "", author = "", year = "", link = "", doi = "", date = "", imageUrl = null;
            const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
            if (frontmatterMatch) {
              const fm = frontmatterMatch[1];
              const getVal = (key) => { 
                const m = fm.match(new RegExp(`^${key}:\\s*(?:"([^"]*)"|(.*))$`, "m")); 
                return m ? (m[1] || m[2]).trim() : ""; 
              };
              title = getVal("title");
              author = getVal("author");
              year = getVal("year");
              link = getVal("link");
              doi = getVal("doi");
              date = getVal("date");
              imageUrl = getVal("imageUrl");
              if (imageUrl === "null" || imageUrl === "") imageUrl = null;
            }

            return {
              id: file.name, // Use fileName as ID
              fileName: file.name,
              sha: fileData.sha, // Required for updating/deleting
              title, author, year, link, doi, date, imageUrl,
              rawContent: content
            };
          }));
          
          return articles.filter(a => a !== null).sort((a, b) => b.id.localeCompare(a.id)); // Sort newest first
        } catch (e) {
          console.error("Fetch GitHub error:", e);
          return null;
        }
      }

      async function pushArticleToGitHub(articleObj, commitMessage, isDelete = false) {
        const token = await APC_Settings.requireToken();
        if (!token) {
          Swal.fire({ title: "Token Diperlukan", text: "Set GitHub Token di Settings terlebih dahulu.", icon: "warning", confirmButtonColor: "#0ea5e9" });
          return false;
        }

        const apiUrl = `https://api.github.com/repos/${APC_GITHUB.OWNER}/${APC_GITHUB.REPO}/contents/_posts/${articleObj.fileName}`;
        
        let payload = {
          message: commitMessage,
          branch: APC_GITHUB.BRANCH,
        };

        if (articleObj.sha) payload.sha = articleObj.sha;

        if (!isDelete) {
          const markdownContent = `---
layout: post
title: "${articleObj.title}"
author: "${articleObj.author}"
year: ${articleObj.year}
link: "${articleObj.link}"
doi: "${articleObj.doi || ""}"
date: ${articleObj.date}
imageUrl: ${articleObj.imageUrl ? `"${articleObj.imageUrl}"` : "null"}
---

Artikel ini diunggah melalui Custom Dashboard APC Research.
Tautan referensi: [Baca Selengkapnya](${articleObj.link})
`;
          payload.content = btoa(unescape(encodeURIComponent(markdownContent)));
        }

        try {
          const response = await fetch(apiUrl, {
            method: isDelete ? "DELETE" : "PUT",
            headers: {
              Authorization: `token ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            const result = await response.json();
            if (!isDelete) articleObj.sha = result.content.sha; // Update SHA for future edits
            return true;
          } else {
            const errorData = await response.json();
            if (response.status === 401) {
              Swal.fire({
                title: "Token Tidak Valid!",
                text: "Token GitHub kamu expired atau salah. Silakan update di Settings.",
                icon: "error",
                confirmButtonText: "Buka Settings",
                confirmButtonColor: "#0ea5e9",
              }).then(() => { APC_Settings.openSettings(); });
            } else if (response.status === 409) {
              Swal.fire({ title: "Konflik!", text: "File sudah berubah di GitHub. Halaman akan di-reload.", icon: "warning", confirmButtonColor: "#0ea5e9" })
                .then(() => location.reload());
            } else {
              Swal.fire({ title: "Gagal Push!", text: `Error: ${errorData.message}`, icon: "error" });
            }
            return false;
          }
        } catch (error) {
          Swal.fire({ title: "Error Jaringan", text: "Gagal menyambung ke API GitHub.", icon: "error" });
          return false;
        }
      }

      // ============================================================
      // SUBMIT — Upload Artikel Baru ke GitHub
      // ============================================================
      document.getElementById("add-form").addEventListener("submit", async function (e) {
        e.preventDefault();

        const title  = document.getElementById("add-title").value;
        const link   = document.getElementById("add-link").value;
        const doi    = document.getElementById("add-doi").value;
        const author = document.getElementById("add-author").value;
        const year   = document.getElementById("add-year").value;
        const dateObj  = new Date();
        const today    = dateObj.toISOString().split("T")[0];
        const slug     = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
        const uniqueId = Date.now();
        const fileName = `${today}-${slug}-${uniqueId}.md`; // Cleaned filename without _posts/ prefix

        const newArticle = {
          id: fileName,
          fileName: fileName,
          title, author, year, link, doi, date: today,
          imageUrl: currentAddImage,
          sha: null
        };

        Swal.fire({
          title: "Mengunggah ke GitHub...",
          text: "Mohon tunggu sebentar",
          allowOutsideClick: false,
          didOpen: () => { Swal.showLoading(); },
        });

        const success = await pushArticleToGitHub(newArticle, `Admin: Publish artikel "${title}"`);
        
        if (success) {
          articlesData.unshift(newArticle);
          saveArticles();
          renderArticles();
          showView("list-view");
          document.getElementById("add-form").reset();
          resetImage("add");
          Swal.fire({ title: "Berhasil Publish!", text: "Artikel berhasil di-push ke GitHub.", icon: "success", confirmButtonColor: "#0ea5e9" });
        }
      });

      // ============================================================
      // EDIT ARTIKEL
      // ============================================================
      document.getElementById("edit-form").addEventListener("submit", async function (e) {
        e.preventDefault();
        const id  = document.getElementById("edit-id").value;
        const idx = articlesData.findIndex((a) => a.id === id);
        
        if (idx !== -1) {
          const oldData = { ...articlesData[idx] };

          articlesData[idx].title    = document.getElementById("edit-title").value;
          articlesData[idx].link     = document.getElementById("edit-link").value;
          articlesData[idx].doi      = document.getElementById("edit-doi").value;
          articlesData[idx].author   = document.getElementById("edit-author").value;
          articlesData[idx].year     = document.getElementById("edit-year").value;
          articlesData[idx].imageUrl = currentEditImage;

          Swal.fire({
            title: "Menyimpan ke GitHub...",
            text: "Mohon tunggu sebentar",
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); },
          });

          const success = await pushArticleToGitHub(articlesData[idx], `Admin: Update artikel "${articlesData[idx].title}"`);

          if (success) {
            saveArticles();
            renderArticles();
            showView("list-view");
            Swal.fire({ title: "Diperbarui!", text: "Perubahan artikel berhasil di-push ke GitHub.", icon: "success", timer: 1500, showConfirmButton: false });
          } else {
            articlesData[idx] = oldData; // Rollback
          }
        }
      });

      // ============================================================
      // HAPUS ARTIKEL
      // ============================================================
      document.getElementById("delete-article-btn").addEventListener("click", async function () {
        const id    = document.getElementById("edit-id").value;
        const title = document.getElementById("edit-title").value;
        const idx = articlesData.findIndex((a) => a.id === id);

        if (idx === -1) return;

        const result = await Swal.fire({
          title: "Hapus Artikel?",
          text: `Yakin ingin menghapus artikel "${title}"? Perubahan akan langsung di-push ke GitHub.`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#ef4444",
          cancelButtonColor: "#64748b",
          confirmButtonText: "Ya, Hapus!",
          cancelButtonText: "Batal",
          reverseButtons: true,
        });

        if (result.isConfirmed) {
          Swal.fire({
            title: "Menghapus dari GitHub...",
            text: "Mohon tunggu sebentar",
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); },
          });

          const articleToDelete = articlesData[idx];
          const success = await pushArticleToGitHub(articleToDelete, `Admin: Hapus artikel "${title}"`, true);

          if (success) {
            articlesData.splice(idx, 1);
            saveArticles();
            renderArticles();
            showView("list-view");
            Swal.fire({ title: "Terhapus!", text: "Artikel telah berhasil dihapus dari GitHub.", icon: "success", timer: 1500, showConfirmButton: false });
          }
        }
      });

      // ============================================================
      // INITIAL LOAD
      // ============================================================
      window.addEventListener("error", function(e) {
        alert("Error: " + e.message + " (Line: " + e.lineno + ")");
      });
      window.addEventListener("unhandledrejection", function(e) {
        alert("Promise Error: " + (e.reason && e.reason.message ? e.reason.message : e.reason));
      });

      (async function init() {
        const ghData = await fetchArticlesFromGitHub();
        if (ghData) {
          articlesData = ghData;
          saveArticles(); // Sync to localStorage
        } else {
          // Fallback to localStorage
          articlesData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        }
        renderArticles();
      })();

      renderArticles();
    