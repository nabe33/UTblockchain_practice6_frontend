import { ethers } from 'ethers'
import contractData from '@/blockchain/abi/Counter.json'
const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS
const provider = new ethers.JsonRpcProvider(import.meta.env.VITE_PROVIDER_URL)
const contractABI = contractData.abi

async function _connectWallet() {
  try {
    const { ethereum } = window
    if (!ethereum) {
      throw new Error('MetaMaskがインストールされていません')
    }
    // うまくいっていることを確認するログ出力
    console.log('MetaMaskがインストールされています')
    console.log('CONTRCT ADDRESS:', contractAddress)
    console.log('PROVIDER URL:', import.meta.env.VITE_PROVIDER_URL)
    console.log('ABI:', contractABI)
    // ウォレットの接続をリクエスト
    const signer = new ethers.BrowserProvider(ethereum).getSigner()
    return signer
  } catch (error) {
    console.error('ウォレット接続エラー:', error)
    return null
  }
}

export async function numberService() {
  try {
    const contract = new ethers.Contract(contractAddress, contractABI, provider)
    const value = await contract.number()
    return value.toString()
  } catch (error) {
    console.error('エラーが発生しました:', error)
    return null
  }
}

export async function incrementService() {
  try {
    const signer = await _connectWallet()
    if (!signer) throw new Error('ウォレットが接続されていません')

    const contractWithSigner = new ethers.Contract(contractAddress, contractABI, signer)
    const tx = await contractWithSigner.increment()
    console.log('トランザクション送信中:', tx.hash)

    await tx.wait() // トランザクションがマイニングされるまで待機
    console.log('トランザクションが完了しました:', tx.hash)

    return tx
  } catch (error) {
    console.error('increment()の呼び出しエラー:', error)
    return null
  }
}
