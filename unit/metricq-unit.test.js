import { MetricQUnit } from './metricq-unit.js'
import unitRewire from  './metricq-unit.js'

// test('Unit part test toString', () => {
//   const UnitPart = unitRewire.__get__('UnitPart');
//   expect(new UnitPart("N").toString()).toBe("N");
//   expect(new UnitPart("N").inverted().toString()).toBe("N^-1");
// });
//
//
// test('unit part test parse with exponent', () => {
//   const UnitPart = unitRewire.__get__('UnitPart');
//   const unit = UnitPart.parse("N^2")
//   expect(unit.symbol).toBe("N");
//   expect(unit.exponent).toBe(2);
// });
//
// test('unit part test parse without exponent', () => {
//   const UnitPart = unitRewire.__get__('UnitPart');
//   const unit = UnitPart.parse("N")
//   expect(unit.symbol).toBe("N");
//   expect(unit.exponent).toBe(1);
// });
//
// test('unit part test scaling', () => {
//   const UnitPart = unitRewire.__get__('UnitPart');
//   const unit = UnitPart.parse("kg")
//   expect(unit.symbol).toBe("g");
//   expect(unit.exponent).toBe(1);
//   expect(unit.scale).toBe(1e3);
//
//   const scaledUnit = unit.scaled(1e3);
//   expect(scaledUnit.exponent).toBe(1);
//   expect(scaledUnit.scale).toBe(1e6);
// });
//
// test('unit part test advanced scaling', () => {
//   const UnitPart = unitRewire.__get__('UnitPart');
//   const unit = UnitPart.parse("kg^2")
//   expect(unit.symbol).toBe("g");
//   expect(unit.exponent).toBe(2);
//   expect(unit.scale).toBe(1e3);
//
//   const scaledUnit = unit.scaled(1e6);
//   expect(scaledUnit.exponent).toBe(2);
//   expect(scaledUnit.scale).toBe(1e6);
// });

test('test simple parsing', () => {
  const unit = MetricQUnit.parse("g")
  expect(unit.unitParts.length).toBe(0);
  expect(unit.toString()).toBe("g");
});

test('test parsing g/m', () => {
  const unit = MetricQUnit.parse("g/m")
  expect(unit.unitParts.length).toBe(2);
  expect(unit.toString()).toBe("g m^-1");
});

test('test parsing with scale kg', () => {
  const unit = MetricQUnit.parse("kg")
  expect(unit.symbol).toBe("g");
  expect(unit.scale).toBe(1e3);
});

test('test parsing concatted unit (W h)', () => {
  const unit = MetricQUnit.parse("W h")
  expect(unit.unitParts.length).toBe(2);
  expect(unit.toString()).toBe("W h");
});

test('test parsing compelx unit (J kg^-1 K^-1)', () => {
  const unit = MetricQUnit.parse("J kg^-1 K^-1")
  expect(unit.unitParts.length).toBe(3);
  expect(unit.toString()).toBe("J kg^-1 K^-1");
});


test('superscribt to ascii', () => {
  const superscriptToAscii = unitRewire.__get__('superscriptToAscii');
  expect(superscriptToAscii("⁻¹")).toBe("^-1");
  expect(superscriptToAscii("¹²")).toBe("^12");
});

test('test parsing compelx unit (J kg⁻¹ K⁻¹)', () => {
  const unit = MetricQUnit.parse("J kg⁻¹ K⁻¹")
  expect(unit.unitParts.length).toBe(3);
  expect(unit.toString()).toBe("J kg^-1 K^-1");
  expect(unit.toBaseUnitString()).toBe("g^-1 J K^-1");
});

test('test (J kg⁻¹ K⁻¹) and (kJ K⁻¹ Mg⁻¹) have same base units ', () => {
  const aUnit = MetricQUnit.parse("J kg⁻¹ K⁻¹")
  const bUnit = MetricQUnit.parse("kJ K⁻¹ Mg⁻¹")
  expect(aUnit.hasSameBaseUnits(bUnit)).toBeTruthy();
  expect(bUnit.hasSameBaseUnits(aUnit)).toBeTruthy();
});

test('test combined scale ', () => {
  expect(MetricQUnit.parse("kg K⁻¹").combinedScale()).toBe(1e3);
  expect(MetricQUnit.parse("kg kK⁻¹").combinedScale()).toBe(1);
  expect(MetricQUnit.parse("km^2").combinedScale()).toBe(1e6);
});

test('test equal units', () => {
  const aUnit = MetricQUnit.parse("J kg⁻¹ K⁻¹")
  const bUnit = MetricQUnit.parse("kJ K⁻¹ Mg⁻¹")
  expect(aUnit.isEqual(aUnit)).toBeTruthy();
  expect(aUnit.isEqual(bUnit)).toBeTruthy();
  expect(bUnit.isEqual(aUnit)).toBeTruthy();
});

test('test unequal units', () => {
  const aUnit = MetricQUnit.parse("J kg⁻¹ K⁻¹")
  const bUnit = MetricQUnit.parse("kJ K⁻¹ kg⁻¹")
  expect(aUnit.isEqual(bUnit)).toBeFalsy();
  expect(bUnit.isEqual(aUnit)).toBeFalsy();
});

test('test global unit store', () => {
  const aUnit = MetricQUnit.parse("N")
  const bUnit = MetricQUnit.parse("kg m s^-2")
  expect(aUnit.isEqual(bUnit)).toBeTruthy();
  expect(aUnit.toString()).toEqual("N");
});

test('test parsing global unit with scale kN', () => {
  const unit = MetricQUnit.parse("kN")
  expect(unit.unitParts.length).toBe(3);
  expect(unit.getUnitString(true, true, true)).toBe("Mg m s^-2");
});

test('test parsing global unit with scale and exponent kN⁻¹', () => {
  const unit = MetricQUnit.parse("kN⁻¹")
  expect(unit.unitParts.length).toBe(3);
  expect(unit.getUnitString(true, true, true)).toBe("Mg^-1 m^-1 s^2");
});
