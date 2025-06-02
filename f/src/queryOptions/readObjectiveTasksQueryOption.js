import { queryOptions, keepPreviousData } from "@tanstack/react-query"
import { fetchObjectiveTasks } from "../fetch_entities"

export default function readObjectivesTasksQueryOption(objectiveId, handleNotification, handleLogout) {
    return queryOptions({
        queryKey: [`objectives-tasks`, {"objectiveId": objectiveId}],
        queryFn: () =>  fetchObjectiveTasks({objectiveId, handleNotification, handleLogout}),
        placeholderData: keepPreviousData, 
        retry: 3,
    })
}
