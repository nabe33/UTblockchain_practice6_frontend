import { ethers, isAddress } from 'ethers'
import contractData from '@/blockchain/abi/AssetManager.json'
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

// AssetManagerコントラクトのサービス関数
// 任意のアドレスを登録
export async function registAddressService(addr) {
  try {
    const signer = await _connectWallet()
    if (!signer) throw new Error('ウォレットが接続されていません')
    const contract = new ethers.Contract(contractAddress, contractABI, signer)
    // アドレスの形式をチェック
    console.log('ethers.utils: ' + ethers.utils)
    if (!isAddress(addr)) {
      alert('無効なアドレスです。正しいEthereumアドレスを入力してください。')
      return null
    }
    try {
      const tx = await contract.registAddress(addr)
      await tx.wait()
      return tx
    } catch (error) {
      // revert理由を取得
      if (error.reason === 'Address already registered') {
        alert('このアドレスはすでに登録されています。')
      } else {
        alert('登録時にエラーが発生しました: ' + error.message)
      }
    }
  } catch (error) {
    console.error('registAddressServiceエラー:', error)
    return null
  }
}

// 登録済みアドレスの数を取得
export async function getRegisteredCountService() {
  try {
    const contract = new ethers.Contract(contractAddress, contractABI, provider)
    const count = await contract.getRegisteredCount()
    return count.toNumber ? count.toNumber() : Number(count)
    // .toNumber()を使用して数値に変換．それが出来ない場合はNumber()で数値に変換
  } catch (error) {
    console.error('getRegisteredCountServiceエラー:', error)
    return null
  }
}

// インデックス指定で登録済みアドレスを取得
export async function getRegisteredAddressService(index) {
  try {
    const contract = new ethers.Contract(contractAddress, contractABI, provider)
    const addr = await contract.getRegisteredAddress(index)
    return addr
  } catch (error) {
    console.error('getRegisteredAddressServiceエラー:', error)
    return null
  }
}
