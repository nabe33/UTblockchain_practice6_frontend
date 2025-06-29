import { ethers, isAddress } from 'ethers'
import contractData from '@/blockchain/abi/AssetManager.json'

// ファイルのSHA256ハッシュを計算する関数
export async function calculateFileSHA256(file) {
  try {
    const buffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return '0x' + hashHex
  } catch (error) {
    console.error('SHA256計算エラー:', error)
    throw error
  }
}

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

// 資産を加算する（登録済みアドレスのみ）
// export async function registAssetService(yen) {
//   try {
//     const signer = await _connectWallet()
//     if (!signer) throw new Error('ウォレットが接続されていません')
//     const contract = new ethers.Contract(contractAddress, contractABI, signer)
//     const tx = await contract.registAsset(yen)
//     await tx.wait()
//     return tx
//   } catch (error) {
//     console.error('registAssetServiceエラー:', error)
//     return null
//   }
// }

// 資産とハッシュ値を登録する（登録済みアドレスのみ）
export async function registerAssetWithHashService(yen, hashValue) {
  try {
    console.log('=== registerAssetWithHashService 開始 ===')
    console.log('入力値 - yen:', yen, typeof yen)
    console.log('入力値 - hashValue:', hashValue, typeof hashValue)

    const signer = await _connectWallet()
    if (!signer) throw new Error('ウォレットが接続されていません')

    const signerAddress = await signer.getAddress()
    console.log('署名者アドレス:', signerAddress)

    const contract = new ethers.Contract(contractAddress, contractABI, signer)

    // コントラクトの利用可能な関数をログ出力
    console.log('利用可能なコントラクト関数:')
    const functions = contract.interface.fragments.filter(f => f.type === 'function')
    functions.forEach(func => {
      console.log('- 関数名:', func.name, '引数:', func.inputs.map(i => `${i.name}:${i.type}`))
    })

    // 特に資産とハッシュに関連する関数を探す
    const assetHashFunctions = functions.filter(f =>
      f.name.toLowerCase().includes('asset') && f.name.toLowerCase().includes('hash')
    )
    console.log('資産・ハッシュ関連関数:', assetHashFunctions.map(f => f.name))

    // registerAssetWithHash関数の存在確認
    const targetFunction = functions.find(f => f.name === 'registerAssetWithHash')
    if (targetFunction) {
      console.log('registerAssetWithHash関数が見つかりました:', targetFunction)
    } else {
      console.warn('registerAssetWithHash関数が見つかりません。代替関数を探します...')
      const alternatives = functions.filter(f =>
        f.name.toLowerCase().includes('register') ||
        f.name.toLowerCase().includes('asset')
      )
      console.log('代替候補:', alternatives.map(f => f.name))
    }

    // 送信者が登録済みかチェック（コントラクトの isRegistered を直接使用）
    try {
      console.log('コントラクトの isRegistered をチェック中...')
      const isRegisteredDirect = await contract.isRegistered(signerAddress)
      console.log('コントラクト内の登録状況:', isRegisteredDirect)

      if (!isRegisteredDirect) {
        alert('送信者アドレスがコントラクトに登録されていません。先にアドレスを登録してください。')
        return null
      }

      // 追加チェック: assetsマッピングの確認
      const currentAsset = await contract.assets(signerAddress)
      console.log('現在の資産額:', currentAsset.toString())

      // 既に資産がある場合の警告
      if (currentAsset > 0) {
        console.warn(`注意: このアドレスには既に ${currentAsset.toString()} の資産が登録されています`)
        console.log('新しい資産額は既存の額に加算されます')
      }

      // hashValuesマッピングの確認（エラーを許容）
      try {
        const currentHash = await contract.getHashValue(signerAddress)  // getter関数を使用
        // const currentHash = await contract.hashValues(signerAddress) // mappingを呼び出す旧形式（エラーが出る可能性あり）
        console.log('現在のハッシュ値:', currentHash)
        if (currentHash && currentHash !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
          console.warn('注意: このアドレスには既にハッシュ値が登録されています:', currentHash)
          console.log('新しいハッシュ値で上書きされます')
        }
      } catch (hashError) {
        console.warn('hashValues読み取りエラー（処理続行）:', hashError.message)
        console.log('hashValuesマッピングにアクセスできませんが、処理を続行します')
      }

    } catch (checkError) {
      console.error('登録状況チェックエラー:', checkError)
      // isRegistered で失敗した場合のみ処理を停止
      if (checkError.message.includes('isRegistered')) {
        alert('登録状況の確認でエラーが発生しました: ' + checkError.message)
        return null
      } else {
        console.warn('一部のコントラクト読み取りでエラーが発生しましたが、処理を続行します')
      }
    }

    // hashValueをbytes32形式に変換（複数の方法を試す）
    let formattedHashValue
    let hashValueAsString = hashValue // 元の文字列も保持

    if (typeof hashValue === 'string' && hashValue.startsWith('0x')) {
      // 0xで始まる16進数文字列の場合
      const hexString = hashValue.slice(2) // 0xを除去
      if (hexString.length !== 64) {
        throw new Error(`無効なハッシュ値の長さです。期待値: 64文字, 実際: ${hexString.length}文字`)
      }

      // 複数の形式を試す
      formattedHashValue = ethers.getBytes(hashValue) // Uint8Array形式
      hashValueAsString = hashValue // 文字列形式
    } else if (typeof hashValue === 'string') {
      // 通常の文字列の場合はSHA256ハッシュを生成
      const hashHex = ethers.id(hashValue)
      formattedHashValue = ethers.getBytes(hashHex)
      hashValueAsString = hashHex
    } else {
      throw new Error('ハッシュ値は文字列である必要があります')
    }

    console.log('元のハッシュ値:', hashValue)
    console.log('文字列形式:', hashValueAsString)
    console.log('Uint8Array形式:', ethers.hexlify(formattedHashValue))
    console.log('バイト配列長:', formattedHashValue.length)

    // yenを適切な形式に変換
    const formattedYen = ethers.parseUnits(yen.toString(), 0) // 整数として扱う
    console.log('変換後yen:', formattedYen.toString())

    console.log('コントラクト呼び出し開始...')
    console.log('呼び出し関数: registerAssetWithHash')
    console.log('パラメータ1 (yen):', formattedYen.toString(), 'type:', typeof formattedYen)
    console.log('パラメータ2 (hash):', ethers.hexlify(formattedHashValue), 'type:', typeof formattedHashValue)

    // デバッグ: 実際にコントラクトのrequire文をチェック
    console.log('=== コントラクト状態の詳細チェック ===')
    try {
      // 1. isRegistered の再確認
      const isReg = await contract.isRegistered(signerAddress)
      console.log('再チェック - isRegistered[sender]:', isReg)

      // 2. msg.sender のアドレス確認
      console.log('送信者アドレス:', signerAddress)

      // 3. パラメータの詳細確認
      console.log('yen パラメータ詳細:', {
        value: formattedYen.toString(),
        type: typeof formattedYen,
        constructor: formattedYen.constructor.name
      })

      console.log('hashValue パラメータ詳細:', {
        hex: ethers.hexlify(formattedHashValue),
        length: formattedHashValue.length,
        type: typeof formattedHashValue,
        constructor: formattedHashValue.constructor.name,
        isUint8Array: formattedHashValue instanceof Uint8Array
      })

    } catch (debugError) {
      console.error('デバッグチェックエラー:', debugError)
    }

    // 利用可能な関数から正しい関数を特定
    const availableFunctions = contract.interface.fragments.filter(f => f.type === 'function')
    let targetFunctionName = 'registerAssetWithHash'

    // registerAssetWithHash関数が存在するかチェック
    if (!availableFunctions.find(f => f.name === 'registerAssetWithHash')) {
      // 代替候補を探す
      const alternatives = availableFunctions.filter(f => {
        const name = f.name.toLowerCase()
        return (name.includes('register') && name.includes('asset') && name.includes('hash')) ||
               (name.includes('asset') && name.includes('hash'))
      })

      if (alternatives.length > 0) {
        targetFunctionName = alternatives[0].name
        console.log('代替関数を使用:', targetFunctionName)
      } else {
        throw new Error('適切な関数が見つかりません。利用可能な関数: ' + availableFunctions.map(f => f.name).join(', '))
      }
    }

    // 動的に関数を取得
    const contractFunction = contract[targetFunctionName]
    if (!contractFunction) {
      throw new Error(`関数 ${targetFunctionName} がコントラクトに存在しません`)
    }

    // まずは静的なコールで事前チェック（実際のトランザクションなしでテスト）
    try {
      console.log('=== 静的コールでの事前チェック ===')
      console.log('静的コール実行中...')
      await contract[targetFunctionName].staticCall(formattedYen, formattedHashValue)
      console.log('静的コール成功 - require文は通過します')
    } catch (staticError) {
      console.error('静的コールエラー:', staticError)
      console.error('静的コールエラー詳細:', {
        code: staticError.code,
        reason: staticError.reason,
        data: staticError.data,
        message: staticError.message
      })

      // 静的コールが失敗しても、実際のガス見積もりを試行
      console.warn('静的コールは失敗しましたが、ガス見積もりを試行します')
    }

    // まずはガス見積もりを試行（Uint8Array形式）
    try {
      console.log(`${targetFunctionName} - Uint8Array形式でガス見積もり試行...`)
      const gasEstimate = await contractFunction.estimateGas(formattedYen, formattedHashValue)
      console.log('Uint8Array形式でガス見積もり成功:', gasEstimate.toString())

      // 実際のトランザクション送信
      const tx = await contractFunction(formattedYen, formattedHashValue, {
        gasLimit: gasEstimate * 2n // ガス上限を2倍に設定
      })
      console.log('Uint8Array形式でトランザクション送信完了:', tx.hash)

      await tx.wait()
      console.log('Uint8Array形式でトランザクション確認完了')
      return tx
    } catch (gasError) {
      console.error('Uint8Array形式でガス見積もりエラー:', gasError)

      // 文字列形式を試してみる
      try {
        console.log(`${targetFunctionName} - 文字列形式でガス見積もり試行...`)
        const gasEstimate2 = await contractFunction.estimateGas(formattedYen, hashValueAsString)
        console.log('文字列形式でガス見積もり成功:', gasEstimate2.toString())

        const tx = await contractFunction(formattedYen, hashValueAsString, {
          gasLimit: gasEstimate2 * 2n
        })
        console.log('文字列形式でトランザクション送信完了:', tx.hash)

        await tx.wait()
        console.log('文字列形式でトランザクション確認完了')
        return tx
      } catch (altError) {
        console.error('文字列形式もエラー:', altError)
        throw gasError // 元のエラーを投げる
      }
    }
  } catch (error) {
    console.error('registerAssetWithHashServiceエラー:', error)
    console.error('エラー詳細:', {
      code: error.code,
      reason: error.reason,
      data: error.data,
      transaction: error.transaction
    })

    if (error.reason === 'Sender is not a registered address') {
      alert('送信者が登録されていません。先にアドレスを登録してください。')
    } else if (error.reason && error.reason.includes('require')) {
      alert('コントラクト実行エラー: ' + error.reason)
    } else {
      alert('資産とハッシュ値の登録時にエラーが発生しました: ' + error.message)
    }
    return null
  }
}

