# ESJ 目錄批次下載 TXT

一個用於 **ESJ Zone 小說網站** 的 Userscript，能讓你在小說目錄頁勾選章節並 **批次下載 TXT 檔案**，方便離線閱讀或保存。

---

## 功能

- 在 ESJ Zone 小說目錄頁顯示 **章節勾選面板**。
- 支援 **多章節批次下載** 為 TXT 格式。
- 下載章節時自動整理章節標題與正文，去除圖片、腳本與樣式。
- 簡單直覺的操作介面，點擊圖示即可展開/收合面板。

---

## 安裝方式

1. 安裝 **Tampermonkey** 或其他 Userscript 管理器（Chrome、Firefox 均支援）。
2. 點擊以下連結安裝 Userscript：

[ESJ 目錄批次下載 TXT.user.js](https://github.com/sakakibara-yoichi/esj-novel-batch-export/blob/master/ESJ%20%E7%9B%AE%E9%8C%84%E6%89%B9%E6%AC%A1%E4%B8%8B%E8%BC%89%20TXT-1.1.user.js)  

3. 安裝完成後，打開任何 ESJ Zone 小說目錄頁即可使用。

---

## 使用方法

1. 打開 ESJ Zone 小說目錄頁（例如：`https://www.esjzone.cc/detail/*.html`）。
2. 點擊右下角 📘 圖示，展開章節勾選面板。
3. 勾選想下載的章節。
4. 點擊「📥 下載選取章節」按鈕，即可開始下載。
5. 下載完成後，按鈕會顯示「完成 ✅」。

---

## 注意事項

- 建議 **單次下載章節不要過多**，避免瀏覽器或網站限制導致失敗。
- 腳本會 **去除章節內的圖片與樣式**，只保留文字。
- 若章節內容無法抓取，可能是網站結構已更新，需要更新 Userscript。
- 此腳本僅適用於 **ESJ Zone 的小說目錄頁**。

---

## 更新紀錄

- **v1.1**  
  - 改善下載延遲與穩定性  
  - 修正部分章節抓取失敗問題  

---

## 開發者

- GitHub: [sakakibara-yoichi](https://github.com/sakakibara-yoichi)
