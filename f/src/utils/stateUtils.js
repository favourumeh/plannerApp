export function persistState (key, default_, storageType="sessionStorage"){ // This function retrieves the state from sessionStorage or localStorage based on the key provided.
    if (storageType==="sessionStorage") {
        var state = JSON.parse(sessionStorage.getItem(key))
    } else if (storageType==="localStorage") {
        var state = JSON.parse(localStorage.getItem(key))
    } else {
        throw new Error("Invalid Storage Type. Use 'sessionStorage' or 'localStorage'.")
    }
    return state!=null? state:default_ 
}