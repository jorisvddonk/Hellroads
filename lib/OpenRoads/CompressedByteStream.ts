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

import { BitStream } from "./BitStream";

import { BinaryReader } from "./BinaryReader";

import { ArrayBitStream } from "./ArrayBitStream";

export class CompressedByteStream implements BitStream {
  private source: BinaryReader;

  private len1: number;
  private len2: number;
  private len3: number;
  private len4: number;
  private buffer: number[] = [];
  private outputStream: BitStream;

  constructor(stream: BinaryReader) {
    this.source = stream;
    this.len1 = this.source.getUint8();
    this.len2 = this.source.getUint8();
    this.len3 = this.source.getUint8();
    this.len4 = 1 << this.len2;
    this.outputStream = new ArrayBitStream(this.buffer);
  }

  private copySet(offset: number) {
    var copyStart = this.buffer.length - 2 - offset;
    var bytesToCopy = this.source.getBits(this.len1) + 1;
    for (var i: number = 0; i <= bytesToCopy; i++) {
      this.buffer.push(this.buffer[copyStart + i]);
    }
  }

  private advanceBuffer(): void {
    if (this.source.getBit() == 1) {
      if (this.source.getBit() == 1) {
        //Raw byte follows
        this.buffer.push(this.source.getUint8());
      } else {
        //Large copy
        var copySize: number = this.source.getBits(this.len3) + this.len4;
        this.copySet(copySize);
      }
    } else {
      var copySize: number = this.source.getBits(this.len2);
      this.copySet(copySize);
    }
  }

  public getBit(): number {
    if (this.outputStream.eof()) {
      this.advanceBuffer();
    }
    return this.outputStream.getBit();
  }

  public eof(): boolean {
    return this.source.eof();
  }
}
