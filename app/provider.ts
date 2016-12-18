export class Provider {
    name:     string;
    provides: number;

    constructor(name?: string, provides?: number) {
        this.name = name;
        this.provides = provides;
    }
}

