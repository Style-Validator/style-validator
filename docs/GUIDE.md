
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
sudo iptables -A PREROUTING -t nat -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 8080
sudo iptables -A PREROUTING -t nat -i eth0 -p tcp --dport 443 -j REDIRECT --to-port 8443
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


# Pass PATH for system wide
/etc/profile
にnodebrewのパスを通す


# SSL Certificate
https://gist.github.com/davestevens/c9e437afbb41c1d5c3ab


```sh
./certbot-auto certonly --webroot --webroot-path /home/ec2-user/app/style-validator/ -d style-validator.io
```

/etc/letsencrypt/live/style-validator.io/fullchain.pem

IMPORTANT NOTES:
 - Congratulations! Your certificate and chain have been saved at
   /etc/letsencrypt/live/style-validator.io/fullchain.pem. Your cert
   will expire on 2016-09-10. To obtain a new or tweaked version of
   this certificate in the future, simply run certbot-auto again. To
   non-interactively renew *all* of your certificates, run
   "certbot-auto renew"
 - If you lose your account credentials, you can recover through
   e-mails sent to igari.takeharu@gmail.com.
 - Your account credentials have been saved in your Certbot
   configuration directory at /etc/letsencrypt. You should make a
   secure backup of this folder now. This configuration directory will
   also contain certificates and private keys obtained by Certbot so
   making regular backups of this folder is ideal.
 - If you like Certbot, please consider supporting our work by:

   Donating to ISRG / Let's Encrypt:   https://letsencrypt.org/donate
   Donating to EFF:                    https://eff.org/donate-le




# 調べる SSLの後にでた
404 Not Found: ./cgi/common.cgi
404 Not Found: ./stssys.htm



# Install start-stop-daemon
http://ikm.hatenablog.jp/entry/2013/05/23/155550
http://kaihatsu.mikagamikobo.com/2010/11/start-stop-daemoncentos.html
```sh
sudo yum install gcc

cd /usr/local/src
wget http://developer.axis.com/download/distribution/apps-sys-utils-start-stop-daemon-IR1_9_18-2.tar.gz
tar xvzf apps-sys-utils-start-stop-daemon-IR1_9_18-2.tar.gz
cd apps/sys-utils/start-stop-daemon-IR1_9_18-2/
gcc start-stop-daemon.c -o start-stop-daemon
cp start-stop-daemon /usr/sbin/
```