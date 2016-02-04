#!/usr/bin/env bash

debconf-set-selections <<< 'mysql-server mysql-server/root_password password test'
debconf-set-selections <<< 'mysql-server mysql-server/root_password_again password test'

# Update all repos
apt-get update

# Upgrade everything already installed
apt-get upgrade

# Install node
sudo curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install npm
sudo apt-get install -y npm

# Update npm to latest version
sudo npm install -g npm

# Install mysql
sudo apt-get install -y mysql-server

# Setup database user, password and structure
sudo mysql -ptest < /vagrant/scripts/db-setup.sql

# Add some test data
sudo mysql -ptest hearthstone_legends < /vagrant/scripts/db-data.sql

# Install dependencies needed for node-canvas
sudo apt-get install -y libcairo2-dev libjpeg8-dev libpango1.0-dev libgif-dev build-essential g++

cd /vagrant
sudo npm install --production

cp /vagrant/scripts/testconfig.json /vagrant/config.json

# Link "nodejs" to "node" on Ubuntu
if [ ! -L /usr/bin/node ];
then
    echo "Creating symlink from nodejs to node"
    sudo ln -s `which nodejs` /usr/bin/node
fi
