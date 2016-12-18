import { Accords, Accord, IndexedAccord, AOrigin } from './accord';
import { Provider } from './provider';
import { Consumer } from './consumer';
import { Problem } from './problem';

class pqe {
    route: Route;
    id: number;
    value: number;

    constructor(route: Route, id: number, value: number) {
        this.route = route;
        this.id = id;
        this.value = value;
    }
}

class Potentials {
    providers: number[];
    consumers: number[];

    constructor(numOfProviders: number, numOfConsumers: number) {
        this.providers = new Array<number>(numOfProviders);
        this.consumers = new Array<number>(numOfConsumers);
        this.reset();
    }

    reset() {
        this.providers.fill(null);
        this.consumers.fill(null);
    }

    countNulls(): number {
        return this.providers.filter(x => x === null).length +
               this.consumers.filter(x => x === null).length;
    }

    addProvider() {
        this.providers.push(null);
    }

    addConsumer() {
        this.consumers.push(null);
    }

    findAnullableAccords(accords: Accords): IndexedAccord[] {
        let result: IndexedAccord[] = [];
        for(let p = 0; p < this.providers.length; p++) {
            var pIsNull = this.providers[p] == null;
            for(let c = 0; c < this.consumers.length; c++) {
                var cIsNull = this.consumers[c] == null;
                var accord = accords.accords[p][c];
                if(pIsNull !== cIsNull && accord.amount == null)
                    result.push(new IndexedAccord(accord, p, c));
            }
        }
        return result;
    }

    calculate(accords: Accords, numOfNullAccords: number) {
        this.reset();
        this.providers[0] = 0; // let it be

        let queue: pqe[] = [];
        queue.push(new pqe(Route.Provide, 0, 0));

        do {
            var e = queue.pop();

            let potentials: number[];
            let acc: Accord[];

            switch(e.route) {
                case Route.Provide:
                    potentials = this.consumers;
                    acc = accords.getProviders(e.id);
                    break;
                case Route.Consume:
                    potentials = this.providers;
                    acc = accords.getConsumers(e.id);
                    break;
            }

            var updated = this.setPotentials(potentials, e.value, acc);
            for(let i of updated) {
                queue.push(new pqe(oppositeRoute(e.route), i, potentials[i]));
            }

            if(queue.length <= 0) {
                if(numOfNullAccords == 0)
                    break;
                var anulled = this.findAnullableAccords(accords).sort((a, b): number => {
                    if(a.cost < b.cost) return -1;
                    if(a.cost > b.cost) return +1;
                    if(a.consumer < b.consumer) return +1;
                    if(a.consumer > b.consumer) return -1;
                    if(a.provider < b.provider) return +1;
                    if(a.provider > b.provider) return -1;
                    return 0;
                })[0];
                accords.setAmount(anulled, 0);
                if(this.providers[anulled.provider] != null) {
                    queue.push(new pqe(Route.Provide, anulled.provider, this.providers[anulled.provider]));
                } else if(this.consumers[anulled.consumer] != null) {
                    queue.push(new pqe(Route.Consume, anulled.consumer, this.consumers[anulled.consumer]));
                } else {
                    throw "both anulled potentials are nulls!";
                }
                numOfNullAccords--;
            }
        } while(true);

        if(this.countNulls() != 0) {
            throw "countNulls() != 0";
        }
    }

    setPotentials(potentials: number[], prevValue: number, accords: Accord[]): number[] {
        let updated: number[] = [];
        for(let i = 0; i < potentials.length; i++) {
            if(accords[i].amount === null || accords[i].amount === undefined)
                continue;
            var potential = accords[i].cost - prevValue;
            if(potentials[i] !== null) {
                if(potentials[i] == potential)
                    continue;
                else
                    throw "potentials do not match!";
            }
            potentials[i] = potential;
            updated.push(i);
        }
        return updated;
    }
}

export class ProblemSolver {
    problem: Problem;
    potentials: Potentials;

    constructor(problem: Problem) {
        this.problem = problem;
        this.potentials = new Potentials(this.problem.providers.length, this.problem.consumers.length);
    }

    buildCurve(start: AOrigin): AOrigin[] {
        let neighbours: AOrigin[];
        let paths: AOrigin[][];
        paths = [[start]];

        while(true) {
            let pathsExtended: boolean = false;
            let newPaths: AOrigin[][] = [];
            for(let path of paths) {
                let last: AOrigin;
                let prev: AOrigin;

                last = path[path.length-1];
                if(path.length > 1)
                    prev = path[path.length-2];

                var neigh = this.problem.accords.crossFindRelocatable(last).filter(
                    n => {
                        if(path.findIndex(m => m.EqualsTo(n)) !== -1)
                            return false;
                        if(prev && n.hasCommon(prev))
                            return false;
                        return true;
                    }
                );
                if(neigh.length > 0) {
                    pathsExtended = true;
                    for(let n of neigh)
                        newPaths.push(path.concat(n));
                } else {
                    newPaths.push(path);
                }
            }
            paths = newPaths;

            if(!pathsExtended)
                return [];

            // If some paths have common tail,
            // join them and return as a curve
            for(let i = 0; i < paths.length; i++) {
                for(let j = i + 1; j < paths.length; j++) {
                    var pi = paths[i];
                    var pj = paths[j];
                    if(pi[pi.length-1].EqualsTo(pj[pj.length-1])) {
                        return pi.concat(pj.slice(1, -1).reverse());
                    }
                }
            }
        }
    }

