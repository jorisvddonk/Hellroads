import * as fs from "fs";
import * as WAD from "node-wad";
import Jimp from "jimp";
import { Jimp as IJimp } from "jimp";
import {
  Sector,
  generateUDMF,
  Sidedef,
  Linedef,
  Vertex,
  reffables,
  RefType
} from "./udmf_types";

const getSpriteName = (color: number) => {
  const rgba = Jimp.intToRGBA(color);
  const getCol = i =>
    Math.floor(i / 16)
      .toString(16)
      .toUpperCase();
  return `0${getCol(rgba.r)}${getCol(rgba.g)}${getCol(rgba.b)}`;
};

interface Pixel {
  x: number;
  y: number;
  XS: number;
  YS: number;
  color: number;
  sprite: string;
  lin_N?: Linedef;
  lin_E?: Linedef;
  lin_S?: Linedef;
  lin_W?: Linedef;
  own_N?: boolean;
  own_E?: boolean;
  own_S?: boolean;
  own_W?: boolean;
  sector?: Sector;
  sid_N?: Sidedef;
  sid_E?: Sidedef;
  sid_S?: Sidedef;
  sid_W?: Sidedef;
}

const pixels: Map<number, Map<number, Pixel>> = new Map();
const getPixel = (x: number, y: number) => {
  let M = pixels.get(y);
  if (M !== undefined) {
    return M.get(x);
  }
};
const addPixel = (pixel: Pixel) => {
  let M = pixels.get(pixel.y);
  if (M === undefined) {
    M = new Map();
  }
  M.set(pixel.x, pixel);
  pixels.set(pixel.y, M);
};
class PixelIterator implements Iterable<Pixel> {
  constructor(
    public img: IJimp,
    public pixels: Map<number, Map<number, Pixel>>
  ) {}

  [Symbol.iterator]() {
    let pixels = this.pixels;
    let maxX = this.img.bitmap.width;
    let maxY = this.img.bitmap.height;
    return {
      try: function(x, y) {
        let M = pixels.get(y);
        if (M !== undefined) {
          let Z = M.get(x);
          if (Z !== undefined) {
            return { value: Z, done: false };
          }
        }
      },
      next: function() {
        let retval;
        while (retval === undefined && this.x <= maxX && this.y <= maxY) {
          retval = this.try(this.x, this.y);
          this.x += 1;
          if (this.x >= maxX + 1) {
            this.x = 0;
            this.y += 1;
          }
        }
        if (retval !== undefined) {
          return retval;
        } else {
          return { done: true };
        }
      },
      x: 0,
      y: 0
    };
  }
}

