<template>
  <div class="screen menu-screen">
    <h1 class="title">散歩ゲーム</h1>
    
    <div class="auth-section">
      <div v-if="!isLoggedIn" class="login-form">
        <input 
          v-model="userIdInput" 
          placeholder="ユーザーIDを入力してください" 
          @keyup.enter="handleLogin"
        />
        <button @click="handleLogin" class="btn">ログイン / 登録</button>
      </div>

      <div v-else class="user-info">
        <p class="welcome">ようこそ、<strong>{{ userId }}</strong> さん</p>
        <div class="stats">
          <h3>【 戦績 】</h3>
          <p>最高スコア: <span class="score-val">{{ highScore }}</span></p>
        </div>
        <button @click="$emit('go-to-start')" class="btn primary">スタート画面へ</button>
        <button @click="handleLogout" class="btn-link">IDを変更する</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps(['userId', 'highScore']);
const emit = defineEmits(['login', 'logout', 'go-to-start']);

const userIdInput = ref('');
const isLoggedIn = ref(!!props.userId);

const handleLogin = () => {
  if (userIdInput.value.trim()) {
    isLoggedIn.value = true;
    emit('login', userIdInput.value);
  }
};

const handleLogout = () => {
  isLoggedIn.value = false;
  userIdInput.value = '';
  emit('logout');
};
</script>

<style scoped>
.menu-screen { background: #e0f7fa; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; }
.title { font-size: 3rem; color: #00796b; margin-bottom: 2rem; text-shadow: 2px 2px #fff; }
.auth-section { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
input { padding: 10px; font-size: 16px; border: 2px solid #ddd; border-radius: 4px; margin-right: 10px; }
.btn { padding: 10px 20px; font-weight: bold; cursor: pointer; border-radius: 4px; border: none; background: #00796b; color: white; transition: 0.2s; }
.btn:hover { background: #004d40; }
.btn.primary { background: #ff9800; font-size: 1.2rem; margin-top: 1rem; }
.stats { margin: 1.5rem 0; border-top: 1px dashed #ccc; padding-top: 1rem; }
.score-val { font-size: 1.5rem; color: #d32f2f; font-weight: bold; }
.btn-link { background: none; border: none; color: #666; text-decoration: underline; cursor: pointer; margin-top: 10px; }
</style>