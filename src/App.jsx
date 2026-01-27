import React, { useState } from 'react';
import imageCompression from 'browser-image-compression';
import { PDFDocument } from 'pdf-lib';

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // 画像の圧縮
  const compressImage = async (imageFile) => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };
    return await imageCompression(imageFile, options);
  };

  // PDFの圧縮（簡易版）
  const compressPDF = async (pdfFile) => {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    // pdf-libで保存する際、未使用のオブジェクトを除去して軽量化する
    const compressedPdfBytes = await pdfDoc.save({ useObjectStreams: true });
    return new Blob([compressedPdfBytes], { type: 'application/pdf' });
  };

  const handleDownload = async () => {
    if (!file) return;
    setLoading(true);

    try {
      let compressedBlob;
      if (file.type.includes('image')) {
        compressedBlob = await compressImage(file);
      } else if (file.type === 'application/pdf') {
        compressedBlob = await compressPDF(file);
      } else {
        return;
      }

      // ダウンロード処理
      const url = URL.createObjectURL(compressedBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `compressed_${file.name}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('圧縮失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>ファイル圧縮ツール</h1>
      <input
        type="file"
        accept="image/*,.pdf"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <br />
      <button onClick={handleDownload} disabled={!file || loading}>
        {loading ? '圧縮中...' : '圧縮してダウンロード'}
      </button>
    </div>
  );
}

export default App;