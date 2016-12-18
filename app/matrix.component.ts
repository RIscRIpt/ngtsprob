import { Component } from '@angular/core';
import { Problem } from './problem';
import { Accord } from './accord';
import { Provider } from './provider';
import { Consumer } from './consumer';

@Component({
  selector: 'matrix',
  templateUrl: "./app/matrix.component.html",
})

export class MatrixComponent {
    editable   : boolean;
    isReady    : boolean;
    isSolvable : boolean;
    problem    : Problem;
    solution   : string;

    constructor() {
        var count = 100;
        this.editable = true;
        this.problem = new Problem(count, count);
        this.onChange();

        for(let i = 0; i < count; i++) {
            this.problem.providers[i].provides = rand(100, 10000);
            this.problem.consumers[i].consumes = rand(100, 10000);
            for(let j = 0; j < count; j++) {
                this.problem.accords.accords[i][j].cost = rand(1, 9);
            }
        }
    }

    onChange() {
        this.isReady = this.problem.isReady();
        this.isSolvable = this.isReady && this.editable;
    }

    solve() {
        // console.log(this.problem);
        if(!this.isReady) {
            return;
        }
        var cost = this.problem.solve();
        this.editable = false;
        this.solution = "Optimal cost = ";
        this.problem.accords.forEach(accord => {
            if(accord.amount > 0 && accord.cost != 0) {
                if(this.solution[this.solution.length-1] != ' ')
                    this.solution += " + ";
                this.solution += accord.amount.toString() + '·' + accord.cost.toString();
            }
            return true;
        });
        this.solution += " = " + cost.toString();
        this.onChange();
    }

    reset() {
        this.problem = new Problem(1, 1);
        this.editable = true;
        this.solution = "";
    }

    addProvider() {
        this.problem.addProvider();
        this.onChange();
    }

    addConsumer() {
        this.problem.addConsumer();
        this.onChange();
    }

    delProvider(pid: number) {
        this.problem.delProvider(pid);
        this.onChange();
    }

    delConsumer(cid: number) {
        this.problem.delConsumer(cid);
        this.onChange();
    }
}

function rand(min: number, max: number): number {
    return Math.floor(Math.random() * max) + min;
}

