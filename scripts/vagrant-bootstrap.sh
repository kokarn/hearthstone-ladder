#!/usr/bin/env bash

# Update all repos
apt-get update

# Install node
sudo curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install npm
apt-get install -y npm

# Install dependencies needed for node-canvas
apt-get install -y libcairo2-dev libjpeg8-dev libpango1.0-dev libgif-dev build-essential g++

cd /vagrant
npm install

# Link "nodejs" to "node" on Ubuntu
if [ ! -L /usr/bin/node ];
then
    echo "Creating symlink from nodejs to node"
    sudo ln -s `which nodejs` /usr/bin/node
fi
