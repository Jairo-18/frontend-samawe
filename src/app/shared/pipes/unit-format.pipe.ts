import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'unitFormat',
  standalone: true
})
export class UnitFormatPipe implements PipeTransform {
  transform(
    quantity: number,
    unit: string,
    outputType: 'qty' | 'unit'
  ): string | number {
    if (quantity === undefined || quantity === null) return '';

    const lowerUnit = (unit || '').toLowerCase().trim();
    let newQuantity = quantity;
    let newUnit = unit;

    if (
      lowerUnit === 'kg' ||
      lowerUnit === 'kilogramo' ||
      lowerUnit === 'kilogramos'
    ) {
      newQuantity = quantity * 1000;
      newUnit = 'Gramos';
    } else if (
      lowerUnit === 'l' ||
      lowerUnit === 'litro' ||
      lowerUnit === 'litros'
    ) {
      newQuantity = quantity * 1000;
      newUnit = 'Mililitros';
    } else if (
      lowerUnit === 'lb' ||
      lowerUnit === 'libra' ||
      lowerUnit === 'libras'
    ) {
      // 1 lb is usually 500g in culinary contexts in Colombia (or precisely 453.59g).
      // If they use lb, they probably don't want it auto-converted unless requested,
      // but let's stick to kg and l as those are standard metrics.
    }

    if (outputType === 'qty') {
      return newQuantity;
    }

    return newUnit;
  }
}
