
# Amazon linuxでChromeをインストールするためにやったこと

## YUM更新
```sh
sudo yum -y update
```

## 日本時間(JST)にする
yum update してもUTCに戻らないやり方

```sh
vim /etc/sysconfig/clock

ZONE="Asia/Tokyo"
UTC=false
```

```sh
cp /usr/share/zoneinfo/Japan /etc/localtime
date
Thu Sep  4 10:37:21 JST 2014
```

再起動
```sh
/etc/init.d/crond restart
```

## XVFBインストール
```sh

sudo yum install -y xorg-x11-server-Xvfb
```

## 日本語フォント
```sh
sudo yum install -y xorg-x11-fonts* ipa-gothic-fonts
```
libXcursor.x86_64必要？

## Gitインストール
```sh
sudo yum install -y git
```

## Node.jsインストール
```sh
curl -L git.io/nodebrew | perl - setup
sudo vim ~/.bash_profile

export PATH=$HOME/.nodebrew/current/bin:$PATH

source ~/.bash_profile

nodebrew install-binary v5.4.1
nodebrew use v5.4.1
```

## ロケール設定
```sh
sudo vim /etc/sysconfig/i18n
LANG=en_US.UTF-8
LC_CTYPE=en_US.UTF-8
```

## 8000portを80portへ向ける
```sh
sudo iptables -A PREROUTING -t nat -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 8000
```

## デーモン化のためforeverをインストール
```sh
npm install forever -g
```

## Google Chromeのインストール
```sh
wget https://dl-ssl.google.com/linux/linux_signing_key.pub
sudo rpm –import linux_signing_key.pub

sudo vim /etc/yum.repos.d/google-chrome.repo

[google-chrome]
name=google-chrome - 64-bit
baseurl=http://dl.google.com/linux/chrome/rpm/stable/x86_64
enabled=1
gpgcheck=1
gpgkey=https://dl-ssl.google.com/linux/linux_signing_key.pub

sudo yum install -y google-chrome-stable
```

###  依存関係解決
```sh
sudo vim /etc/yum.repos.d/CentOS-Base.repo

[base]
name=CentOS-6 Base
mirrorlist=http://mirrorlist.centos.org/?release=6&arch=x86_64&repo=os
enabled=0
gpgcheck=1
gpgkey=http://mirror.centos.org/centos/RPM-GPG-KEY-CentOS-6
```

```sh
sudo yum install -y --enablerepo=base tk-devel xdg-utils
sudo yum install -y --enablerepo=base tk-devel libXScrnSaver
sudo yum install -y --enablerepo=base tk-devel atk
sudo yum install -y --enablerepo=base tk-devel gtk2
sudo yum install -y --enablerepo=base tk-devel ftp://ftp.riken.jp/Linux/centos/6/os/x86_64/Packages/GConf2-2.28.0-6.el6.x86_64.rpm
```

sudo yum install -y --enablerepo=base tk-devel gtk3+

※tk-devel必要？意味は？

## Chromedriverのインストール
Chromeのバージョンに対応したChromedriverのインストール
ログを吐く設定にしたい

## Selenium Standaloneのインストール
```sh
npm i selenium-standalone -g

selenium-standalone install --drivers.chrome.version=2.22 --drivers.chrome.baseURL=https://chromedriver.storage.googleapis.com
```

## Webdriverioのインストール　プロダクト内


# 調べる
http://rpm.pbone.net/index.php3?stat=3&search=gtk3-devel&srodzaj=3
RPMとは

# 起動コマンド
```sh
xvfb-run --server-args="-screen 0, 1366x768x24" selenium-standalone start --drivers.chrome.version=2.22 --drivers.chrome.baseURL=https://chromedriver.storage.googleapis.com
```
--server-args='-screen 0, 1366x768x24' selenium-standalone start --drivers.chrome.version=2.22 --drivers.chrome.baseURL=https://chromedriver.storage.googleapis.com


## Firefoxのインストール
### Node.js RPM Packages for Amazon Linux
https://lambda-linux.io/#getting-started

### Install Firefox
https://lambda-linux.io/blog/2015/01/28/announcing-firefox-browser-support-for-amazon-linux/

# Daemon
https://blog.vandenbrand.org/2014/11/05/install-selenium-headless-on-debian-wheezy-optionally-with-ansible/