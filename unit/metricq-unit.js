/**
 * @module unit
 */
const scales = {
  h: 1e2,
  k: 1e3,
  M: 1e6,
  G: 1e9,
  T: 1e12,
  P: 1e15,
  E: 1e18,
  Z: 1e21,
  Y: 1e24,
  d: 1e-1,
  c: 1e-2,
  m: 1e-3,
  µ: 1e-6,
  n: 1e-9,
  p: 1e-12,
  f: 1e-15,
  a: 1e-18,
  z: 1e-21,
  y: 1e-24,
};

function scaleToPrefix(scale) {
  return Object.keys(scales).find((k) => scales[k] === scale);
}

const unicodeSuperscriptNumbers = /⁻?[¹²³⁴⁵⁶⁷⁸⁹⁰]+/g;
const superscriptToAsciiChars = {
  "¹": "1",
  "²": "2",
  "³": "3",
  "⁴": "4",
  "⁵": "5",
  "⁶": "6",
  "⁷": "7",
  "⁸": "8",
  "⁹": "9",
  "⁰": "0",
};

function superscriptToAscii(str) {
  let superscriptString = str;
  let asciiParts = ["^"];
  if (superscriptString.startsWith("⁻")) {
    asciiParts.push("-");
    superscriptString = superscriptString.substring(1);
  }
  for (const char of superscriptString) {
    asciiParts.push(superscriptToAsciiChars[char]);
  }
  return asciiParts.join("");
}

class MetricQUnit {
  /**
   * Represents a unit or a composition of units. To get a unit object from a string representation use [MetricQUnit.parse]{@linkcode module:unit~MetricQUnit.parse} instead.
   * @constructor
   * @param {string} symbol - The symbol of the unit. If a symbol is set, this is a standalone unit.
   * @param {array} unitParts - The parts of the unit. This is empty for a base unit.
   * @param {string} category - The category of the unit.
   * @param {number} exponent - The exponent of the unit, only applies for standalone units.
   * @param {number} scale - The scale of the unit, only applies for standalone units
   */
  constructor(symbol, unitParts, category, exponent, scale) {
    this.unitParts = unitParts ? unitParts : [];
    if (symbol === undefined) {
      this.symbol = null;
    } else {
      this.symbol = symbol;
    }
    this.category = category;
    this.exponent = 1;
    this.scale = 1;
    if (this.standalone) {
      if (isFinite(exponent)) {
        this.exponent = exponent;
      }
      if (isFinite(scale)) {
        this.scale = scale;
      }
    } else if (exponent !== undefined || scale !== undefined) {
      throw new Error(
        "Exponent and scale are only allowed for standalone units (aka units with a symbol)!"
      );
    }
  }

  /**
   * Indicates if this unit is standalone, which means the unit has a symbol, an exponent and a scale.
   * @returns {boolean}
   */
  get standalone() {
    return this.symbol != null;
  }

  /**
   * Indicates if this unit is base unit. A base unit is a standalone unit with no unit parts.
   * @returns {boolean}
   */
  isBaseUnit() {
    return this.unitParts.length === 0;
  }

  /**
   * Returns a string representation for the unit.
   *
   * For standalone units, this is the symbol optional combined with scale prefix and exponent.
   *
   * @param {boolean} [withScale=true] - Include scale prefix (k, M, G, m, c, ....)
   * @param {boolean} [withExponent=true] - Include exponent
   * @param {boolean} [includeParts=false] - Represent standalone unit as parts and not as symbol
   * @returns {string}
   */
  getUnitString(withScale = true, withExponent = true, includeParts = false) {
    if ((this.standalone && !includeParts) || this.isBaseUnit()) {
      let parts = [];
      if (withScale && this.scale !== 1) {
        parts.push(scaleToPrefix(this.scale));
      }
      parts.push(this.symbol);
      if (withExponent && isFinite(this.exponent) && this.exponent !== 1) {
        parts.push("^", this.exponent);
      }
      return parts.join("");
    } else if (this.standalone && includeParts) {
      return this._adjustedUnitParts()
        .map((a) => a.getUnitString(withScale, withExponent, includeParts))
        .join(" ");
    }
    return this.unitParts
      .map((a) => a.getUnitString(withScale, withExponent, includeParts))
      .join(" ");
  }

  toString() {
    return this.getUnitString();
  }

  /**
   * Applies scale and exponent of the standalone unit to its unit parts.
   * @private
   * @returns {array}
   */
  _adjustedUnitParts() {
    let unitParts = [...this.unitParts];
    // scale is only required once
    unitParts[0] = unitParts[0].scaled(this.scale);

    // exponent is required for all parts
    unitParts = unitParts.map((a) => a.powered(this.exponent));
    return unitParts;
  }

