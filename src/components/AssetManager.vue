<script setup>
import { ref, onMounted } from 'vue'
import {
  registAddressService,
  getRegisteredCountService,
  getRegisteredAddressService,
  registerAssetWithHashService,
  getAssetWithHashService,
  calculateFileSHA256,
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

// ファイル関連
const selectedFile = ref(null)
const fileHash = ref('')
const hashLoading = ref(false)
const fileInputRef = ref(null)

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

// ファイル選択
const selectFile = () => {
  fileInputRef.value?.click()
}

// ファイル選択時の処理
const onFileSelect = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  selectedFile.value = file
  message.value = `選択されたファイル: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`

  // 自動的にハッシュを計算
  await calculateHash()
}

// ファイルのSHA256ハッシュを計算
const calculateHash = async () => {
  if (!selectedFile.value) {
    message.value = 'ファイルが選択されていません'
    return
  }

  hashLoading.value = true
  message.value = 'ハッシュ計算中...'

  try {
    const hash = await calculateFileSHA256(selectedFile.value)
    fileHash.value = hash
    message.value = `ハッシュ計算完了: ${hash.substring(0, 20)}...`
  } catch (error) {
    message.value = 'ハッシュ計算に失敗しました: ' + error.message
    fileHash.value = ''
  } finally {
    hashLoading.value = false
  }
}

// 資産とハッシュ値を登録
const addAssetWithHash = async () => {
  if (!assetYen.value) {
    message.value = '加算する金額を入力してください'
    return
  }
  if (!fileHash.value) {
    message.value = 'ファイルを選択してハッシュを計算してください'
    return
  }

  assetLoading.value = true
  message.value = '資産とハッシュ値登録中...'

  try {
    const tx = await registerAssetWithHashService(assetYen.value, fileHash.value)
    if (tx) {
      message.value = '資産とハッシュ値の登録に成功しました'
      assetYen.value = ''
      selectedFile.value = null
      fileHash.value = ''
      if (fileInputRef.value) {
        fileInputRef.value.value = ''
      }
    } else {
      message.value = '資産とハッシュ値の登録に失敗しました'
    }
  } catch (error) {
    if (error && error.reason) {
      message.value = 'エラー: ' + error.reason
    } else if (error && error.message) {
      message.value = 'エラー: ' + error.message
    } else {
      message.value = '予期しないエラーが発生しました'
    }
  } finally {
    assetLoading.value = false
  }
}

// 資産取得
const getAsset = async () => {
  if (!inputAddress.value) {
    message.value = 'アドレスを入力してください'
    return
  }
  assetLoading.value = true
  message.value = '資産取得中...'
  const result = await getAssetWithHashService(inputAddress.value)
  if (result !== null) {
    assetResult.value = result.asset
    message.value = `資産額: ${result.asset} 円, ハッシュ値: ${result.hashValue.substring(0, 20)}...`
  } else {
    message.value = '資産取得に失敗しました'
    assetResult.value = null
  }
  assetLoading.value = false
}

onMounted(async () => {
  await setMyAddress()
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
      <button @click="setMyAddress" id="myAddressButton">
        自アドレス{{ inputAddress ? `(${inputAddress})` : '' }}を自動入力
      </button>
    </div>
    <div style="margin-top: 1em; margin-bottom: 1em; color: #2c3e50">{{ message }}</div>

    <div style="margin-bottom: 1em; margin-top: 3em">
      <!-- ファイル選択とハッシュ計算 -->
      <div style="margin-bottom: 1.5em; padding: 1em; background: rgba(255, 255, 255, 0.1); border-radius: 8px;">
        <h3 style="margin-bottom: 1em; color: #2c3e50;">ファイル選択とハッシュ計算</h3>
        <input
          ref="fileInputRef"
          type="file"
          @change="onFileSelect"
          style="display: none"
        />
        <button @click="selectFile" :disabled="hashLoading" style="margin-right: 1em;">
          ファイル選択
        </button>
        <button
          @click="calculateHash"
          :disabled="!selectedFile || hashLoading"
          v-if="selectedFile"
        >
          ハッシュ再計算
        </button>

        <div v-if="selectedFile" style="margin-top: 1em; font-size: 0.9em;">
          <strong>選択ファイル:</strong> {{ selectedFile.name }}<br>
          <strong>サイズ:</strong> {{ (selectedFile.size / 1024).toFixed(2) }} KB
        </div>

        <div v-if="fileHash" style="margin-top: 1em; font-size: 0.9em; word-break: break-all;">
          <strong>SHA256ハッシュ:</strong><br>
          <code style="background: rgba(0,0,0,0.1); padding: 0.2em; border-radius: 4px;">{{ fileHash }}</code>
        </div>
      </div>

      <!-- 資産登録 -->
      <div>
        <input
          v-model="assetYen"
          type="number"
          min="0"
          placeholder="加算する資産額（円）"
          style="width: 200px"
        />
        <button @click="addAssetWithHash" :disabled="assetLoading || !fileHash">
          資産とハッシュ値を登録
        </button>
      </div>
      <div style="margin-top: 1rem">
        <button @click="getAsset" :disabled="assetLoading" style="margin-left: 2%">
          フォームのアドレスの資産取得
        </button>
        <span v-if="assetResult !== null" style="margin-left: 1em"
          >資産額: {{ assetResult }} 円</span
        >
      </div>
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
code {
  font-family: 'Courier New', monospace;
  font-size: 0.85em;
}
h3 {
  margin: 0;
  font-size: 1.1em;
}
</style>
