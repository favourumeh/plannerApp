import { queryOptions, keepPreviousData } from "@tanstack/react-query"
import { fetchTasksObjectiveAndProject } from "../fetch_entities"

export default function readTasksObjectiveAndProjectQueryOption(taskId, handleNotification) {
    return queryOptions({
        queryKey: [`projAndObjByTaskId`, taskId],
        queryFn: () =>  fetchTasksObjectiveAndProject(taskId, handleNotification),
        placeholderData: keepPreviousData, 
        retry: 3,
    })
}
