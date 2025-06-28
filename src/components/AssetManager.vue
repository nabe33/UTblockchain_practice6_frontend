<script setup>
import { ref, onMounted } from 'vue'
import {
  registAddressService,
  getRegisteredCountService,
  getRegisteredAddressService,
  registAssetService,
  getAssetService,
} from '@/blockchain/ContractService'

const inputAddress = ref('')
const message = ref('')
const addressCount = ref(0)
const addressList = ref([])
const loading = ref(false)

// 資産管理用
const assetYen = ref('')
const assetResult = ref(null)
const assetLoading = ref(false)

// MetaMaskからアドレスを取得
const setMyAddress = async () => {
  if (window.ethereum) {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      inputAddress.value = accounts[0]
    } catch (e) {
      alert('アドレス取得に失敗しました' + e.message)
    }
  } else {
    alert('MetaMaskがインストールされていません')
  }
}

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

// 資産加算
const addAsset = async () => {
  if (!assetYen.value) {
    message.value = '加算する金額を入力してください'
    return
  }
  assetLoading.value = true
  message.value = '資産加算中...'
  const tx = await registAssetService(assetYen.value)
  if (tx) {
    message.value = '資産加算に成功しました'
  } else {
    message.value = '資産加算に失敗しました'
  }
  assetLoading.value = false
}

// 資産取得
const getAsset = async () => {
  if (!inputAddress.value) {
    message.value = 'アドレスを入力してください'
    return
  }
  assetLoading.value = true
  message.value = '資産取得中...'
  const result = await getAssetService(inputAddress.value)
  if (result !== null) {
    assetResult.value = result
    message.value = `資産額: ${result} 円`
  } else {
    message.value = '資産取得に失敗しました'
    assetResult.value = null
  }
  assetLoading.value = false
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
    <div style="text-align: center">
      <button @click="setMyAddress" id="myAddressButton">自分のアドレスを自動入力</button>
    </div>
    <div style="margin-top: 1em; margin-bottom: 1em; color: #2c3e50">{{ message }}</div>

    <div style="margin-bottom: 1em">
      <input
        v-model="assetYen"
        type="number"
        min="0"
        placeholder="加算する資産額（円）"
        style="width: 200px"
      />
      <button @click="addAsset" :disabled="assetLoading">資産加算</button>
      <button @click="getAsset" :disabled="assetLoading" style="margin-left: 1rem">資産取得</button>
      <span v-if="assetResult !== null" style="margin-left: 1em">資産額: {{ assetResult }} 円</span>
    </div>
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
h2 {
  text-align: center;
  margin-bottom: 1rem;
}
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
#myAddressButton {
  margin-top: 0.5rem;
  background: #f0f0f0;
  color: #333;
  padding: 0.4em 1em;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
</style>
