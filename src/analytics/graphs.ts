import fs from 'fs';
import axios from 'axios';

export async function createTimeGraph(
  data: Record<string, [string, number][]>,
  target_file: string,
  title: string,
): Promise<void> {
  const parameters = {
    type: 'line',
    data: {
      datasets: Object.keys(data).map(label => {
        const dataset = data[label];
        return {
          label,
          fill: false,
          data: dataset.sort((a, b) => {
            const a_date = new Date(a[0]);
            const b_date = new Date(b[0]);
            return a_date.getMilliseconds() - b_date.getMilliseconds();
          }).map(d => {
            return {
              x: d[0],
              y: d[1]
            };
          })
        };
      })
    },
    options: {
      title: {
        display: true,
        text: title,
      },
    },
    scales: {
      xAxes: [{
        type: "time",
        time: {
          parser: "MM/DD/YYYY",
        },
        scaleLabel: {
          display: true,
          labelString: "Date"
        }
      }],
      yAxes: [{
        scaleLabel: {
          display: true,
          labelString: "Number of posts"
        }
      }]
    }
  };

  const url = "https://quickchart.io/chart?c=" + JSON.stringify(parameters);
  const response = await axios.get(url, {responseType: 'arraybuffer'});
  const buffer = await response.data;
  fs.writeFileSync(target_file, Buffer.from(buffer));
}



export async function createPieChart(
  data: [string, number][],
  target_file: string,
  title: string,
): Promise<void> {
  const parameters = {
    type: 'pie',
    data: {
      labels: data.map(d => d[0]),
      datasets: [{
        data: data.map(d => d[1].toFixed(3))
      }]
    },
    options: {
      title: {
        display: true,
        text: title,
      },
    },
  };

  const url = "https://quickchart.io/chart?c=" + JSON.stringify(parameters);
  const response = await axios.get(url, {responseType: 'arraybuffer'});
  const buffer = await response.data;
  fs.writeFileSync(target_file, Buffer.from(buffer));
}


export async function createBarGraph(
  data: [string, number][],
  target_file: string,
  y_axis?: string
): Promise<void> {
  const parameters = {
    type: 'bar',
    data: {
      labels: data.map(d => d[0]),
      datasets: [{
        label: y_axis ?? "Y values",
        data: data.map(d => d[1])
      }]
    }
  };

  const url = "https://quickchart.io/chart?c=" + JSON.stringify(parameters);
  const response = await axios.get(url, {responseType: 'arraybuffer'});
  const buffer = await response.data;
  fs.writeFileSync(target_file, Buffer.from(buffer));
}
