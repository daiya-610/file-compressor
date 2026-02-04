import express from "express";
import multer from "multer";
import { exec } from "child_process";
import fs from "fs";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());

// Expressのボディサイズ制限を拡大
app.use(express.json({ limit: "200mb" }));
app.use(express.urlencoded({ limit: "200mb", extended: true }));
// ESモジュールで__dirnameを再現
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// 一時保存用のディレクトリ設定
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MBまで許可
});

app.post("/compress-pdf", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("ファイルがアップロードされませんでした。");
  }
  const inputPath = req.file.path;
  const outputPath = path.join(uploadDir, `compressed_${Date.now()}.pdf`);

  // Ghostscriptコマンド： テキストを保持しつつ、画像をダウンサンプリングして圧縮
  // -dPDFSETTINGS=/ebook (150dpi相当) がバランス良い。
  // より圧縮したい場合は /screen (72dpi相当) を使用する。だが画質がかなり落ちる。
  const gsCommand = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`;

  console.log("圧縮を開始します。");

  exec(gsCommand, (error) => {
    if (error) {
      console.error(`実行エラー： ${error}`);
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      return res.status(500).send("圧縮に失敗しました。");
    }

    // 圧縮されたファイルをクライアントに送信
    res.download(outputPath, "compressed.pdf", () => {
      try {
        // 完了後にファイルを安全に削除
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        console.log("処理完了・ファイル削除済み");
      } catch (e) {
        console.error("ファイル削除エラー:", e);
      }
    });
  });
});

const server = app.listen(5001, () =>
  console.log("Server running on port 5001"),
);

// タイムアウトを10分（600,000ミリ秒）に設定
server.timeout = 600000;