const generateStuffFromimage = function(img: IJimp) {
  const sector0 = generateRoom(
    new Vertex(
      -img.bitmap.width * SCALE * 1.25,
      img.bitmap.height * SCALE * 1.25
    ),
    new Vertex(
      img.bitmap.width * SCALE * 1.25,
      img.bitmap.height * SCALE * 1.25
    ),
    new Vertex(
      img.bitmap.width * SCALE * 1.25,
      -img.bitmap.height * SCALE * 1.25
    ),
    new Vertex(
      -img.bitmap.width * SCALE * 1.25,
      -img.bitmap.height * SCALE * 1.25
    ),
    "0000"
  );

  const transform = (x: number, y: number, img: IJimp) => {
    const X = x - img.bitmap.width / 2;
    const Y = img.bitmap.height / 2 - y;
    return {
      XS: X * SCALE,
      YS: Y * SCALE
    };
  };

  img.scanQuiet(0, 0, img.bitmap.width, img.bitmap.height, (x, y, idx) => {
    const color = img.getPixelColor(x, y);
    const sprite = getSpriteName(color);
    const { XS, YS } = transform(x, y, img);

    if (sprite != "0000") {
      addPixel({
        x: x,
        y: y,
        XS,
        YS,
        color,
        sprite
      });
    }
  });

  const vertices = [];
  const linedefs = [];

  for (var pixel of new PixelIterator(img, pixels)) {
    // create vertices and linedefs for all pixels

    let needs_N = false;
    let needs_E = false;
    let needs_S = false;
    let needs_W = false;

    let pxl_N = getPixel(pixel.x, pixel.y - 1);
    let pxl_E = getPixel(pixel.x + 1, pixel.y);
    let pxl_S = getPixel(pixel.x, pixel.y + 1);
    let pxl_W = getPixel(pixel.x - 1, pixel.y);

    if (pxl_N === undefined || pxl_N.lin_S === undefined) {
      needs_N = true;
    }
    if (pxl_S === undefined || pxl_S.lin_N === undefined) {
      needs_S = true;
    }
    if (pxl_E === undefined || pxl_E.lin_W === undefined) {
      needs_E = true;
    }
    if (pxl_W === undefined || pxl_W.lin_E === undefined) {
      needs_W = true;
    }

    const O = 1 * (SCALE * 0.5 * 1);

    if (needs_N) {
      const v0 = new Vertex(pixel.XS - O, pixel.YS + O);
      const v1 = new Vertex(pixel.XS + O, pixel.YS + O);
      const line = new Linedef(v0, v1);
      pixel.lin_N = line;
      pixel.own_N = true;
      if (pxl_N) {
        pxl_N.lin_S = line;
        pxl_N.own_S = false;
      } else {
        pixel.lin_N.sideback = new Sidedef(sector0, pixel.sprite);
      }
    }

    if (needs_E) {
      const v0 = new Vertex(pixel.XS + O, pixel.YS + O);
      const v1 = new Vertex(pixel.XS + O, pixel.YS - O);
      const line = new Linedef(v0, v1);
      pixel.lin_E = line;
      pixel.own_E = true;
      if (pxl_E) {
        pxl_E.lin_W = line;
        pxl_E.own_W = false;
      } else {
        pixel.lin_E.sideback = new Sidedef(sector0, pixel.sprite);
      }
    }

    if (needs_S) {
      const v0 = new Vertex(pixel.XS + O, pixel.YS - O);
      const v1 = new Vertex(pixel.XS - O, pixel.YS - O);
      const line = new Linedef(v0, v1);
      pixel.lin_S = line;
      pixel.own_S = true;
      if (pxl_S) {
        pxl_S.lin_N = line;
        pxl_S.own_N = false;
      } else {
        pixel.lin_S.sideback = new Sidedef(sector0, pixel.sprite);
      }
    }

    if (needs_W) {
      const v0 = new Vertex(pixel.XS - O, pixel.YS - O);
      const v1 = new Vertex(pixel.XS - O, pixel.YS + O);
      const line = new Linedef(v0, v1);
      pixel.lin_W = line;
      pixel.own_W = true;
      if (pxl_W) {
        pxl_W.lin_E = line;
        pxl_W.own_E = false;
      } else {
        pixel.lin_W.sideback = new Sidedef(sector0, pixel.sprite);
      }
    }
  }

  for (var pixel of new PixelIterator(img, pixels)) {
    // create sectors and sidedefs for all pxels
    pixel.sector = new Sector(pixel.sprite, 10 * SCALE, 0.5 * SCALE);
    pixel.sid_N = new Sidedef(pixel.sector, pixel.sprite);
    pixel.sid_E = new Sidedef(pixel.sector, pixel.sprite);
    pixel.sid_S = new Sidedef(pixel.sector, pixel.sprite);
    pixel.sid_W = new Sidedef(pixel.sector, pixel.sprite);

    if (pixel.own_N) {
      pixel.lin_N.sidefront = pixel.sid_N;
    } else {
      getPixel(pixel.x, pixel.y - 1).lin_S.sideback = pixel.sid_N;
    }

    if (pixel.own_E) {
      pixel.lin_E.sidefront = pixel.sid_E;
    } else {
      getPixel(pixel.x + 1, pixel.y).lin_W.sideback = pixel.sid_E;
    }

    if (pixel.own_S) {
      pixel.lin_S.sidefront = pixel.sid_S;
    } else {
      getPixel(pixel.x, pixel.y + 1).lin_N.sideback = pixel.sid_S;
    }

    if (pixel.own_W) {
      pixel.lin_W.sidefront = pixel.sid_W;
    } else {
      getPixel(pixel.x - 1, pixel.y).lin_E.sideback = pixel.sid_W;
    }
  }

  const { XS, YS } = transform(0, Math.floor(img.bitmap.height / 2), img);
  const udmfText = generateUDMF(XS, YS);
  const w = WAD.WAD.read(fs.readFileSync("./base.wad"));
  const mapLump = w.lumps.find(l => l.name === "TEXTMAP");
  mapLump.data = Buffer.from(udmfText, "utf8");
  fs.writeFileSync("hellroads_maps.wad", w.write());
};

Jimp.read("./lvl.png")
  .then(async img => {
    const colors = new Set();
    img.scanQuiet(0, 0, img.bitmap.width, img.bitmap.height, (x, y, idx) => {
      const color = img.getPixelColor(x, y);
      colors.add(color);
    });

    await Promise.all(
      Array.from(colors).map((color: number) => {
        Jimp.create(16, 16, color)
          .then(img => {
            return img.writeAsync(`./SPRITES/${getSpriteName(color)}.png`);
          })
          .catch(console.error);
      })
    );

    generateStuffFromimage(img);
  })
  .catch(console.error);

const SCALE = 32;
const generateRoom = (
  v0: Vertex,
  v1: Vertex,
  v2: Vertex,
  v3: Vertex,
  texture: string,
  heightfloor?: number
) => {
  const s0 = new Sector(texture, 10 * SCALE, -1 * SCALE);
  const side1 = new Sidedef(s0, texture);
  const side2 = new Sidedef(s0, texture);
  const side3 = new Sidedef(s0, texture);
  const side4 = new Sidedef(s0, texture);

  const line1 = new Linedef(v0, v1, side1);
  const line2 = new Linedef(v1, v2, side2);
  const line3 = new Linedef(v2, v3, side3);
  const line4 = new Linedef(v3, v0, side4);

  return s0;
};