  /**
   * Creates a new unit, which is 1 / thisUnit.
   * @returns {MetricQUnit}
   */
  invert() {
    if (this.standalone) {
      return new MetricQUnit(
        this.symbol,
        this.unitParts,
        this.category,
        this.exponent * -1,
        this.scale
      );
    }
    return new MetricQUnit(
      undefined,
      this.unitParts.map((a) => a.invert()),
      this.category,
      undefined,
      undefined
    );
  }

  /**
   * Combine two units into a new unit. This is basically a multiplication of the two units.
   * @param {MetricQUnit} bUnit
   * @returns {MetricQUnit}
   */
  concat(bUnit) {
    let newUnitParts = [];
    if (this.standalone) {
      newUnitParts.push(this);
    } else {
      newUnitParts = newUnitParts.concat(this.unitParts);
    }
    if (bUnit.standalone) {
      newUnitParts.push(bUnit);
    } else {
      newUnitParts = newUnitParts.push(bUnit.unitParts);
    }
    return new MetricQUnit(
      undefined,
      newUnitParts,
      undefined,
      undefined,
      undefined
    );
  }

  toBaseUnitString() {
    return this.getBaseUnits()
      .map((a) => a.getUnitString(false))
      .join(" ");
  }

  getBaseUnits() {
    if (this.isBaseUnit()) {
      return [this];
    }

    return this._adjustedUnitParts()
      .map((aUnit) => aUnit.getBaseUnits())
      .reduce((acc, curValue) => acc.concat(curValue), [])
      .sort((aUnitPart, bUnitPart) =>
        aUnitPart.symbol.localeCompare(bUnitPart.symbol)
      );
  }

  hasSameBaseUnits(bUnit) {
    return this.toBaseUnitString() === bUnit.toBaseUnitString();
  }

  combinedScale() {
    if (this.isBaseUnit()) {
      return this.scale ** this.exponent;
    }
    return (
      (this.unitParts
        .map((aUnit) => aUnit.combinedScale())
        .reduce((acc, curValue) => acc * curValue, 1) *
        this.scale) **
      this.exponent
    );
  }

  isEqual(bUnit) {
    return (
      this.hasSameBaseUnits(bUnit) &&
      this.combinedScale() === bUnit.combinedScale()
    );
  }

  /**
   * Creates a new unit scaled by the give scale.
   * @param {number} scale
   * @returns {MetricQUnit}
   */
  scaled(scale) {
    if (this.standalone) {
      let adjustedScale = scale ** (1 / this.exponent);
      return new MetricQUnit(
        this.symbol,
        this.unitParts,
        undefined,
        this.exponent,
        this.scale * adjustedScale
      );
    }

    let unitParts = [...this.unitParts];
    unitParts[0] = unitParts[0].scaled(scale);
    return new MetricQUnit(
      undefined,
      unitParts,
      undefined,
      undefined,
      undefined
    );
  }

  powered(exponent) {
    if (this.standalone) {
      return new MetricQUnit(
        this.symbol,
        this.unitParts,
        undefined,
        this.exponent * exponent,
        this.scale
      );
    }

    let unitParts = [...this.unitParts].map((a) => a.powered(exponent));
    return new MetricQUnit(
      undefined,
      unitParts,
      undefined,
      undefined,
      undefined
    );
  }

  /**
   * Converts a value from oldUnit to this unit.
   * @param {number} value - The value to convert.
   * @param {MetricQUnit} oldUnit - The unit of the value.
   * @returns {number}
   */
  convertFromUnit(value, oldUnit) {
    if (!this.hasSameBaseUnits(oldUnit)) {
      throw new Error(
        "Can not convert value to unit with different base units! this: " +
          this.toBaseUnitString() +
          ", oldUnit: " +
          oldUnit.toBaseUnitString()
      );
    }

    let scale = oldUnit.combinedScale() / this.combinedScale();

    return value * scale;
  }

