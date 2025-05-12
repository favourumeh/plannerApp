import { queryOptions, keepPreviousData } from "@tanstack/react-query"
import { fetchTaskByStartDate } from "../fetch_entities"

export default function readTaskByDateQueryOptions(selectedDate, handleNotification, handleLogout) {
    return queryOptions({
        queryKey: ["selectedDate", selectedDate],
        queryFn: () =>  fetchTaskByStartDate(selectedDate, handleNotification, handleLogout),
        placeholderData: keepPreviousData, 
        retry: 3,
    })
}
