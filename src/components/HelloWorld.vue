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
    <h2>ユーザー登録デモ</h2>
    <div>
      <label>名前を登録/更新：</label>
      <input v-model="inputName" placeholder="名前を入力" />
      <button @click="registerUser">登録</button>
    </div>
    <div style="margin-top: 1em"><strong>メッセージ:</strong> {{ message }}</div>
    <div style="margin-top: 1em">
      <strong>自分のユーザー情報:</strong>
      <div>名前: {{ myName }}</div>
      <div>アドレス: {{ myAddress }}</div>
    </div>
    <hr />
    <div>
      <h3>アドレスでユーザー検索</h3>
      <input v-model="searchAddress" placeholder="アドレスを入力" style="width: 350px" />
      <button @click="searchUser">検索</button>
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
  margin-right: 0.5em;
}
</style>
