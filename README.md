# 綠綠網站
原生 HTML、CSS、JavaScript 單頁網站，沒有框架、後端或登入。

## 不用下載的私人預覽
1. 在 GitHub 專案按綠色 **Code** → **Codespaces** → **Create codespace on main**。
2. 等候環境啟動；網站會自動啟動並開啟預覽。
3. 若沒有自動出現，開啟下方 **Ports（連接埠）**，找到 **3000**，按地球圖示 **Open in Browser**。
4. **Port Visibility 請保持 Private**，只有獲授權並登入 GitHub 的使用者能存取。
5. 捲動到簡介下方，即可看到角色切換；前一張完全淡出後，下一張才出現。

Codespaces 可能使用 GitHub 免費額度，超出額度依帳號計費；看完後可到 https://github.com/codespaces 停止環境。
若網站沒有啟動，在終端機輸入 `bash .devcontainer/start-preview.sh`。

## 換內容
- `content.js`：網站文字、社群網址、信箱、角色插畫與素材清單。
- `assets/`：網站使用的圖片與下載檔。根目錄保留原本上傳的檔案。
- 缺少的網址與信箱保留 `null`，畫面顯示準備中，不建立無效連結。
- 頭貼和桌布只有在下載檔實際存在時才會顯示下載；貼圖導向官方商店。

## 本機開發
在本目錄執行 `python3 -m http.server 3000 --bind 0.0.0.0`。
這個專案沒有公開部署；Codespaces 預覽請保持 Private。
