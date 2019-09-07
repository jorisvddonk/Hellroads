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

import { RandomAccessBitStream } from "./BitStream";

export class ArrayBitStream implements RandomAccessBitStream {
  private data: number[];
  private idx: number;
  constructor(data: number[]) {
    this.data = data;
    this.idx = 0;
  }

  public getBit(): number {
    var idx = this.idx;
    this.idx++;

    var byteIdx = Math.floor(idx / 8),
      bitIdx = 7 - (idx % 8);

    return (this.data[byteIdx] & (1 << bitIdx)) >> bitIdx;
  }

  public setPosition(idx: number) {
    this.idx = idx;
  }

  public getPosition(): number {
    return this.idx;
  }

  public eof(): boolean {
    return this.idx >= this.data.length * 8;
  }

  public getLength(): number {
    return this.data.length * 8;
  }
}
