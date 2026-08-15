import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'truncate',
    pure: false,
    standalone: true
})

export class TruncatePipe implements PipeTransform {

  transform(value: number | undefined | null): number | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    return Math.trunc(value);
  }
}
