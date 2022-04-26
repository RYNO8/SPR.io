# tested on "Linux localhost 5.10.0-13-amd64 #1 SMP Debian 5.10.106-1 (2022-03-17) x86_64 GNU/Linux"

# install git
sudo apt-get update
sudo apt-get install git

# pull repo
cd ~
git clone https://github.com/RYNO8/SPR.io.git
cd SPR.io

# install nodejs, npm
sudo apt update
sudo apt install nodejs npm
npm install

# run
npm run dev