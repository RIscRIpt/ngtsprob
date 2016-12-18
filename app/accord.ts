export class AOrigin {
    provider: number;
    consumer: number;

    constructor(pid: number, cid: number) {
        this.provider = pid;
        this.consumer = cid;
    }

    EqualsTo(other: AOrigin): boolean {
        return this.provider == other.provider &&
               this.consumer == other.consumer;
    }

    hasCommon(other: AOrigin): boolean {
        return this.provider == other.provider ||
               this.consumer == other.consumer;
    }
}

export class Accord {
    cost:   number;
    amount: number;

    constructor(cost?: number, amount?: number) {
        this.cost = cost;
        this.amount = amount;
    }
}

export class IndexedAccord extends Accord implements AOrigin {
    provider: number;
    consumer: number;

    constructor(a: Accord, pid: number, cid: number) {
        super(a.cost, a.amount);
        this.provider = pid;
        this.consumer = cid;
    }

    EqualsTo(other: IndexedAccord): boolean {
        return false;
    }

    hasCommon(other: IndexedAccord): boolean {
        return false;
    }
}

export class Accords {
    accords: Accord[][];

    constructor(numOfProviders: number, numOfConsumers: number) {
        this.accords = new Array<Accord[]>(numOfProviders);
        for(let pid = 0; pid < numOfProviders; pid++) {
            this.accords[pid] = new Array<Accord>(numOfConsumers);
            for(let cid = 0; cid < numOfConsumers; cid++) {
                this.accords[pid][cid] = new Accord();
            }
        }
    }

    forEach(fn: (a: Accord) => boolean) {
        for(let pid = 0; pid < this.accords.length; pid++)
            for(let cid = 0; cid < this.accords[pid].length; cid++)
                if(!fn(this.accords[pid][cid])) return;
    }

    get(orig: AOrigin): Accord {
        return this.accords[orig.provider][orig.consumer];
    }

    indexed(): IndexedAccord[] {
        let result: IndexedAccord[] = [];
        for(let pid = 0; pid < this.accords.length; pid++) {
            for(let cid = 0; cid < this.accords[pid].length; cid++) {
                result.push(new IndexedAccord(this.accords[pid][cid], pid, cid));
            }
        }
        return result;
    }

    set(orig: AOrigin, cost?: number, amount?: number) {
        if(cost !== undefined)
            this.get(orig).cost = cost;
        if(amount !== undefined)
            this.get(orig).amount = amount;
    }

    add(orig: AOrigin, cost?: number, amount?: number) {
        if(cost !== undefined)
            this.get(orig).cost += cost;
        if(amount !== undefined)
            this.get(orig).amount += amount;
    }

    setCost(orig: AOrigin, cost: number) {
        this.set(orig, cost, undefined);
    }

    addCost(orig: AOrigin, cost: number) {
        this.add(orig, cost, undefined);
    }

    setAmount(orig: AOrigin, amount: number) {
        this.set(orig, undefined, amount);
    }

    addAmount(orig: AOrigin, amount: number) {
        this.add(orig, undefined, amount);
    }

    getProviders(id: number): Accord[] {
        return this.accords[id];
    }

    getConsumers(id: number): Accord[] {
        let result: Accord[] = [];
        for(let i = 0; i < this.accords.length; i++)
            result.push(this.accords[i][id]);
        return result;
    }

    crossFindRelocatable(orig: AOrigin): AOrigin[] {
        let neigh: AOrigin[] = [];
        for(let i = 0; i < this.accords[orig.provider].length; i++) {
            if(i == orig.consumer)
                continue;
            var amount = this.accords[orig.provider][i].amount;
            if(amount === null || amount === undefined)
                continue;
            neigh.push(new AOrigin(orig.provider, i));
        }
        for(let i = 0; i < this.accords.length; i++) {
            if(i == orig.provider)
                continue;
            var amount = this.accords[i][orig.consumer].amount;
            if(amount === null || amount === undefined)
                continue;
            neigh.push(new AOrigin(i, orig.consumer));
        }
        return neigh;
    }

    addProvider(accords?: Accord[]) {
        if(!accords)
            accords = [];
        for(let i = 0; i < this.accords[0].length; i++)
            if(!accords[i])
                accords[i] = new Accord(0);
        this.accords.push(accords);
    }

    addConsumer(accords?: Accord[]) {
        if(!accords)
            accords = [];
        for(let i = 0; i < this.accords.length; i++) {
            if(!accords[i])
                accords[i] = new Accord(0);
            this.accords[i].push(accords[i]);
        }
    }

    delProvider(pid: number) {
        this.accords.splice(pid, 1);
    }

    delConsumer(cid: number) {
        for(let pid = 0; pid < this.accords.length; pid++) {
            this.accords[pid].splice(cid, 1);
        }
    }
}

