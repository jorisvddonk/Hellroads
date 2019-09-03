interface Serializable {
  serialize: () => string;
}

interface Reffable {
  ref: number;
}

interface UDMFObject extends Serializable, Reffable {}

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

export class Vertex implements UDMFObject {
  constructor(public x: number, public y: number) {
    const existing = Array.from(reffables.get(RefType.VERTEX) || []).find(
      (v: Vertex) => {
        v.x === x && v.y === y;
      }
    );
    if (existing) {
      return existing as Vertex;
    }
    mkRef(RefType.VERTEX, this);
  }

  get ref() {
    return getRef(RefType.VERTEX, this);
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
  constructor(
    public v1: Vertex,
    public v2: Vertex,
    public sidefront?: Sidedef,
    public sideback?: Sidedef
  ) {
    mkRef(RefType.LINEDEF, this);
  }

  get ref() {
    return getRef(RefType.LINEDEF, this);
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
  constructor(public sector: Sector, public texturemiddle?: string) {
    mkRef(RefType.SIDEDEF, this);
  }

  get ref() {
    return getRef(RefType.SIDEDEF, this);
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
  constructor(
    public texturefloor: string,
    public heightceiling: number,
    public heightfloor: number
  ) {
    mkRef(RefType.SECTOR, this);
  }

  get ref() {
    return getRef(RefType.SECTOR, this);
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
  .map(v => v.serialize())
  .join("\n")}

// Linedefs
${reffables
  .get(RefType.LINEDEF)
  .map(v => v.serialize())
  .join("\n")}

// Sidedefs
${reffables
  .get(RefType.SIDEDEF)
  .map(v => v.serialize())
  .join("\n")}

// Sectors
${reffables
  .get(RefType.SECTOR)
  .map(v => v.serialize())
  .join("\n")}
  
  `;
};
