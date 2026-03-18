<script>
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000', // ここにバックエンドのURLを書く
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;

const inputUsername = ref(''); // ここにユーザーが打った名前が入る
const inputPassword = ref(''); // ここにユーザーが打ったパスワードが入る
// 1. 非同期関数として定義
const registerMemo = async () => {
  // 2. 送信したいデータ（Payload）
  const memoData = {
    title: inputTitle.value,
    content: inputContent.value,
  };

  try {
    // 3. AxiosでPOST実行（URL, データ, 設定の順）
    const response = await api.get('/memos', // エンドポイント
      memoData,                            // 送信データ
      {
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}` // ログインが必要な場合はここにトークンを入れる
        }
      }
    );

    // 4. 成功時の処理
    console.log('登録成功！', response.data);

  } catch (error) {
    // 5. 失敗時の処理
    console.error('通信エラーが発生しました', error);
  }
};
</script>

<template>

</template>