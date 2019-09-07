import { writeFileSync } from "fs";

const angles = [
  "2",
  "A",
  "3",
  "B",
  "4",
  "6",
  "E",
  "7",
  "F",
  "8",
  "9",
  "1",
  "G"
];

const animations = ["A", "F", "J"];

const states = ["A", "B", "C", "D"];

const lines = [];

for (let ANIM of animations) {
  for (let STATE of states) {
    for (let ANGLE of angles) {
      lines.push(`Sprite SKY${ANIM}${STATE}${ANGLE}, 1, 1 {
Patch EMPTY, 0, 0
}`);
    }
  }
}

writeFileSync("./temp.txt", lines.join("\n"));
