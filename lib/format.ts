function toBigInt(v: string | bigint) {
    return typeof v === 'bigint' ? v : BigInt(v);
  }
  
  export function formatLinea(wei: string | bigint, fractionDigits = 0, locale: string = 'en-US') {
    const bi = toBigInt(wei);
    const base = 10n ** 18n;
    const whole = bi / base;
  
    if (fractionDigits <= 0) {
      return new Intl.NumberFormat(locale).format(Number(whole));
    }
  
    const rem = bi % base;
    const fracFull = rem.toString().padStart(18, '0');
    const frac = fracFull.slice(0, fractionDigits).replace(/0+$/, '');
    const head = new Intl.NumberFormat(locale).format(Number(whole));
    return frac ? `${head}.${frac}` : head;
  }
  