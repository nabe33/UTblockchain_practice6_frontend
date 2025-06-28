# UTblockchain_practice_contract

東大ブロックチェーン公開講座の「スマコン開発学習」演習5回目（スライド70）完了

- 講義資料は vue-cli だけど自分は **Vite** 使用．Options APIでなくて**Compositions API**で記述．
- AssetManager.vue と ContractService.jsが主体
- This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### .env.local 設定

```
VITE_PROVIDER_URL=http://localhost:8545
VITE_CONTRACT_ADDRESS=
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
