// ==UserScript==
// @name         ESJ 目錄批次下載 TXT（預設 ZIP）
// @namespace    esj-batch-export
// @version      1.3
// @description  在小說目錄頁勾選章節並直接 ZIP 批次下載 TXT
// @match        https://www.esjzone.cc/detail/*.html
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js
// @downloadURL  https://raw.githubusercontent.com/sakakibara-yoichi/esj-novel-batch-export/master/esj-batch-export.user.js
// @updateURL    https://raw.githubusercontent.com/sakakibara-yoichi/esj-novel-batch-export/master/esj-batch-export.user.js
// ==/UserScript==




(async function () {
    'use strict';

    const chapterLinks = Array.from(
        document.querySelectorAll('#chapterList a[href*="/forum/"]')
    ).filter(a => a.textContent.trim().length > 0);

    if (chapterLinks.length === 0) return;

    /* ================= ICON ================= */
    const icon = document.createElement("div");
    icon.textContent = "📘";
    icon.title = "下載章節 TXT";
    Object.assign(icon.style, {
        position: "fixed",
        right: "20px",
        bottom: "20px",
        zIndex: 9999,
        cursor: "pointer",
        fontSize: "28px",
        background: "#fff",
        border: "1px solid #aaa",
        borderRadius: "50%",
        width: "48px",
        height: "48px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 6px rgba(0,0,0,.3)"
    });
    document.body.appendChild(icon);

    /* ================= PANEL ================= */
    const panel = document.createElement("div");
    Object.assign(panel.style, {
        position: "fixed",
        right: "20px",
        bottom: "80px",
        zIndex: 9999,
        background: "#fff",
        border: "1px solid #aaa",
        padding: "10px",
        width: "320px",
        maxHeight: "60vh",
        overflowY: "auto",
        fontSize: "14px",
        display: "none",
        boxShadow: "0 2px 8px rgba(0,0,0,.3)"
    });

    const btn = document.createElement("button");
    btn.textContent = "📦 下載選取章節（ZIP）";
    btn.style.width = "100%";
    btn.style.marginBottom = "8px";

    const selectAllBtn = document.createElement("button");
    selectAllBtn.textContent = "✅ 全選";
    selectAllBtn.style.width = "100%";
    selectAllBtn.style.marginBottom = "6px";

    panel.appendChild(selectAllBtn);
    panel.appendChild(btn);
    panel.appendChild(document.createElement("hr"));

    /* ===== 併發選項 ===== */
    const concurrentBox = document.createElement("label");
    concurrentBox.style.display = "block";
    concurrentBox.style.marginBottom = "8px";
    concurrentBox.style.cursor = "pointer";

    const concurrentCb = document.createElement("input");
    concurrentCb.type = "checkbox";
    concurrentCb.style.marginRight = "6px";

    concurrentBox.appendChild(concurrentCb);
    concurrentBox.appendChild(document.createTextNode("⚡ 加速模式（併發下載）"));
    panel.appendChild(concurrentBox);

    /* ===== 進度條 ===== */
    const progressWrap = document.createElement("div");
    progressWrap.style.display = "none";

    const progressText = document.createElement("div");
    progressText.style.fontSize = "12px";
    progressText.style.marginBottom = "4px";

    const etaText = document.createElement("div");
    etaText.style.fontSize = "12px";
    etaText.style.color = "#666";
    etaText.style.marginBottom = "4px";
    etaText.textContent = "剩餘時間：計算中…";

    const failText = document.createElement("div");
    failText.style.fontSize = "12px";
    failText.style.color = "#c62828";
    failText.style.marginTop = "6px";
    failText.style.display = "none";


    const currentTitleText = document.createElement("div");
    currentTitleText.style.fontSize = "12px";
    currentTitleText.style.color = "#555";
    currentTitleText.style.marginBottom = "4px";
    currentTitleText.textContent = "目前章節：—";

    const progressBarBg = document.createElement("div");
    Object.assign(progressBarBg.style, {
        width: "100%",
        height: "10px",
        background: "#eee",
        borderRadius: "5px",
        overflow: "hidden"
    });

    const progressBar = document.createElement("div");
    Object.assign(progressBar.style, {
        height: "100%",
        width: "0%",
        background: "#4caf50",
        transition: "width .2s"
    });

    progressBarBg.appendChild(progressBar);
    progressWrap.appendChild(progressText);
    progressWrap.appendChild(progressBarBg);
    progressWrap.insertBefore(currentTitleText, progressText);
    progressWrap.insertBefore(etaText, progressText);
    progressWrap.appendChild(failText);

    panel.appendChild(progressWrap);

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

    icon.onclick = () => {
        panel.style.display = panel.style.display === "none" ? "block" : "none";
    };

    /* ================= 工具函式 ================= */
    async function fetchChapterText(url) {
        const html = await fetch(url).then(r => r.text());
        const doc = new DOMParser().parseFromString(html, "text/html");

        const title = (doc.title || "未命名章節")
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

        return { title, text: `${title}\n\n${body}` };
    }

    async function runConcurrent(tasks, limit) {
        const results = [];
        let index = 0;

        async function worker() {
            while (index < tasks.length) {
                const i = index++;
                results[i] = await tasks[i]();
            }
        }

        await Promise.all(
            Array.from({ length: Math.min(limit, tasks.length) }, worker)
        );

        return results;
    }

    function updateProgress(done, total) {
        const percent = Math.floor((done / total) * 100);
        progressBar.style.width = percent + "%";
        progressText.textContent = `下載中：${done} / ${total}（${percent}%）`;
    }

    function updateETA(done, total, startTime) {
        if (done === 0) return;

        const elapsed = (Date.now() - startTime) / 1000; // 秒
        const avg = elapsed / done;
        const remaining = Math.max(0, Math.round(avg * (total - done)));

        const min = Math.floor(remaining / 60);
        const sec = remaining % 60;

        etaText.textContent =
            `剩餘時間：約 ${min} 分 ${sec} 秒`;
    }


    /* ================= ZIP 下載（預設） ================= */
    btn.onclick = async () => {
        const startTime = Date.now();
        const failedChapters = [];
        const selected = items.filter(i => i.cb.checked);
        if (selected.length === 0) {
            alert("請先選擇章節");
            return;
        }

        btn.disabled = true;
        btn.textContent = "📦 打包中...";
        progressWrap.style.display = "block";

        const zip = new JSZip();
        const useConcurrent = concurrentCb.checked;
        const MAX_CONCURRENT = 4;

        let done = 0;
        const total = selected.length;

        if (!useConcurrent) {
            let index = 1;
            for (const item of selected) {
                try {
                    const data = await fetchChapterText(item.url);
                    if (!data) throw new Error("內容空白");

                    currentTitleText.textContent = "目前章節：" + data.title;

                    const safeTitle = data.title.replace(/[\\/:*?"<>|]/g, "_");
                    zip.file(
                        `${String(index).padStart(3, "0")} - ${safeTitle}.txt`,
                        data.text
                    );
                } catch (err) {
                    const name = item.cb.parentNode.textContent.trim();
                    failedChapters.push(name);
                }

                done++;
                updateProgress(done, total);
                updateETA(done, total, startTime);

                index++;
                await new Promise(r => setTimeout(r, 500));
            }

        } else {
            const tasks = selected.map((item, i) => async () => {
                try {
                    const data = await fetchChapterText(item.url);
                    if (!data) throw new Error("內容空白");

                    currentTitleText.textContent = "目前章節：" + data.title;

                    return {
                        index: i + 1,
                        title: data.title,
                        text: data.text
                    };
                } catch (err) {
                    const name = item.cb.parentNode.textContent.trim();
                    failedChapters.push(name);
                    return null;
                } finally {
                    done++;
                    updateProgress(done, total);
                    updateETA(done, total, startTime);
                }
            });


            const results = await runConcurrent(tasks, MAX_CONCURRENT);
            results.filter(Boolean).forEach(r => {
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
        if (failedChapters.length > 0) {
            failText.style.display = "block";
            failText.textContent =
                `❌ 失敗章節（${failedChapters.length}）：\n` +
                failedChapters.join("、");
        } else {
            failText.style.display = "block";
            failText.textContent = "✅ 全部章節下載成功";
        }

        btn.textContent = "📦 下載選取章節（ZIP）";
        btn.disabled = false;
        currentTitleText.textContent = "目前章節：全部完成 🎉";
        etaText.textContent = "剩餘時間：0 秒";
    };

    let allSelected = false;
    selectAllBtn.onclick = () => {
        allSelected = !allSelected;
        items.forEach(i => (i.cb.checked = allSelected));
        selectAllBtn.textContent = allSelected ? "❌ 取消全選" : "✅ 全選";
    };
})();
