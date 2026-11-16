# 綠綠網站
原生 HTML、CSS、JavaScript 單頁網站，沒有框架、後端或登入。

## 不用下載的私人預覽
1. 在 GitHub 專案按綠色 **Code** → **Codespaces** → **Create codespace on main**。
2. 等候環境啟動；網站會自動啟動並開啟預覽。
3. 若沒有自動出現，開啟下方 **Ports（連接埠）**，找到 **3000**，按地球圖示 **Open in Browser**。
4. **Port Visibility 請保持 Private**，只有獲授權並登入 GitHub 的使用者能存取。
5. 捲動到簡介下方，即可看到三張藍底圓形角色卡片，由左至右交錯向上浮現；頁面正常捲動，不會停住。

Codespaces 可能使用 GitHub 免費額度，超出額度依帳號計費；看完後可到 https://github.com/codespaces 停止環境。
若網站沒有啟動，在終端機輸入 `bash .devcontainer/start-preview.sh`。

## 換內容
- `content.js`：網站文字、社群網址、信箱、角色插畫與素材清單。
- `assets/`：網站使用的圖片與下載檔。根目錄保留原本上傳的檔案。
- 缺少的網址與信箱保留 `null`，畫面顯示準備中，不建立無效連結。
- 頭貼和桌布只有在下載檔實際存在時才會顯示下載；貼圖逐列浮現並保留官方商店連結，不提供預覽圖下載；封面與角色介紹不提供原圖下載按鈕。

## 本機開發
在本目錄執行 `python3 -m http.server 3000 --bind 0.0.0.0`。
## 公開網站發布
網站發布檔放在 `gh-pages` 分支。儲存庫管理者可至 Settings → Pages，將 Source 設為 Deploy from a branch，選 gh-pages / (root) 並 Save。
開啟 Pages 後，發布流程由 GitHub 執行；完成後在 Pages 設定中取得正式網址。儲存庫其餘開發檔不包含在發布分支中。
Codespaces 預覽仍可保持 Private。
