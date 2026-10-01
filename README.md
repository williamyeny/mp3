# mp3

A small static site comparing every Sony Walkman E Series player (NW-E and NWZ-E, 2000–2016), with photos of each generation. Live at https://will-ye.com/mp3/.

All series data, including photo captions and credits, lives in `data.js`. Photos are in `images/<series>/`; to add one, put a JPEG there, run `./make-variants.sh` to turn it into the WebP sizes the site loads, and add it to `data.js` (without an extension). There's no build step; open `index.html` or serve the folder.