    // Makes initial filling using "Least cost" method
    initialFilling(): number {
        let ixAccords: IndexedAccord[];

        // Residuals of providers and consumers
        let provides: number[];
        let consumes: number[];

        let filledProviders: Set<number>;
        let filledConsumers: Set<number>;

        ixAccords = this.problem.accords.indexed();
        provides = this.problem.providers.map(x => x.provides);
        consumes = this.problem.consumers.map(x => x.consumes);
        filledProviders = new Set<number>();
        filledConsumers = new Set<number>();

        function minGoods(orig: AOrigin): [number, Route] {
            var p = provides[orig.provider];
            var c = consumes[orig.consumer];
            if(p <= c)
                return [p, Route.Provide];
            else
                return [c, Route.Consume];
        }

        // Sort indexed accords by cost / residuals of goods
        ixAccords.sort((a, b): number => {
            var a_cost = a.cost;//!= 0 ? a.cost : Infinity;
            var b_cost = b.cost;//!= 0 ? b.cost : Infinity;
            if(a_cost < b_cost) return -1;
            if(a_cost > b_cost) return +1;
            var a_goods = minGoods(a);
            var b_goods = minGoods(b);
            if(a_goods < b_goods) return -1;
            if(a_goods > b_goods) return +1;
            if(a.provider < b.provider) return -1;
            if(a.provider > b.provider) return +1;
            if(a.consumer < b.consumer) return -1;
            if(a.consumer > b.consumer) return +1;
            return 0;
        });

        for(let accord of ixAccords) {
            if(filledProviders.has(accord.provider) ||
               filledConsumers.has(accord.consumer))
                continue;

            var [goods, route] = minGoods(accord);
            this.problem.accords.setAmount(accord, goods);
            switch(route) {
                case Route.Provide:
                    filledProviders.add(accord.provider);
                    break;
                case Route.Consume:
                    filledConsumers.add(accord.consumer);
                    break;
            }
            provides[accord.provider] -= goods;
            consumes[accord.consumer] -= goods;
        }

        return filledConsumers.size + filledProviders.size;
    }

    solve() {
        // Fix shortage
        var shortage = this.problem.shortage();
        if(shortage > 0) {
            // Make fake provider
            this.problem.addProvider("Fake", shortage);
            this.potentials.addProvider();
        } else if(shortage < 0) {
            // Make fake consumer
            this.problem.addConsumer("Fake", -shortage);
            this.potentials.addConsumer();
        }

        var initFilled = this.initialFilling();
        let numOfNullAccords: number = (this.problem.providers.length + this.problem.consumers.length - 1) - initFilled;

        while(true) {
            this.potentials.calculate(this.problem.accords, numOfNullAccords);
            numOfNullAccords = 0;

            let minEst: number = Infinity;
            let minEstOrigin: AOrigin;
            for(let pid = 0; pid < this.problem.providers.length; pid++) {
                for(let cid = 0; cid < this.problem.consumers.length; cid++) {
                    if(this.problem.accords.accords[pid][cid].amount != null)
                        continue;
                    var est = this.problem.accords.accords[pid][cid].cost - (this.potentials.providers[pid] + this.potentials.consumers[cid]);
                    if(est < minEst) {
                        minEst = est;
                        minEstOrigin = new AOrigin(pid, cid);
                    }
                }
            }

            if(minEst >= 0) {
                break;
            }

            var curve = this.buildCurve(minEstOrigin);
            if(curve.length == 0)
                throw "couldn't build the curve";

            // Find lowest amount on the curve
            let minAmount: number = Infinity;
            let minAmountOrigin: AOrigin;
            for(let i = 1; i < curve.length; i += 2) {
                var vertex = curve[i];
                var amount = this.problem.accords.get(vertex).amount;
                if(amount < minAmount) {
                    minAmount = amount;
                    minAmountOrigin = vertex;
                }
            }
            if(minAmount == Infinity)
                throw "minAmount == Infinity";

            // Relocate goods
            curve.forEach((vertex, index) => {
                if(vertex == minAmountOrigin) {
                    this.problem.accords.setAmount(vertex, null);
                } else if(vertex == minEstOrigin) {
                    this.problem.accords.setAmount(vertex, minAmount);
                } else {
                    var mul = index & 1 ? -1 : +1;
                    this.problem.accords.addAmount(vertex, mul * minAmount);
                }
            });
        }
    }
}

enum Route {
    Provide,
    Consume,
}

function oppositeRoute(route: Route): Route {
    if(route == Route.Provide) return Route.Consume;
    if(route == Route.Consume) return Route.Provide;
    throw "unknown route";
}

