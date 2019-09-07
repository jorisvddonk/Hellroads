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

export class Color {
  public R: number;
  public G: number;
  public B: number;
  constructor(r: number, g: number, b: number) {
    this.R = r;
    this.G = g;
    this.B = b;
  }

  negative(): Color {
    return new Color(255 - this.R, 255 - this.G, 255 - this.B);
  }

  scale(n: number): Color {
    return new Color(
      Math.floor(this.R * n),
      Math.floor(this.G * n),
      Math.floor(this.B * n)
    );
  }

  toCss(): string {
    return "rgb(" + this.R + "," + this.G + "," + this.B + ")";
  }

  public equals(b: Color): boolean {
    return this.R === b.R && this.G === b.G && this.B === b.B;
  }
}