// 指定アドレスの資産額を取得
// export async function getAssetService(addr) {
//   try {
//     const contract = new ethers.Contract(contractAddress, contractABI, provider)
//     const asset = await contract.getAsset(addr)
//     // assetはBigNumber型の場合が多いので数値に変換
//     return asset.toNumber ? asset.toNumber() : Number(asset)
//   } catch (error) {
//     console.error('getAssetServiceエラー:', error)
//     return null
//   }
// }

// 指定アドレスの資産額とハッシュ値を取得
export async function getAssetWithHashService(addr) {
  try {
    if (!isAddress(addr)) {
      throw new Error('無効なアドレスです')
    }

    const contract = new ethers.Contract(contractAddress, contractABI, provider)
    const result = await contract.getAssetWithHash(addr)

    // resultは[asset, hashValue]の配列として返される
    const asset = result[0].toNumber ? result[0].toNumber() : Number(result[0])
    const hashValue = result[1] // bytes32形式のハッシュ値

    return {
      asset: asset,
      hashValue: hashValue
    }
  } catch (error) {
    console.error('getAssetWithHashServiceエラー:', error)
    return null
  }
}

// 指定アドレスが登録済みかチェックする関数
export async function checkAddressRegistered(addr) {
  try {
    const contract = new ethers.Contract(contractAddress, contractABI, provider)

    // 登録済みアドレス一覧から検索
    const count = await contract.getRegisteredCount()
    const registeredCount = count.toNumber ? count.toNumber() : Number(count)

    for (let i = 0; i < registeredCount; i++) {
      const registeredAddr = await contract.getRegisteredAddress(i)
      if (registeredAddr.toLowerCase() === addr.toLowerCase()) {
        return true
      }
    }
    return false
  } catch (error) {
    console.error('checkAddressRegisteredエラー:', error)
    return false
  }
}
