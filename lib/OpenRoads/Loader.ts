/**
 * Adapted from OpenRoads - https://github.com/anprogrammer/OpenRoads
 * Original license information follows:
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 anprogrammer
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { Level, Cell } from "./Level";
import { RandomAccessBitStream } from "./BitStream";
import { BinaryReader } from "./BinaryReader";
import { CompressedByteStream } from "./CompressedByteStream";
import { Color } from "./Color";

export class LevelLoader {
  private levelNumber: number;
  private levelStartByte: number;
  private levelSize: number;

  constructor(levelNumber: number, levelStartByte: number, levelSize: number) {
    this.levelNumber = levelNumber;
    this.levelStartByte = levelStartByte;
    this.levelSize = levelSize;
  }

  public load(stream: RandomAccessBitStream): Level {
    stream.setPosition(this.levelStartByte * 8);
    var reader = new BinaryReader(stream);
    var gravity: number = reader.getUint16();
    var fuel: number = reader.getUint16();
    var oxygen: number = reader.getUint16();

    var colors: Color[] = [];
    for (var i = 0; i < 72; i++) {
      colors.push(
        new Color(
          reader.getUint8() * 4,
          reader.getUint8() * 4,
          reader.getUint8() * 4
        )
      );
    }

    var bytes: number[] = [];
    var stream2 = new BinaryReader(new CompressedByteStream(reader));
    for (var i = 0; i < this.levelSize; i++) {
      bytes.push(stream2.getUint8());
    }

    var levelWidth: number = 7,
      levelLength: number = bytes.length / 2 / levelWidth;

    var level = new Level(
      this.levelNumber > 0 ? "Level " + this.levelNumber : "Demo Level",
      gravity,
      fuel,
      oxygen,
      colors
    );
    var cells: Cell[][] = [];
    for (var x: number = 0; x < levelWidth; x++) {
      var col: Cell[] = [];
      cells.push(col);
      for (var y: number = 0; y < levelLength; y++) {
        var idx = x * 2 + y * 14;
        var colorLow = bytes[idx] & 0xf,
          colorHigh = bytes[idx] >> 4,
          color = colorLow || colorHigh;
        col.push(
          new Cell(level, colorLow, colorHigh, bytes[idx], bytes[idx + 1])
        );
      }
    }
    level.Cells = cells;
    return level;
  }
}

export class MultiLevelLoader {
  public Levels: Level[] = [];
  constructor(stream: RandomAccessBitStream) {
    var reader = new BinaryReader(stream);
    var l1Start: number = reader.getUint16(),
      l1Size: number = reader.getUint16();
    var level1StartBit = l1Start * 8;

    var levels: LevelLoader[] = [];
    levels.push(new LevelLoader(0, l1Start, l1Size));
    for (var i: number = 0; stream.getPosition() < level1StartBit; i++) {
      levels.push(
        new LevelLoader(i + 1, reader.getUint16(), reader.getUint16())
      );
    }

    for (var i: number = 0; i < levels.length; i++) {
      this.Levels.push(levels[i].load(stream));
    }
  }
}
