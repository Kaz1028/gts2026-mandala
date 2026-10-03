# 外部素材とライブラリ

## Noto Emoji SVG

`emoji/*.svg` はGoogle Noto EmojiのSVG素材です。Copyright 2013 Google, Inc. All Rights Reserved.

- 配布元: https://github.com/googlefonts/noto-emoji
- SVGのライセンス確認元: https://github.com/googlefonts/noto-emoji/blob/v2.047/svg/LICENSE
- 条件: Apache License 2.0
- 本文: [licenses/Apache-2.0.txt](licenses/Apache-2.0.txt)
- 権利表示: [licenses/Noto-Emoji-NOTICE.txt](licenses/Noto-Emoji-NOTICE.txt)

元のファイルを絵文字コードに対応する名前で配置しています。アプリ本体のMITライセンスはこれらの素材のライセンスを変更しません。

## 外部配信

`team.html` はGoogle Fontsとcanvas-confetti 1.9.3（MIT）を外部配信から読み込みます。これらの通信を許可できない環境では、自分でライセンスを確認してローカル配信に置き換えてください。

- canvas-confetti: https://github.com/catdad/canvas-confetti
- Google Fonts: https://fonts.google.com/

npm依存ライブラリは各パッケージに記載されたライセンスに従います。

## 効果音

この公開リポジトリに第三者の音声ファイルは含まれていません。アプリは合成音でも動作します。追加する場合は、音源の利用条件とソースコードでの再配布条件を個別に確認してください。
