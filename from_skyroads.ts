import * as fs from "fs";
import { MultiLevelLoader } from "./lib/OpenRoads/Loader";
import { ArrayBitStream } from "./lib/OpenRoads/ArrayBitStream";
import Jimp from "jimp";
import { LevelJSON } from "./levelJSON";
const arr = [...fs.readFileSync("skyroads_data/ROADS.LZS")];
const roadsStream = new ArrayBitStream(arr);
var ll = new MultiLevelLoader(roadsStream);

const TUNNELHEIGHT = 50; // todo: determine tunnel height

try {
  fs.mkdirSync("./lvls");
} catch (e) {
  // ...
}

for (let levelnum = 0; levelnum < ll.Levels.length; levelnum++) {
  const level = ll.Levels[levelnum];
  const height = level.Cells.length;
  const levelJSON: LevelJSON = {
    playerStart: {
      x: 0,
      y: Math.floor(height / 2)
    }
  };
  const width = level.Cells.reduce((memo, cells) => {
    if (cells.length > memo) {
      return cells.length;
    }
    return memo;
  }, 0);
  Jimp.create(width, height, 0x000000ff)
    .then(img => {
      let playerStartX = Infinity;
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          let foundSomething = false;
          const Cell = level.Cells[y][x];
          const CI = Cell.CI;
          const color = level.Colors[CI];
          if (Cell.Tile) {
            foundSomething = true;
            const color = Cell.Tile.Colors.Top;
            const rgb = Jimp.rgbaToInt(
              color.R,
              color.G,
              color.B,
              255,
              () => {}
            );
            img.setPixelColor(rgb, x, y);
          }
          if (Cell.Cube) {
            foundSomething = true;
            const color = Cell.Cube.Colors.Top;
            const rgb = Jimp.rgbaToInt(
              color.R,
              color.G,
              color.B,
              255 - Cell.Cube.Height,
              () => {}
            );
            img.setPixelColor(rgb, x, y);
          }
          if (Cell.Tunnel) {
            foundSomething = true;
            const color = Cell.Tunnel.TunnelColors[0];
            const rgb = Jimp.rgbaToInt(
              color.R,
              color.G,
              color.B,
              255 - TUNNELHEIGHT,
              () => {}
            );
            img.setPixelColor(rgb, x, y);
          }

          if (foundSomething && x < playerStartX) {
            playerStartX = x;
          }
        }
      }
      levelJSON.playerStart.x = playerStartX;
      fs.writeFileSync(
        `./lvls/lvl${levelnum}.json`,
        JSON.stringify(levelJSON, null, 2)
      );
      return img.writeAsync(`./lvls/lvl${levelnum}.png`);
    })
    .catch(console.error);
}
