import { queryOptions, keepPreviousData } from "@tanstack/react-query"
import { fetchTasksObjectiveAndProject } from "../fetch_entities"

export default function readTasksObjectiveAndProjectQueryOption(taskId, handleNotification, handleLogout) {
    return queryOptions({
        queryKey: [`proj-and-obj-from-task-id-${taskId}`, taskId],
        queryFn: () =>  fetchTasksObjectiveAndProject(taskId, handleNotification, handleLogout),
        placeholderData: keepPreviousData, 
        retry: 3,
    })
}
