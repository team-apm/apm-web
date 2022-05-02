# apm-web

AviUtl Package Manager (apm) のパッケージデータを編集するためのWebベースのツール

このツールからプラグインやスクリプトの追加依頼を簡単に送信できます

### 🔗[team-apm.github.io/apm-web/](https://team-apm.github.io/apm-web/)

<br>

![スクリーンショット](./img/screen1.png)

<br>

## コントリビューション

### デバッグ

```powershell
git clone https://github.com/***/apm-web.git
cd apm-web
yarn
yarn prepare:libarchive # Copying WASM
yarn start
```

### デプロイ（GitHub Pages）

```powershell
yarn deploy
```

### フレームワーク

[Create React App](https://github.com/facebook/create-react-app)を使用しています。

### 注意点

Google Formsを編集する際は`src/App.js`内の`formsUrl`、`formsAttribute`に含まれるGoogle Formsへのリンクを適宜変更してください。

パッケージデータの入力画面は`survey.js`により作成されています。[Survey Creator](https://surveyjs.io/create-survey)のJSON Editorに`src/data/survey.json`の内容をコピーアンドペーストしてから`Survey Designer`タブに移動することでGUIによる編集ができます。

Survey Creator (not survey-react) はオンラインで使用する場合に限りライセンスが不要です。非営利目的であれば無料ですが、手続きが必要になるのでapm-webに組み込まないでください。

- [SurveyJs Creator License Model | surveyjs Support](https://web.archive.org/web/20220219115047/https://surveyjs.answerdesk.io/ticket/details/t8256/surveyjs-creator-license-model)
- [surveyjs How far is it free? | surveyjs Support](https://web.archive.org/web/20220219115407/https://surveyjs.answerdesk.io/ticket/details/t2733/surveyjs-how-far-is-it-free)

## ライセンス

コード: MITライセンス
