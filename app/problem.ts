import { Accords, Accord, AOrigin } from './accord';
import { Provider } from './provider';
import { Consumer } from './consumer';
import { ProblemSolver } from './problem-solver'

export class Problem {
    accords:   Accords;
    providers: Provider[];
    consumers: Consumer[];

    constructor(numOfProviders: number, numOfConsumers: number) {
        this.accords = new Accords(numOfProviders, numOfConsumers);
        this.providers = new Array<Provider>(numOfProviders);
        this.consumers = new Array<Consumer>(numOfConsumers);

        for(let i = 0; i < this.providers.length; i++) {
            this.providers[i] = new Provider("Provider #" + (i + 1));
        }

        for(let i = 0; i < this.consumers.length; i++) {
            this.consumers[i] = new Consumer("Consumer #" + (i + 1));
        }
    }

    solve(): number {
        let totalCost: number = 0;

        var solver = new ProblemSolver(this);
        solver.solve();

        this.accords.forEach(accord => {
            if(!accord.amount) accord.amount = 0;
            if(!accord.cost) accord.cost = 0;
            if(accord.amount > 0 && accord.cost > 0) {
                totalCost += accord.amount * accord.cost;
            }
            return true;
        });

        return totalCost;
    }

    provided(): number {
        let provided: number = 0;
        for(let p of this.providers)
            provided += p.provides;
        return provided;
    }

    consumed(): number {
        let consumed: number = 0;
        for(let c of this.consumers)
            consumed += c.consumes;
        return consumed;
    }

    shortage(): number {
        return this.consumed() - this.provided();
    }

    addProvider(name?: string, provides?: number) {
        if(!name)
            name = "Provider #" + (this.providers.length + 1);
        this.providers.push(new Provider(name, provides));
        this.accords.addProvider();
    }

    addConsumer(name?: string, consumes?: number) {
        if(!name)
            name = "Consumer #" + (this.consumers.length + 1);
        this.consumers.push(new Consumer(name, consumes));
        this.accords.addConsumer();
    }

    isReady(): boolean {
        let isReady: boolean = true;
        this.accords.forEach(accord => {
            if(accord.cost == null || accord.cost < 0) {
                isReady = false;
                return false;
            }
            return true;
        });
        if(!isReady)
            return false;
        for(let p of this.providers)
            if(p.provides == null || p.provides < 0)
                return false;
        for(let c of this.consumers)
            if(c.consumes == null || c.consumes < 0)
                return false;
        return true;
    }

    delProvider(pid: number) {
        if(this.providers.length <= 1)
            return;
        this.providers.splice(pid, 1);
        this.accords.delProvider(pid);
    }

    delConsumer(cid: number) {
        if(this.consumers.length <= 1)
            return;
        this.consumers.splice(cid, 1);
        this.accords.delConsumer(cid);
    }
}

