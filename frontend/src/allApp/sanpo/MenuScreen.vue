<template>
  <div class="screen menu-screen">
    <h1>🚶‍♂️ 散歩ゲーム</h1>
    
    <div class="login-box">
      <p>ユーザーIDを入力してください</p>
      <input 
        v-model="localUserId" 
        placeholder="User ID..." 
        @keyup.enter="handleLogin"
      />
      <button @click="handleLogin">ログイン</button>
    </div>

    <div class="ranking">
      <h3>🏆 トップランカー</h3>
      <ul>
        <li v-for="(rank, i) in highScores" :key="i">
          <span class="rank-num">{{ i + 1 }}位</span>
          <span class="rank-id">{{ rank.id }}</span>
          <span class="rank-score">{{ rank.score }}pt</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['login']);
const localUserId = ref('');

// ダミーの戦績データ
const highScores = ref([
  { id: 'Hero_99', score: 5000 },
  { id: 'SampleUser', score: 2500 },
  { id: 'Guest123', score: 800 },
]);

const handleLogin = () => {
  if (localUserId.value.trim()) {
    emit('login', localUserId.value);
  } else {
    alert('IDを入力してください');
  }
};
</script>

<style scoped>
.menu-screen {
  background: #fdf6e3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}
.login-box {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  margin-bottom: 30px;
}
input {
  padding: 10px;
  border: 2px solid #eee;
  border-radius: 4px;
  margin-right: 5px;
}
button {
  padding: 10px 20px;
  background: #2aa198;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.ranking {
  width: 80%;
  max-width: 300px;
}
ul { list-style: none; padding: 0; }
li {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  border-bottom: 1px solid #ddd;
}
.rank-num { font-weight: bold; color: #b58900; }
</style>