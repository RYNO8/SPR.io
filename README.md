# SPR.io
Instructions lorem ipsum dolir sit amet, jfldsk fjdsop csdp cfdklhgcopa, ixh cdspfsih psdxoi shcfldv, hlcfsd.

tested on "Linux localhost 5.10.0-13-amd64 #1 SMP Debian 5.10.106-1 (2022-03-17) x86_64 GNU/Linux"

## Thoughts

### BUGS
 - when maze wall spawns, you get stuck inside if you are on the edge? (check wall collisions on each player update)
 - mobile click drag doesnt work

### TODO
 - rooms
 - game modes
 - colour coded gates
 - https://x-c3ll.github.io/posts/javascript-antidebugging/
 - SEO
 - icon for powerup
 - maze change not just 1 at a time
 - player border style (mope.io)
 - maze render as image with shift, change only on new data
 - client side maze as list of activated e.g. [(row, col, id), ...]
 - layered canvases for maze gradient layers?
 - optimise Math.round (+0.5), Math.ceil, Math.floor: `x | 0` `~~x` `x << 0`

### THINK ABOUT
 - powerup to gain (temporary?) wider field of view
 - powerup to gain partial points
 - powerup to gain temporary speed (maybe link with purple powerup)
 - teleports?

### STYLES

```
 - style new
    - https://app.brandmark.io/v3/
        darkest blue: #13003b
        lightest blue: #53b1fb
        darker: #538cfa
        darker: #5368f9
        darker: #5344f8

    https://www.schemecolor.com/green-blue-with-cream-color-palette.php
        grass green: #37782C
        lighter green: #64BB6A
        pale green: #9FD983
        beige: #FEFED3
        light blue: #3CB3C0
        dark blue: #024064
```

```
 - style old
    - http://colormind.io/
        green: #1D7755
        blue: #60ACBC
        white: #FCF5EF
        orange: #F0A879
        red: #DB423D
        greengrey: #AEB495
```

## Installation (alternatively see docker setup)

### install git
sudo apt-get update

sudo apt-get install git

### install docker
...

### pull repo
cd ~

git clone https://github.com/RYNO8/SPR.io.git

cd SPR.io


### install nodejs, npm
sudo apt update

sudo apt install nodejs npm

npm install


### run
npm run dev