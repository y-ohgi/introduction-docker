マルチステージビルドサンプル
---

# How to
[localhost:8080](localhost:8080)

## マルチステージビルド
```
$ docker buildx build -t multi .
$ docker run -p 8080:8080 multi
```

## ビルドレイヤーを指定してビルド
```
$ docker buildx build -t multi-builder --target builder .
$ docker run -p 8080:8080 multi-builder ./main
```
