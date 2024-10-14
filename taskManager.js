class Task {
    constructor(name, fetchFunction, handleDataFunction) {
        this.name = name;
        this.fetchFunction = fetchFunction;
        this.handleDataFunction = handleDataFunction;
        this.interval = null;
    }

    async execute() {
        try {
            const data = await this.fetchFunction();
            if (data) {
                this.handleNewData(data);
            }
        } catch (error) {
            console.error(`Error executing task "${this.name}":`, error);
        }
    }

    handleNewData(data) {
        console.log(`Handling new data for task "${this.name}":`, data);
        if (this.handleDataFunction) {
            this.handleDataFunction(data);
        }
    }

    start(interval) {
        console.log(`Starting task "${this.name}" with interval ${interval}ms`);
        this.interval = setInterval(() => this.execute(), interval);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            console.log(`Task "${this.name}" stopped.`);
        }
    }
}

class TaskManager {
    constructor() {
        this.tasks = [];
    }

    addTask(task) {
        this.tasks.push(task);
    }

    startAll(interval) {
        console.log(`Starting all tasks with interval ${interval}ms`);
        this.tasks.forEach(task => task.start(interval));
    }

    stopAll() {
        console.log("Stopping all tasks");
        this.tasks.forEach(task => task.stop());
    }

    retryTask(taskName) {
        const task = this.tasks.find(t => t.name === taskName);
        if (task) {
            console.log(`Retrying task "${taskName}"`);
            task.execute();
        }
    }
}

module.exports = { Task, TaskManager };
