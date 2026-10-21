import { LispValue } from '../types/interpreter';

export class Environment {
  private bindings: Map<string, LispValue> = new Map();
  private parent: Environment | null = null;

  constructor(parent: Environment | null = null) {
    this.parent = parent;
  }

  public set(name: string, value: LispValue): void {
    this.bindings.set(name, value);
  }

  public get(name: string): LispValue | undefined {
    if (this.bindings.has(name)) {
      return this.bindings.get(name);
    }
    if (this.parent) {
      return this.parent.get(name);
    }
    return undefined;
  }

  public has(name: string): boolean {
    if (this.bindings.has(name)) return true;
    if (this.parent) return this.parent.has(name);
    return false;
  }
}
