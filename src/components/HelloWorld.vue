<script setup>
import { ref, onMounted } from 'vue'
import { registerUserService, getUserService, getMyUserService } from '@/blockchain/ContractService'

const message = ref('Fetching data...')
const myName = ref('')
const myAddress = ref('')
const inputName = ref('')
const searchAddress = ref('')
const searchResult = ref(null)
const searchError = ref('')

// 自分のユーザー情報取得
const fetchMyUser = async () => {
  message.value = '自分のユーザー情報を取得中...'
  const result = await getMyUserService()
  if (result && result.addr !== '0x0000000000000000000000000000000000000000') {
    myName.value = result.name
    myAddress.value = result.addr
    message.value = '自分のユーザー情報を取得しました'
  } else {
    myName.value = ''
    myAddress.value = ''
    message.value = 'ユーザー情報が登録されていません'
  }
}

// ユーザー登録
const registerUser = async () => {
  if (!inputName.value) {
    message.value = '名前を入力してください'
    return
  }
  message.value = 'ユーザー登録中...'
  const tx = await registerUserService(inputName.value)
  if (tx) {
    message.value = 'ユーザー登録に成功しました'
    await fetchMyUser()
  } else {
    message.value = 'ユーザー登録に失敗しました'
  }
}

// 指定アドレスのユーザー情報取得
const searchUser = async () => {
  searchError.value = ''
  searchResult.value = null
  if (!searchAddress.value) {
    searchError.value = 'アドレスを入力してください'
    return
  }
  const result = await getUserService(searchAddress.value)
  if (result && result.addr !== '0x0000000000000000000000000000000000000000') {
    searchResult.value = result
  } else {
    searchError.value = 'ユーザーが見つかりません'
  }
}

onMounted(() => {
  fetchMyUser()
})
</script>

<template>
  <div>
    <h1>UserStorageコントラクトのデモ</h1>
    <div>
      <label>名前を登録/更新：</label>
      <input v-model="inputName" placeholder="名前を入力" />
      <button @click="registerUser">User登録</button>
    </div>
    <div style="margin-top: 1em"><strong>メッセージ:</strong> {{ message }}</div>
    <div class="myUserInfo" style="margin-top: 1em">
      <strong>自分のユーザー情報:</strong>
      <ul>
        <li>名前: {{ myName }}</li>
        <li>アドレス: {{ myAddress }}</li>
      </ul>
    </div>
    <hr style="margin-bottom: 1em" />
    <div>
      <h3>アドレスでユーザー検索</h3>
      <input v-model="searchAddress" placeholder="アドレスを入力" style="width: 350px" />
      <button @click="searchUser">User検索</button>
      <div v-if="searchError" style="color: red">{{ searchError }}</div>
      <div v-if="searchResult">
        <div>名前: {{ searchResult.name }}</div>
        <div>アドレス: {{ searchResult.addr }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
input {
  margin: 0.5em;
  padding: 0.4em;
}
h1 {
  margin-bottom: 0.5em;
}
button {
  margin-left: 0.8em;

  border-radius: 8px; /* 角丸 */
  box-shadow: 0 2px 8px rgba(44, 62, 80, 0.12); /* 少し浮き上がる影 */
  border: none;
  background: #fbfbfc;
  color: #10100f;
  padding: 0.2em 1em;
  font-size: 1em;
  cursor: pointer;
  transition:
    box-shadow 0.2s,
    background 0.2s;
}
button:hover {
  box-shadow: 0 4px 16px rgba(44, 62, 80, 0.18);
  background: #d5de5e;
}
strong {
  font-weight: 700;
}
.myUserInfo {
  margin-top: 2em;
  margin-bottom: 2em;
  padding: 0.5em;
  width: 100%;
  border: 1px solid #ccc;
  border-radius: 8px;
  line-height: 2em;
  /* background-color: #f9f9f9; */
}
</style>
