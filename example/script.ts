export function add(a: number, b: number): number {
     return a + b;
}

export function subtract(a: number, b: number): number {
     return a - b;
}

export function multiply(a: number, b: number): number {
     return a * b;
}

export function divide(a: number, b: number): number {
     return a / b;
}

export function power(a: number, b: number): number {
     return Math.pow(a, b);
}

export function square(a: number): number {
     return a * a;
}

export class Rectangle {

     constructor(
          public width: number = 0,
          public height: number = 0
     ) { }

     get area(): number {
          return this.width * this.height;
     }

     copy(rectagnle: Rectangle): Rectangle {
          this.width = rectagnle.width;
          this.height = rectagnle.height;
          return this;
     }

     clone(): Rectangle {
          return new Rectangle().copy(this);
     }
}

