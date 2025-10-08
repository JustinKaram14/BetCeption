import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatCoins'
})
export class FormatCoinsPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
