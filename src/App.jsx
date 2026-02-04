import React, { useState } from 'react';

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (!file) return;
    setLoading(true);

    // FormDataを使用してファイルをラップする
    const formData = new FormData();
    formData.append('file', file);

    try {
      // サーバー（Node.js）へ送信
      const response = await fetch('http://localhost:5001/compress-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'サーバーエラーが発生しました。');
      }

      // レスポンスをBlobとして受け取り、ダウンロードさせる
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `compressed_${file.name}`;
      link.click();

      // メモリ解放
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('圧縮エラー:', error);
      alert(`ファイルの圧縮に失敗しました。設定値を調整してください。：${error.message}`);
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
        accept=".pdf"
        onChange={(e) => setFile(e.target.files[0])}
        />
      </div>
      <button
        onClick={handleDownload}
        disabled={!file || loading}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: file && !loading ? 'pointer' : 'not-allowed'
        }}
      >
        {loading ? '圧縮中...' : `${file ? file.name : 'ファイル'}を圧縮して保存`}
      </button>
      {file && (<p style={{ fontSize: '0.8rem', marginTop: '10px' }}>
          元のサイズ： {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>
      )}
    </div>
  );
}

export default App;