const colourDict = {// colour dict for the progress page
    "red":"rgba(255, 59, 48, 0.8)",
    "orange": "rgba(255, 149, 0, 0.8)",
    "yellow":"rgba(255, 204, 0, 0.8)",
    "light-green": "rgba(52, 199, 89, 0.6)",
    "green": "rgba(48, 209, 88, 0.8)"
}

export function generateProgressBarColour(progressPercentage) { //Determines the colour of the progress bar based on the progress percentage
        if (progressPercentage<=30) {
            return colourDict["red"]
        } else if (progressPercentage<=60 )  {
            return colourDict["yellow"]
        } else if (progressPercentage<80){
            return colourDict["orange"]
        } else {
            return colourDict["green"]
        }
}

export { colourDict }

