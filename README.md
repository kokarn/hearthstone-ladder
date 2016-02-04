# Development
To setup local build of main js
```shell
npm install --dev
grunt watch
```

To create a box to work on with correct port bindings and stuff like that
```shell
vagrant up
vagrant ssh
node /vagrant/server.js
```

After that everything should be available on `localhost:3000`

# Setup on server
The only real difference from the vagrant setup is iptables port routing.

```shell
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-ports 3000
```

Currently, there is also a pm2 script running to keep everything in check.
