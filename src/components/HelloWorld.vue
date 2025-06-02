<script setup>
import { ref, onMounted } from 'vue'
import { numberService, incrementService } from '@/blockchain/ContractService'

const message = ref('Fetching data...')

const getNumber = async () => {
  const value = await numberService()
  if (value) {
    message.value = value
  } else {
    message.value = 'データの取得に失敗しました．'
  }
}

const increment = async () => {
  try {
    const tx = await incrementService()
    if (tx) {
      console.log('increment()実行成功:', tx.hash)
      await getNumber() // 更新された値を取得
      message.value = 'Incremented successfully!'
    } else {
      console.error('increment()の呼び出しに失敗しました')
    }
  } catch (error) {
    console.error('Vueコンポーネントでのエラー:', error)
  }
}

onMounted(async () => {
  await getNumber()
})
</script>

<template>
  <div>
    <h1>{{ message }}</h1>
    <button @click="getNumber">Get Contract Number</button>
    <button @click="increment">Increment</button>
  </div>
</template>

<style scoped>
/* 必要であればスタイルを記述 */
</style>
