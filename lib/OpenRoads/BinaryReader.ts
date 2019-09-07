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

export class BinaryReader implements BitStream {
  private stream: BitStream;

  constructor(stream: BitStream) {
    this.stream = stream;
  }

  public getBit(): number {
    return this.stream.getBit();
  }

  public getBits(n: number): number {
    var byte: number = 0;
    for (var i: number = 0; i < n; i++) {
      byte |= this.getBit() * (1 << (n - i - 1));
    }
    return byte;
  }

  public getUint8(): number {
    return this.getBits(8);
  }

  public getUint16(): number {
    return this.getUint8() | (this.getUint8() << 8);
  }

  public getUint32(): number {
    return this.getUint16() | (this.getUint16() << 16);
  }

  public getFixedLengthString(len: number) {
    var s = "";
    for (var i = 0; i < len; i++) {
      s += String.fromCharCode(this.getUint8());
    }
    return s;
  }

  public eof(): boolean {
    return this.stream.eof();
  }
}
