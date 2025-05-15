import { queryOptions, keepPreviousData } from "@tanstack/react-query"
import { fetchHomepageTasks } from "../fetch_entities"

export default function homepageTasksQueryOptions(selectedDate, handleNotification, handleLogout) {
    //query's db for the homepage's tasks
    return queryOptions({
        queryKey: ["homepage-tasks", {"selectedDate":selectedDate}],
        queryFn: () =>  fetchHomepageTasks(selectedDate, handleNotification, handleLogout),
        placeholderData: keepPreviousData, 
        retry: 3,
    })
}
