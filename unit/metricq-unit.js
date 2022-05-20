const scales = {
  'h': 1e2,
  'k': 1e3,
  'M': 1e6,
  'G': 1e9,
  'T': 1e12,
  'P': 1e15,
  'E': 1e18,
  'Z': 1e21,
  'Y': 1e24,
  'd': 1e-1,
  'c': 1e-2,
  'm': 1e-3,
  'µ': 1e-6,
  'n': 1e-9,
  'p': 1e-12,
  'f': 1e-15,
  'a': 1e-18,
  'z': 1e-21,
  'y': 1e-24
}

function scaleToPrefix (scale) {
  return Object.keys(scales).find(k => scales[k] === scale)
}

const unicodeSuperscriptNumbers = /⁻?[¹²³⁴⁵⁶⁷⁸⁹⁰]+/g
const superscriptToAsciiChars = {
  '¹': '1',
  '²': '2',
  '³': '3',
  '⁴': '4',
  '⁵': '5',
  '⁶': '6',
  '⁷': '7',
  '⁸': '8',
  '⁹': '9',
  '⁰': '0',
}

function superscriptToAscii (str) {
  let superscriptString = str
  let asciiParts = ['^']
  if (superscriptString.startsWith('⁻')) {
    asciiParts.push('-')
    superscriptString = superscriptString.substring(1)
  }
  for (const char of superscriptString) {
    asciiParts.push(superscriptToAsciiChars[char])
  }
  return asciiParts.join('')
}

class MetricQUnit {

  /**
   * Represents a unit.
   * @constructor
   * @param {string} symbol - The symbol of the unit. If a symbol is set, this is a standalone unit.
   * @param {array} unitParts - The parts of the unit. This is empty for a base unit.
   * @param {string} category - The category of the unit.
   * @param {number} exponent - The exponent of the unit, only applies for standalone units.
   * @param {number} scale - The scale of the unit, only applies for standalone units
   */
  constructor (symbol, unitParts, category, exponent, scale) {
    this.unitParts = unitParts ? unitParts : []
    this.symbol = symbol
    this.category = category
    if(this.standalone) {
      if (isFinite(exponent)) {
        this.exponent = exponent
      } else {
        this.exponent = 1
      }
      if (isFinite(scale)) {
        this.scale = scale
      } else {
        this.scale = 1
      }
    } else if (exponent !== undefined || scale !== undefined) {
      throw new Error("Exponent and scale are only allowed for standalone units (aka units with a symbol)!")
    }
  }

  /**
   * Indicates if this unit is standalone, which means the unit has a symbol, an exponent and a scale.
   * @returns {boolean}
   */
  get standalone() {
    return this.symbol !== undefined && this.symbol !== null
  }

  /**
   * Indicates if this unit is base unit. A base unit is a standalone unit with no unit parts.
   * @returns {boolean}
   */
  isBaseUnit() {
    return this.unitParts.length === 0
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
    if((this.standalone && !includeParts) || this.isBaseUnit()) {
      let parts = []
      if (withScale && this.scale !== 1) {
        parts.push(scaleToPrefix(this.scale))
      }
      parts.push(this.symbol)
      if (withExponent && isFinite(this.exponent) && this.exponent !== 1) {
        parts.push('^', this.exponent)
      }
      return parts.join('')
    } else if(this.standalone && includeParts) {
      return this._adjustedUnitParts().map(a => a.getUnitString(withScale, withExponent, includeParts)).join(' ')
    }
    return this.unitParts.map(a => a.getUnitString(withScale, withExponent, includeParts)).join(' ')
  }

  toString () {
      return this.getUnitString()
  }

  /**
   * Applies scale and exponent of the standalone unit to its unit parts.
   * @private
   * @returns {array}
   */
  _adjustedUnitParts () {
    let unitParts = [...this.unitParts]
    // scale is only required once
    unitParts[0] = unitParts[0].scaled(this.scale)

    // exponent is required for all parts
    unitParts = unitParts.map(a => a.powered(this.exponent))
    return unitParts
  }

  invert () {
    if(this.standalone) {
      return new MetricQUnit(this.symbol, this.unitParts.map((a) => a.invert()), this.category, this.exponent * -1, this.scale)
    }
    return new MetricQUnit(undefined, this.unitParts.map((a) => a.invert()), this.category, undefined, undefined)
  }

