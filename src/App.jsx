import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [quality, setQuality] = useState('ebook');
  const [progress, setProgress] = useState(0);

  // サーバー圧縮中のジワジワ進むアニメーション
  useEffect(() => {
    let interval;
    if (loading && progress >= 50 && progress < 95) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 95) return prev + 1; 
          return prev;
        });
      }, 1000); // 1秒ごとに1%進める
    }
    return () => clearInterval(interval);
  }, [loading, progress]);

  const handleDownload = async () => {
    if (!file) return;
    setLoading(true);
    setProgress(0);
    setStatus('準備中...');

    // FormDataを使用してファイルをラップする
    const formData = new FormData();
    formData.append('file', file);

    try {
      // サーバー（Node.js）へ送信
      const response = await axios.post(`http://localhost:5001/compress-pdf?quality=${quality}`, formData, {
        responseType: 'blob',
        onUploadProgress: (progressEvent) => {
          const percentProgress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          // アップロード分を全体の50%として計算
          const totalMappedProgress = Math.round(percentProgress * 0.5);
          setProgress(totalMappedProgress);
          if (percentProgress < 100) {
            setStatus(`[1/5]ファイルをアップロード中... ${percentProgress}%`);
          } else {
            setStatus(`[2/5]サーバーで圧縮処理中(このまましばらくお待ちください... ${percentProgress}%)`);
          }
        }
      });
      setStatus('[3/5] 圧縮中...');
      // レスポンスをBlobとして受け取り、ダウンロードさせる
      const url = URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `compressed_${file.name}`;
      link.click();
      setStatus('[4/5] ダウンロード中...');
      // メモリ解放
      URL.revokeObjectURL(url);
      setProgress(100);

      setStatus('【5/5】すべての工程が完了しました！');
    } catch (error) {
      console.error('圧縮エラー:', error);
      alert(`ファイルの圧縮に失敗しました。設定値を調整してください。：${error.message}`);
      setStatus('エラーが発生しました。');
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif', textAlign: 'center', maxWidth: '500px', margin: 'auto' }}>
      <h1>ファイル圧縮ツール</h1>
      <div style={{ marginBottom: '20px', textAlign: 'left' }}>
        <label>1. ファイル選択</label><br />
        <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} />
      </div>
      <div style={{ marginBottom: '20px', textAlign: 'left' }}>
        <label>2.圧縮レベルの選択</label><br />
        <select value={quality} onChange={(e) => setQuality(e.target.value)} style={{ width: '100%', padding: '8px' }}>
          <option value="screen">低画質・最小サイズ（72dpi）</option>
          <option value="ebook">標準画質・バランス（150dpi）</option>
          <option value="printer">高画質・印刷用（300dpi）</option>
        </select>
      </div>

      <button
        onClick={handleDownload}
        disabled={!file || loading}
        style={{
          padding: '10px 20px',
          backgroundColor: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: file && !loading ? 'pointer' : 'not-allowed', width: '100%'
        }}
      >
        {loading ? '圧縮中...' : `${file ? file.name : 'ファイル'}を圧縮して保存`}
      </button>
      {loading && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ marginBottom: '8px', fontSize: '1.2rem', fontWeight: 'bold', color: '#007bff' }}>
            {progress}%
          </div>
          <div style={{ width: '100%', backgroundColor: '#e0e0e0', borderRadius: '10px', height: '20px' }}>
            <div style={{
              width: `${progress}%`,
              backgroundColor: progress === 100 ? '#28a745' : '#007bff',
              height: '100%',
              borderRadius: '10px',
              transition: 'width 0.3s ease-in-out'
            }}></div>
          </div>
          <p style={{ marginTop: '10px', fontSize: '0.9rem', color: '#333', fontWeight: 'bold' }}>{status}</p>
        </div>
      )}
      {file && !loading && (
        <p style={{ fontSize: '0.8rem', color: '#666' }}>
          元のサイズ: {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>
      )}
    </div>
  );
}

export default App;