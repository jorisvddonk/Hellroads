import { iterate } from "iterare";
import { IteratorWithOperators } from "iterare/lib/iterate";

interface Serializable {
  serialize: () => string;
}

interface Reffable {
  ref: number;
}

interface UDMFObject extends Serializable, Reffable {
  deleted: boolean;
}

const n = (num: number) => {
  return num.toFixed(3);
};

export enum RefType {
  VERTEX = "VERTEX",
  LINEDEF = "LINEDEF",
  SECTOR = "SECTOR",
  SIDEDEF = "SIDEDEF"
}

export const reffables: Map<RefType, UDMFObject[]> = new Map();
const mkRef = (type: RefType, r: UDMFObject) => {
  const exist = reffables.get(type);
  let refs = [];
  if (exist) {
    refs = exist;
  }
  refs.push(r);
  reffables.set(type, refs);
};

const getRef = (type: RefType, r: UDMFObject) => {
  return reffables.get(type).indexOf(r);
};

////////

const vertexMap = new Map<String, Vertex>();
export function NewVertex(x: number, y: number) {
  const key = `${x}/${y}`;
  const existing = vertexMap.get(key);
  if (existing) {
    return existing;
  } else {
    const vertex = new Vertex(x, y);
    vertexMap.set(key, vertex);
    return vertex;
  }
}
export class Vertex implements UDMFObject {
  public ref: number;
  public deleted: boolean = false;
  constructor(public x: number, public y: number) {
    mkRef(RefType.VERTEX, this);
  }

  serialize() {
    return `
// vertex ${this.ref}
vertex
{
x = ${n(this.x)};
y = ${n(this.y)};
}

`;
  }
}

export class Linedef implements UDMFObject {
  public ref: number;
  public deleted: boolean = false;
  constructor(
    public v1: Vertex,
    public v2: Vertex,
    public sidefront?: Sidedef,
    public sideback?: Sidedef
  ) {
    mkRef(RefType.LINEDEF, this);
  }

  serialize() {
    return `
// linedef ${this.ref}
linedef
{
v1 = ${this.v1.ref};
v2 = ${this.v2.ref};
${this.sidefront ? `sidefront = ${this.sidefront.ref};` : ""}
${this.sideback ? `sideback = ${this.sideback.ref};` : ""}
${this.sideback && this.sidefront ? "twosided = true;" : ""}
}
    `;
  }
}

export class Sidedef implements UDMFObject {
  public ref: number;
  public deleted: boolean = false;
  constructor(public sector: Sector, public texturemiddle?: string) {
    mkRef(RefType.SIDEDEF, this);
  }

  serialize() {
    return `
// sidedef ${this.ref}
sidedef
{
sector = ${this.sector.ref};
${this.texturemiddle ? `texturemiddle = "${this.texturemiddle}";` : ""}
${this.texturemiddle ? `texturebottom = "${this.texturemiddle}";` : ""}
}
    `;
  }
}

export class Sector implements UDMFObject {
  public ref: number;
  public deleted: boolean = false;
  constructor(
    public texturefloor: string,
    public heightceiling: number,
    public heightfloor: number
  ) {
    mkRef(RefType.SECTOR, this);
  }

  get sidedefs(): IteratorWithOperators<Sidedef> {
    return iterate<Sidedef>(reffables.get(RefType.SIDEDEF) as Sidedef[]).filter(
      (elem: Sidedef) => elem.sector === this
    );
  }

  get linedefs(): IteratorWithOperators<Linedef> {
    return iterate<Linedef>(reffables.get(RefType.LINEDEF) as Linedef[]).filter(
      (elem: Linedef) =>
        (elem.sidefront && elem.sidefront.sector === this) ||
        (elem.sideback && elem.sideback.sector === this)
    );
  }

  serialize() {
    return `
// sector ${this.ref}
sector
{
texturefloor = "${this.texturefloor}";
textureceiling = "0000";
heightceiling = ${this.heightceiling};
heightfloor = ${this.heightfloor};
}
`;
  }
}

export const generateUDMF = (startx?: number, starty?: number) => {
  // set refs on all objects; skip deleted
  let i: number;
  i = 0;
  for (var x of reffables.get(RefType.VERTEX)) {
    if (!x.deleted) {
      x.ref = i;
      i += 1;
    }
  }
  i = 0;
  for (var x of reffables.get(RefType.LINEDEF)) {
    if (!x.deleted) {
      x.ref = i;
      i += 1;
    }
  }
  i = 0;
  for (var x of reffables.get(RefType.SIDEDEF)) {
    if (!x.deleted) {
      x.ref = i;
      i += 1;
    }
  }
  i = 0;
  for (var x of reffables.get(RefType.SECTOR)) {
    if (!x.deleted) {
      x.ref = i;
      i += 1;
    }
  }

  return `
namespace = "zdoom";
thing
{
x = ${n(startx !== undefined ? startx : 0)};
y = ${n(starty !== undefined ? starty : 0)};
type = 1;
skill1 = true;
skill2 = true;
skill3 = true;
skill4 = true;
skill5 = true;
skill6 = true;
skill7 = true;
skill8 = true;
single = true;
coop = true;
dm = true;
class1 = true;
class2 = true;
class3 = true;
class4 = true;
class5 = true;
}

// Vertexes
${reffables
  .get(RefType.VERTEX)
  .filter(v => !v.deleted)
  .map(v => v.serialize())
  .join("\n")}

// Linedefs
${reffables
  .get(RefType.LINEDEF)
  .filter(v => !v.deleted)
  .map(v => v.serialize())
  .join("\n")}

// Sidedefs
${reffables
  .get(RefType.SIDEDEF)
  .filter(v => !v.deleted)
  .map(v => v.serialize())
  .join("\n")}

// Sectors
${reffables
  .get(RefType.SECTOR)
  .filter(v => !v.deleted)
  .map(v => v.serialize())
  .join("\n")}
  
  `;
};
