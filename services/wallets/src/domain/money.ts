export class Money {
  private readonly cents: bigint;

  private constructor(cents: bigint) {
    this.cents = cents;
  }

  static fromCents(cents: bigint | number | string): Money {
    const value = typeof cents === "bigint" ? cents : BigInt(cents);
    return new Money(value);
  }

  static zero(): Money {
    return new Money(0n);
  }

  add(other: Money): Money {
    return new Money(this.cents + other.cents);
  }

  subtract(other: Money): Money {
    return new Money(this.cents - other.cents);
  }

  isLessThan(other: Money): boolean {
    return this.cents < other.cents;
  }

  isNegative(): boolean {
    return this.cents < 0n;
  }

  isZeroOrNegative(): boolean {
    return this.cents <= 0n;
  }

  toCents(): bigint {
    return this.cents;
  }

  toString(): string {
    return this.cents.toString();
  }
}
