export function decimalToCents(value) {
    if (typeof value === 'number')
        return decimalToCents(value.toFixed(2));
    const trimmed = value.trim();
    const sign = trimmed.startsWith('-') ? -1n : 1n;
    const unsigned = sign === -1n ? trimmed.slice(1) : trimmed;
    const [intPartRaw, fracRaw = ''] = unsigned.split('.');
    const intPart = intPartRaw === '' ? '0' : intPartRaw;
    const fracPart = (fracRaw + '00').slice(0, 2);
    const cents = BigInt(intPart) * 100n + BigInt(fracPart === '' ? '0' : fracPart);
    return sign * cents;
}
export function centsToDecimal(cents) {
    const sign = cents < 0n ? '-' : '';
    const abs = cents < 0n ? -cents : cents;
    const integer = abs / 100n;
    const fractional = (abs % 100n).toString().padStart(2, '0');
    return `${sign}${integer.toString()}.${fractional}`;
}
export function centsToNumber(cents) {
    const sign = cents < 0n ? -1 : 1;
    const abs = cents < 0n ? -cents : cents;
    return sign * Number(abs) / 100;
}