  /**
   * Parses a string of units with scale and exponents and returns a unit object.
   * With the optional symbol parameter a new [standalone]{@link module:unit~MetricQUnit.standalone} unit is created.
   *
   * The unit string is parsed according to the following rules:
   * - multiplication is represented by space or *
   * - division is represented by /
   * - exponents are represented by ^ or unicode superscript (e.g. ⁵)
   * - multiplication and division split the unit string in unit parts
   * - unit parts can be any length
   * - if the first character of the unit parts matches an SI prefix, it is parsed as scaling
   *
   * @example
   * // returns a unit object with the parts 'm' and 's^-1'
   * MetricQUnit.parse("m/s");
   *
   * @example
   * // returns a unit object for 'N', with the information that N = kg m s^-2
   * MetricQUnit.parse("kg m s^-2", "N");
   *
   * @param {string} unitString - String representation of the unit, maybe composed of other units
   * @param {string} [symbol] - A string symbol representing this composition of units as a new unit
   * @returns {MetricQUnit}
   */
  static parse(unitString, symbol) {
    if (unitString.includes("/")) {
      const parts = unitString.split("/", 2);
      const unit = MetricQUnit.parse(parts[0]).concat(
        MetricQUnit.parse(parts[1]).invert()
      );
      unit.symbol = symbol;
      return unit;
    } else if (unitString.includes(" ")) {
      const partsWithAsterisk = unitString.split(" ");
      let parts = [];
      for (const part of partsWithAsterisk) {
        parts = parts.concat(part.split("*"));
      }
      const unit = parts
        .map((part) => MetricQUnit.parse(part))
        .reduce(
          (acc, curValue) => acc.concat(curValue),
          new MetricQUnit(undefined, [], undefined, undefined, undefined)
        );
      unit.symbol = symbol;
      return unit;
    } else {
      let modifiedUnitString = unitString;
      for (const match of modifiedUnitString.matchAll(
        unicodeSuperscriptNumbers
      )) {
        modifiedUnitString = modifiedUnitString.replace(
          match[0],
          superscriptToAscii(match[0])
        );
      }
      const parts = modifiedUnitString.split("^", 2);
      let symbol = parts[0];
      let scale = 1;
      if (symbol.length > 1) {
        for (const [prefix, knowenScale] of Object.entries(scales)) {
          if (symbol.startsWith(prefix)) {
            scale = knowenScale;
            symbol = symbol.substring(1);
            break;
          }
        }
      }

      let exponent = parts[1];
      if (exponent !== undefined) {
        exponent = parseInt(exponent);
      }

      let existingUnit = MetricQUnit.globalUnitStore.find(
        (aUnit) => aUnit.symbol === symbol
      );
      if (existingUnit !== undefined) {
        return new MetricQUnit(
          existingUnit.symbol,
          existingUnit.unitParts,
          existingUnit.category,
          exponent,
          scale
        );
      }
      return new MetricQUnit(symbol, undefined, undefined, exponent, scale);
    }
  }

  /**
   * Check if an array of units has the same base unit.
   * @param {MetricQUnit[]} units - The array of units.
   * @returns {boolean}
   */
  static haveSameBaseUnit(units) {
    const unitSet = new Set(units.map((aUnit) => aUnit.toBaseUnitString()));
    return unitSet.size === 1;
  }

  static globalUnitStore = [];
}

MetricQUnit.globalUnitStore.push(MetricQUnit.parse("kg m s^-2", "N"));
MetricQUnit.globalUnitStore.push(
  new MetricQUnit(
    "h",
    [new MetricQUnit("s", [], undefined, 1, 3600)],
    undefined,
    1,
    1
  )
);

class MetricQUnitConvert {
  /**
   * Helper to convert multiple values from one to another unit.
   * @param {MetricQUnit} fromUnit
   * @param {MetricQUnit} toUnit
   */
  constructor(fromUnit, toUnit) {
    this.fromUnit = fromUnit;
    this.toUnit = toUnit;
  }

  /**
   * Convert a single value.
   * @param {number} value
   * @returns {number}
   */
  convertValue(value) {
    return this.toUnit.convertFromUnit(value, this.fromUnit);
  }

  /**
   * Convert an array of values.
   * @param {number[]} values
   * @returns {number[]}
   */
  convertValues(values) {
    return values.map((v) => this.toUnit.convertFromUnit(v, this.fromUnit));
  }
}

class MetricQValueFormatter {
  constructor(unit) {
    this.unit = unit;
  }

  valueString(value) {
    // source: https://stackoverflow.com/a/53169221
    const numInSciNot = {};
    [numInSciNot.coefficient, numInSciNot.exponent] = value
      .toExponential()
      .split("e")
      .map(Number);

    const remainder = numInSciNot.exponent % 3;
    const scaleExponent = numInSciNot.exponent - remainder;

    const scaledUnit = this.unit.scaled(10 ** scaleExponent);
    return (
      (numInSciNot.coefficient * 10 ** remainder).toString() +
      scaledUnit.toString()
    );
  }
}

export { MetricQUnit, MetricQUnitConvert, MetricQValueFormatter };
