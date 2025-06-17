<script setup>
import { ref, onMounted } from 'vue'
import {
  registAddressService,
  getRegisteredCountService,
  getRegisteredAddressService,
} from '@/blockchain/ContractService'

const inputAddress = ref('')
const message = ref('')
const addressCount = ref(0)
const addressList = ref([])
const loading = ref(false)

// アドレス登録
const registerAddress = async () => {
  if (!inputAddress.value) {
    message.value = 'アドレスを入力してください'
    return
  }
  loading.value = true
  message.value = '登録中...'
  const tx = await registAddressService(inputAddress.value)
  if (tx) {
    message.value = '登録に成功しました'
    inputAddress.value = ''
    await fetchAddressCount()
    await fetchAddressList()
  } else {
    message.value = '登録に失敗しました'
  }
  loading.value = false
}

// 登録数取得
const fetchAddressCount = async () => {
  const count = await getRegisteredCountService()
  addressCount.value = count ?? 0
}

// 登録アドレス一覧取得
const fetchAddressList = async () => {
  await fetchAddressCount()
  addressList.value = []
  for (let i = 0; i < addressCount.value; i++) {
    const addr = await getRegisteredAddressService(i)
    addressList.value.push(addr)
  }
}

onMounted(() => {
  fetchAddressCount()
  fetchAddressList()
})
</script>

<template>
  <div class="container">
    <h2>アドレス登録デモ</h2>
    <div>
      <input v-model="inputAddress" placeholder="アドレスを入力" style="width: 400px" />
      <button @click="registerAddress" :disabled="loading">登録</button>
    </div>
    <div style="margin-top: 1em; margin-bottom: 1em; color: #2c3e50">{{ message }}</div>
    <hr />
    <div style="margin-top: 2em">
      <strong>登録済みアドレス数: {{ addressCount }}</strong>
      <ul v-if="addressList.length" style="margin-top: 1em">
        <li v-for="(addr, idx) in addressList" :key="addr">{{ idx + 1 }}: {{ addr }}</li>
      </ul>
      <div v-else style="margin-top: 1em">登録されたアドレスはありません</div>
    </div>
  </div>
</template>

<style scoped>
.container {
  background: #249a57;
  width: 600px;
  min-height: 100vh;
  padding: 2em;
  font-family: 'BIZ UDPGothic', Arial, sans-serif;
}
input {
  margin-right: 0.5em;
  padding: 0.4em;
}
button {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(44, 62, 80, 0.12);
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
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
button:hover:enabled {
  box-shadow: 0 4px 16px rgba(44, 62, 80, 0.18);
  background: #d5de5e;
}
</style>
