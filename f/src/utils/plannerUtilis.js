const colourDict = {// colour dict for the workload bar of the planner page
    "red":"rgba(255, 59, 48, 0.8)",
    "orange": "rgba(255, 149, 0, 0.8)",
    "yellow":"rgba(255, 204, 0, 0.8)",
    "light-green": "rgba(52, 199, 89, 0.6)",
    "green": "rgba(48, 209, 88, 0.8)"
}

export function genereateWorkloadFill(workloadHours) { //Determines the colour of date card workload bar based on the total task hours
        if (workloadHours<=2) {
            return colourDict["light-green"]
        } else if (workloadHours >2 && workloadHours<=3.5 )  {
            return colourDict["green"]
        } else if (workloadHours>3.5 && workloadHours<=5.5){
            return colourDict["yellow"]
        }  else if (workloadHours>5.5 && workloadHours<=6.5){
            return colourDict["orange"]
        } else {
            return colourDict["red"]
        }
}