  concat (bUnit) {
    let newUnitParts = []
    if(this.standalone) {
      newUnitParts.push(this)
    } else {
      newUnitParts = newUnitParts.concat(this.unitParts)
    }
    if(bUnit.standalone) {
      newUnitParts.push(bUnit)
    } else {
      newUnitParts = newUnitParts.push(bUnit.unitParts)
    }
    return new MetricQUnit(undefined, newUnitParts, undefined, undefined, undefined)
  }

  toBaseUnitString () {
    if(this.isBaseUnit()) {
      return this.getUnitString(false)
    }
    return [...this.unitParts].sort((aUnitPart, bUnitPart) => aUnitPart.symbol.localeCompare(bUnitPart.symbol)).map(a => a.toBaseUnitString()).join(' ')
  }

  hasSameBaseUnits (bUnit) {
    return this.toBaseUnitString() === bUnit.toBaseUnitString()
  }

  combinedScale () {
    if(this.isBaseUnit()) {
      return this.scale ** this.exponent
    }
    return this.unitParts.map(aUnit => aUnit.scale ** aUnit.exponent).reduce((acc, curValue) => acc * curValue, 1)
  }

  isEqual(bUnit) {
    return this.hasSameBaseUnits(bUnit) && this.combinedScale() === bUnit.combinedScale()
  }

  scaled(scale) {
    if(this.standalone) {
      let adjustedScale = scale ** (1 / this.exponent)
      return new MetricQUnit(this.symbol, this.unitParts, undefined, this.exponent, this.scale * adjustedScale)
    }

    let unitParts = [...this.unitParts]
    unitParts[0] = unitParts[0].scaled(scale)
    return new MetricQUnit(undefined, unitParts, undefined, undefined, undefined)
  }

  powered(exponent) {
    if(this.standalone) {
      return new MetricQUnit(this.symbol, this.unitParts, undefined, this.exponent * exponent, this.scale)
    }

    let unitParts = [...this.unitParts].map(a => a.powered(exponent))
    return new MetricQUnit(undefined, unitParts, undefined, undefined, undefined)
  }

  static parse (unitString, symbol) {
    if (unitString.includes('/')) {
      const parts = unitString.split('/', 2)
      const unit = MetricQUnit.parse(parts[0]).concat(MetricQUnit.parse(parts[1]).invert())
      unit.symbol = symbol
      return unit
    } else if (unitString.includes(' ')) {
      const partsWithAsterisk = unitString.split(' ')
      let parts = []
      for (const part of partsWithAsterisk) {
        parts = parts.concat(part.split('*'))
      }
      const unit = parts.map(part => MetricQUnit.parse(part)).reduce((acc, curValue) => acc.concat(curValue), new MetricQUnit(undefined, [], undefined, undefined, undefined))
      unit.symbol = symbol
      return unit
    } else {
      let modifiedUnitString = unitString
      for (const match of modifiedUnitString.matchAll(unicodeSuperscriptNumbers)) {
        modifiedUnitString = modifiedUnitString.replace(match[0], superscriptToAscii(match[0]))
      }
      const parts = modifiedUnitString.split('^', 2)
      let symbol = parts[0]
      let scale = 1
      if (symbol.length > 1) {
        for (const [prefix, knowenScale] of Object.entries(scales)) {
          if (symbol.startsWith(prefix)) {
            scale = knowenScale
            symbol = symbol.substring(1)
            break
          }
        }
      }

      let exponent = parts[1]
      if (exponent !== undefined) {
        exponent = parseInt(exponent)
      }

      let existingUnit = MetricQUnit.globalUnitStore.find(aUnit => aUnit.symbol === symbol)
      if(existingUnit !== undefined) {
        return new MetricQUnit(existingUnit.symbol, existingUnit.unitParts, existingUnit.category, exponent, scale)
      }
      return new MetricQUnit(symbol, undefined, undefined, exponent, scale)
    }
  }

  static globalUnitStore = []
}

MetricQUnit.globalUnitStore.push(MetricQUnit.parse("kg m s^-2", "N"))

export { MetricQUnit }
