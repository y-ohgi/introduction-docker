にほんご氏ー

## まずは触ってみる
### Ubuntuを起動する
Imageはスナップショットです。  
Imageを使用することでプロセスを起動することができます。  
このImageのしくみによって環境を一種のエコシステムとして管理することが可能になります。

試しにUbuntuを起動してみましょう。

```
$ docker run -it ubuntu
# cat /etc/issue
Ubuntu 18.04.1 LTS \n \l
```

ubuntuが動きましたしね。

### 好きな言語でDockerを起動する
ここまでnginxとubuntuを起動してきましたが、他のイメージはあるのか探してみましょう
試しにあなたが好きなプログラミング言語があるか探してみましょう
`docker search <LANGUAGE>` で探すことができます。

ここでは試しに `ruby` を探してみましょう。
```
$ docker search ruby
NAME                              DESCRIPTION                                     STARS               OFFICIAL            AUTOMATED
ruby                              Ruby is a dynamic, reflective, object-orient…   1621                [OK]
redmine                           Redmine is a flexible project management web…   712                 [OK]
jruby                             JRuby (http://www.jruby.org) is an implement…   82                  [OK]
circleci/ruby                     Ruby is a dynamic, reflective, object-orient…   56
starefossen/ruby-node             Docker Image with Ruby and Node.js installed    26                                      [OK]
  :
```
復数の `ruby` に一致する復数のイメージがありましたね。

さて、次は見つけたイメージへコマンドを与えてみましょう。  
とりあえず今回はなにか標準出力を出力するようなコマンドを打ってみましょう
```
$ docker run ruby ruby -e "puts 'Hello, Docker!'"
Unable to find image 'ruby:latest' locally
latest: Pulling from library/ruby
741437d97401: Pull complete
34d8874714d7: Pull complete
0a108aa26679: Pull complete
7f0334c36886: Pull complete
49ea0d2b5c48: Pull complete
5238ef6d63d6: Pull complete
6c57ebbe7911: Pull complete
6cf2f39ff067: Pull complete
Digest: sha256:20830a7eb2c48390644cc233fd17520794e5bfce523516fc904068930de16a45
Status: Downloaded newer image for ruby:latest
hoge
```

"Hello, Docker!" と表示することができましたね。

### 対話的に使用する
次はreplを起動してみましょう。  

```
$ docker run -it ruby
irb(main):001:0> puts 'hoge'
hoge
=> nil
irb(main):002:0>
```


## イメージの取得
Dockerのイメージは誰でも公開することができ、

```
$ docker search ruby
NAME                              DESCRIPTION                                     STARS               OFFICIAL            AUTOMATED
ruby                              Ruby is a dynamic, reflective, object-orient…   1620                [OK]
redmine                           Redmine is a flexible project management web…   711                 [OK]
jruby                             JRuby (http://www.jruby.org) is an implement…   82                  [OK]
circleci/ruby                     Ruby is a dynamic, reflective, object-orient…   56
starefossen/ruby-node             Docker Image with Ruby and Node.js installed    26                                      [OK]
heroku/ruby                       Docker Image for Heroku Ruby                    22                                      [OK]
```
