class StandardScaler {
    private means: number[];
    private stds: number[];

    constructor() {
        this.means = [];
        this.stds = [];
    }

    fit(data: number[][]) {
        const numFeatures = data[0].length;

        // Calculate means and standard deviations for each feature
        for (let i = 0; i < numFeatures; i++) {
            const column = data.map(row => row[i]);
            const mean = column.reduce((acc, val) => acc + val, 0) / column.length;
            const std = Math.sqrt(column.map(val => (val - mean) ** 2).reduce((acc, val) => acc + val, 0) / column.length);
            this.means.push(mean);
            this.stds.push(std);
        }
    }

    transform(data: number[][]) {
        return data.map(row =>
            row.map((val, i) => (val - this.means[i]) / this.stds[i])
        );
    }

    fit_transform(data: number[][]) {
        this.fit(data);
        return this.transform(data);
    }
}

// // Example usage
// const scaler = new StandardScaler();
// const data = [[1, 2], [3, 4], [5, 6]];

// // Fit to data and transform
// scaler.fit(data);
// const scaledData = scaler.transform(data);
// console.log(scaledData);

// // Fit to data and transform in one step
// const scaledData2 = scaler.fit_transform(data);
// console.log(scaledData2);

export const fit_transform = (data: any[][]) => {
    const scaler = new StandardScaler()
    return scaler.fit_transform(data)
}