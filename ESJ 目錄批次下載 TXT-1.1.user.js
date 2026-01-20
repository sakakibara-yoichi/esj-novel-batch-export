// ==UserScript==
// @name         ESJ 目錄批次下載 TXT
// @namespace    esj-batch-export
// @version      1.1
// @description  在小說目錄頁勾選章節並批次下載 TXT
// @match        https://www.esjzone.cc/detail/*.html
// @grant        none
// @downloadURL https://github.com/sakakibara-yoichi/esj-novel-batch-export/blob/master/ESJ%20%E7%9B%AE%E9%8C%84%E6%89%B9%E6%AC%A1%E4%B8%8B%E8%BC%89%20TXT-1.1.user.js
// @updateURL https://github.com/sakakibara-yoichi/esj-novel-batch-export/blob/master/ESJ%20%E7%9B%AE%E9%8C%84%E6%89%B9%E6%AC%A1%E4%B8%8B%E8%BC%89%20TXT-1.1.user.js
// @require https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js

// ==/UserScript==

(async function () {
    'use strict';

    // ===== 找章節連結（ESJ 目錄頁）=====
    const chapterLinks = Array.from(document.querySelectorAll('#chapterList a[href*="/forum/"]'))
        .filter(a => a.textContent.trim().length > 0);

    if (chapterLinks.length === 0) return;
/* ================= ICON ================= */
    const icon = document.createElement("div");
    icon.textContent = "📘";
    icon.title = "下載章節 TXT";
    icon.style.position = "fixed";
    icon.style.right = "20px";
    icon.style.bottom = "20px";
    icon.style.zIndex = "9999";
    icon.style.cursor = "pointer";
    icon.style.fontSize = "28px";
    icon.style.background = "#fff";
    icon.style.border = "1px solid #aaa";
    icon.style.borderRadius = "50%";
    icon.style.width = "48px";
    icon.style.height = "48px";
    icon.style.display = "flex";
    icon.style.alignItems = "center";
    icon.style.justifyContent = "center";
    icon.style.boxShadow = "0 2px 6px rgba(0,0,0,.3)";

    document.body.appendChild(icon);

    /* ================= PANEL ================= */
    const panel = document.createElement("div");
    panel.style.position = "fixed";
    panel.style.right = "20px";
    panel.style.bottom = "80px";
    panel.style.zIndex = "9999";
    panel.style.background = "#fff";
    panel.style.border = "1px solid #aaa";
    panel.style.padding = "10px";
    panel.style.width = "320px";
    panel.style.maxHeight = "60vh";
    panel.style.overflowY = "auto";
    panel.style.fontSize = "14px";
    panel.style.display = "none";
    panel.style.boxShadow = "0 2px 8px rgba(0,0,0,.3)";

    const btn = document.createElement("button");
    btn.textContent = "📥 下載選取章節";
    btn.style.width = "100%";
    btn.style.marginBottom = "8px";

    const selectAllBtn = document.createElement("button");
    selectAllBtn.textContent = "✅ 全選";
    selectAllBtn.style.width = "100%";
    selectAllBtn.style.marginBottom = "6px";

    panel.appendChild(selectAllBtn);

    panel.appendChild(btn);
    panel.appendChild(document.createElement("hr"));

    const concurrentBox = document.createElement("label");
    concurrentBox.style.display = "block";
    concurrentBox.style.marginBottom = "8px";
    concurrentBox.style.cursor = "pointer";
    
    const concurrentCb = document.createElement("input");
    concurrentCb.type = "checkbox";
    concurrentCb.style.marginRight = "6px";
    
    concurrentBox.appendChild(concurrentCb);
    concurrentBox.appendChild(
        document.createTextNode("⚡ 加速模式（併發下載）")
    );
    
    panel.appendChild(concurrentBox);

    const zipBtn = document.createElement("button");
    zipBtn.textContent = "📦 ZIP 壓縮下載";
    zipBtn.style.width = "100%";
    zipBtn.style.marginBottom = "8px";
    
    panel.insertBefore(zipBtn, btn);
    const items = [];

    chapterLinks.forEach(link => {
        const row = document.createElement("div");

        const cb = document.createElement("input");
        cb.type = "checkbox";

        row.appendChild(cb);
        row.appendChild(document.createTextNode(" " + link.textContent.trim()));
        panel.appendChild(row);

        items.push({ cb, url: link.href });
    });

    document.body.appendChild(panel);

    /* ================= TOGGLE ================= */
    icon.onclick = () => {
        panel.style.display = panel.style.display === "none" ? "block" : "none";
    };

    /* ================= DOWNLOAD ================= */
    async function downloadChapter(url) {
        const html = await fetch(url).then(r => r.text());
        const doc = new DOMParser().parseFromString(html, "text/html");

        let title = (doc.title || "未命名章節")
            .replace(" - ESJ Zone", "")
            .trim();

        const content = doc.querySelector("div.forum-content.mt-3");
        if (!content) return;

        content.querySelectorAll("script, style, img").forEach(e => e.remove());

        const body = content.innerText
            .split("\n")
            .map(l => l.trim())
            .filter(Boolean)
            .join("\n");

        const text = `${title}\n\n${body}`;

        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const blobUrl = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `${title}.txt`;
        a.click();

        URL.revokeObjectURL(blobUrl);

        await new Promise(r => setTimeout(r, 800));
    }

    async function fetchChapterText(url) {
        const html = await fetch(url).then(r => r.text());
        const doc = new DOMParser().parseFromString(html, "text/html");
    
        let title = (doc.title || "未命名章節")
            .replace(" - ESJ Zone", "")
            .trim();
    
        const content = doc.querySelector("div.forum-content.mt-3");
        if (!content) return null;
    
        content.querySelectorAll("script, style, img").forEach(e => e.remove());
    
        const body = content.innerText
            .split("\n")
            .map(l => l.trim())
            .filter(Boolean)
            .join("\n");
    
        return {
            title,
            text: `${title}\n\n${body}`
        };
    }

    async function runConcurrent(tasks, limit) {
        const results = [];
        let index = 0;
    
        async function worker() {
            while (index < tasks.length) {
                const current = index++;
                results[current] = await tasks[current]();
            }
        }
    
        const workers = Array.from(
            { length: Math.min(limit, tasks.length) },
            () => worker()
        );
    
        await Promise.all(workers);
        return results;
    }

    btn.onclick = async () => {
        const selected = items.filter(i => i.cb.checked);
        if (selected.length === 0) {
            alert("請先選擇章節");
            return;
        }

        btn.disabled = true;
        btn.textContent = "下載中...";

        for (const item of selected) {
            await downloadChapter(item.url);
        }

        btn.textContent = "完成 ✅";
        btn.disabled = false;
    };

    let allSelected = false;

    selectAllBtn.onclick = () => {
        allSelected = !allSelected;

        items.forEach(item => {
            item.cb.checked = allSelected;
        });

        selectAllBtn.textContent = allSelected ? "❌ 取消全選" : "✅ 全選";
    };

    zipBtn.onclick = async () => {
        const selected = items.filter(i => i.cb.checked);
        if (selected.length === 0) {
            alert("請先選擇章節");
            return;
        }
    
        zipBtn.disabled = true;
        zipBtn.textContent = "📦 打包中...";
    
        const zip = new JSZip();
    
        const useConcurrent = concurrentCb.checked;
        const MAX_CONCURRENT = 4; // ← 可自行調整（建議 3~5）
    
        if (!useConcurrent) {
            // ===== 原本安全模式（單線）=====
            let index = 1;
    
            for (const item of selected) {
                const data = await fetchChapterText(item.url);
                if (!data) continue;
    
                const safeTitle = data.title.replace(/[\\/:*?"<>|]/g, "_");
                zip.file(
                    `${String(index).padStart(3, "0")} - ${safeTitle}.txt`,
                    data.text
                );
    
                index++;
                await new Promise(r => setTimeout(r, 500));
            }
        } else {
            // ===== 併發加速模式 =====
            const tasks = selected.map((item, i) => async () => {
                const data = await fetchChapterText(item.url);
                if (!data) return null;
    
                return {
                    index: i + 1,
                    title: data.title,
                    text: data.text
                };
            });
    
            const results = await runConcurrent(tasks, MAX_CONCURRENT);
    
            results
                .filter(Boolean)
                .sort((a, b) => a.index - b.index)
                .forEach(r => {
                    const safeTitle = r.title.replace(/[\\/:*?"<>|]/g, "_");
                    zip.file(
                        `${String(r.index).padStart(3, "0")} - ${safeTitle}.txt`,
                        r.text
                    );
                });
        }
    
        const blob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(blob);
    
        const a = document.createElement("a");
        a.href = url;
        a.download = "ESJ_小說章節.zip";
        a.click();
    
        URL.revokeObjectURL(url);
    
        zipBtn.textContent = "完成 ✅";
        zipBtn.disabled = false;
    };
})();