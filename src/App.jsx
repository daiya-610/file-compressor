import React, { useState } from 'react';
import imageCompression from 'browser-image-compression';
import { PDFDocument } from 'pdf-lib';

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // 設定ステート
  const [maxSize, setMaxSize] = useState(1); // 目標サイズ(MB)
  const [quality, setQuality] = useState(0.8); // 圧縮品質(0.1 ~ 1.0)

  // 画像の圧縮
  const compressImage = async (file) => {
    const options = {
      maxSizeMB: maxSize, // ユーザー指定のサイズ
      initialQuality: quality, // ユーザー指定の品質
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };
    return await imageCompression(file, options);
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
        // PDFは構造上の最適化を試みる
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
      
      // メモリ解放
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('圧縮失敗:', error);
      alert('ファイルの圧縮に失敗しました。設定値を調整してください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif', textAlign: 'center', maxWidth: '500px', margin: 'auto' }}>
      <h1>ファイル圧縮ツール</h1>
      <div style={{ marginBottom: '20px', textAlign: 'left' }}>
        <label>1.ファイル選択</label><br />
      <input
        type="file"
        accept="image/*,.pdf"
        onChange={(e) => setFile(e.target.files[0])}
      />
      </div>
      <div style={{ marginBottom: '20px', textAlign: 'left' }}>
        <label>2.目標サイズ（最大100MB）：</label><br />
        <select value={maxSize} onChange={(e) => setMaxSize(Number(e.target.value))}>
          <option value={0.1}>0.1MB（超軽量）</option>
          <option value={1}>1MB（標準）</option>
          <option value={10}>10MB（高画質）</option>
          <option value={50}>50MB（低圧縮）</option>
          <option value={100}>100MB（上限）</option>
        </select>
        <input
        type="number"
        value={maxSize}
          min="0.1"
          max="100"
        onChange={(e) => setMaxSize(Math.min(100, Number(e.target.value)))}
        style={{ width: '60px', marginLeft: '10px'}}
        /> MB
      </div>

      <div style={{ marginBottom: '20px', textAlign: 'left' }}>
        <label>3.圧縮品質（画像のみ）： {Math.round(quality * 100)}%</label><br />
        <input
          type="range"
          min="0.1"
          max="1.0"
          step="0.1" // 修正: minを0.1に変更
          value={quality}
          onChange={(e) => setQuality(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>
      <button
        onClick={handleDownload}
        disabled={!file || loading}
        style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
      >
        {loading ? '圧縮中...' : `${file ? file.name : 'ファイル'}を圧縮して保存`}
      </button>
      {file && (
        <p style={{ fontSize: '0.8rem', marginTop: '10px' }}>
          元のサイズ： {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>
      )}
    </div>
  );
}

export default App;