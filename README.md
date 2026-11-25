# My News

広告なしで読める、自分用のニュースまとめページ。

- カテゴリ: AI / 世界 / テック・サイエンス / 経済
- 1件ごとに 見出し・要点・出典リンク・日付
- 「あとで読む」の印（ブラウザに保存）

## 仕組み

- 静的サイト（`index.html` / `style.css` / `app.js`）。ビルド不要。
- ニュースは `data/news.json` に保存。
- 追加は `python3 scripts/add_news.py new_items.json`（URL が同じものは自動で除外）。

`new_items.json` の形式:

```json
[{"date": "2026-11-25", "category": "ai", "title": "見出し", "summary": "2〜4文の要点", "source": "出典名", "url": "https://..."}]
```

`category` は `ai` / `world` / `tech` / `economy` のいずれか。

## ローカルで見る

```
python3 -m http.server 8080
```
